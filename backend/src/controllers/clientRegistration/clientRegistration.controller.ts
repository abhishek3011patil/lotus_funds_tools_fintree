import bcrypt from "bcrypt";
import fs from "fs/promises";
import type { Request, Response } from "express";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { createAuditLog } from "../../utils/auditLogger";

export const getClientsForAdmin = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         client.id,
         client.name,
         client.username,
         client.email,
         client.status,
         client.is_active,
         client.created_at,
         client.suspended_at,
         client.suspended_reason,
         profile.first_name,
         profile.last_name,
         profile.phone_number,
         profile.profile_image
       FROM users client
       LEFT JOIN client_profiles profile ON profile.user_id = client.id
       WHERE client.role = 'CLIENT'
       ORDER BY client.created_at DESC`
    );

    return res.json({ success: true, clients: result.rows });
  } catch (error) {
    console.error("ADMIN CLIENT LIST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load clients.",
    });
  }
};

export const activateClient = async (req: AuthRequest, res: Response) => {
  const clientId = String(req.params.id || "").trim();

  try {
    const result = await pool.query(
      `UPDATE users
       SET status = 'active',
           is_active = true,
           suspended_at = NULL,
           suspended_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND role = 'CLIENT'
         AND status = 'suspended'
       RETURNING id, name, email, role, status`,
      [clientId]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Only a suspended client can be activated.",
      });
    }

    const client = result.rows[0];
    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "ACTIVATE",
      module: "CLIENT",
      targetEntity: client.email,
      targetType: "CLIENT",
      description: "Client account activated",
      status: "SUCCESS",
      ipAddress: req.ip,
      device: req.headers["user-agent"],
      oldValue: { status: "suspended" },
      newValue: { status: "active" },
    });

    return res.json({ success: true, message: "Client activated successfully" });
  } catch (error) {
    console.error("ACTIVATE CLIENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to activate client.",
    });
  }
};

const removeUploadedFile = async (file?: Express.Multer.File) => {
  if (!file?.path) return;
  await fs.unlink(file.path).catch(() => undefined);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must contain at least 8 characters.";
  if (Buffer.byteLength(password, "utf8") > 72) return "Password must not exceed 72 bytes.";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  return null;
};

export const registerClient = async (req: Request, res: Response) => {
  const firstName = String(req.body?.firstName || "").trim();
  const lastName = String(req.body?.lastName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phoneNumber = String(req.body?.phoneNumber || "").trim();
  const password = String(req.body?.password || "");
  const confirmPassword = String(req.body?.confirmPassword || "");
  const profilePicture = req.file;

  if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
    await removeUploadedFile(profilePicture);
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, phone number and password are required.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await removeUploadedFile(profilePicture);
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (!/^[1-9]\d{9,14}$/.test(phoneDigits)) {
    await removeUploadedFile(profilePicture);
    return res.status(400).json({
      success: false,
      message: "Enter a valid phone number with country code.",
    });
  }

  if (password !== confirmPassword) {
    await removeUploadedFile(profilePicture);
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    await removeUploadedFile(profilePicture);
    return res.status(400).json({ success: false, message: passwordError });
  }

  const db = await pool.connect();
  let committed = false;

  try {
    await db.query("BEGIN");
    const existing = await db.query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = $1
         AND role = 'CLIENT'
       LIMIT 1`,
      [email]
    );

    if ((existing.rowCount || 0) > 0) {
      await db.query("ROLLBACK");
      await removeUploadedFile(profilePicture);
      return res.status(409).json({
        success: false,
        message: "An account already exists for this email. Please sign in.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();
    const userResult = await db.query(
      `INSERT INTO users (
         name, email, username, password_hash,
         role, status, is_active, payment_status,
         created_at, updated_at
       ) VALUES ($1, $2::varchar, $2::text, $3, 'CLIENT', 'active', true, 'unpaid', NOW(), NOW())
       RETURNING id, email`,
      [fullName, email, passwordHash]
    );

    await db.query(
      `INSERT INTO client_profiles (
         user_id, first_name, last_name, phone_number, profile_image
       ) VALUES ($1, $2, $3, $4, $5)`,
      [
        userResult.rows[0].id,
        firstName,
        lastName,
        phoneDigits,
        profilePicture?.filename || null,
      ]
    );

    await db.query("COMMIT");
    committed = true;

    return res.status(201).json({
      success: true,
      message: "Registration completed. You can now sign in.",
      account: { email: userResult.rows[0].email },
    });
  } catch (error: any) {
    if (!committed) await db.query("ROLLBACK").catch(() => undefined);
    await removeUploadedFile(profilePicture);

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account already exists for this email. Please sign in.",
      });
    }

    console.error("CLIENT REGISTRATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete client registration.",
    });
  } finally {
    db.release();
  }
};
