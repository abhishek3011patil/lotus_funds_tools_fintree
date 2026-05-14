import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { sendApprovalMail } from "../config/mailer";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";

const getClientIp = (req: Request) => {
  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};

export const approveUser = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: "userId and type required",
      });
    }

    await client.query("BEGIN");

    let name = "";
    let email = "";
    let role = "";

    // ================= GET DETAILS =================
    if (type === "RA") {

      const result = await client.query(
        `
        SELECT first_name, surname, email
        FROM ra_details
        WHERE id = $1
        `,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("RA not found");
      }

      const ra = result.rows[0];

      name = `${ra.first_name} ${ra.surname}`;
     email = String(ra.email || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");

      role = "RESEARCH_ANALYST";

    } else if (type === "BROKER") {

      const result = await client.query(
        `
        SELECT legal_name, email
        FROM broker_details
        WHERE id = $1
        `,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Broker not found");
      }

      const broker = result.rows[0];

      name = broker.legal_name;
      email = String(broker.email || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");
  
      role = "BROKER";

    } else {

      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

  // ================= CHECK EXISTING USER =================
const normalizedEmail = email
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");

const existingUser = await client.query(
  `
  SELECT id, email, status
  FROM users
  WHERE LOWER(TRIM(email)) = $1
  LIMIT 1
  `,
  [normalizedEmail]
);

if (existingUser.rows.length > 0) {

  await client.query("ROLLBACK");

  console.log("USER ALREADY EXISTS:", existingUser.rows[0]);

  return res.status(409).json({
    success: false,
   message: `${type} already approved`,
  });
}
    // ================= CREATE USER =================
    const tempPassword = await bcrypt.hash("temp123", 10);

    const insertRes = await client.query(
      `
      INSERT INTO users
      (
        name,
        email,
        username,
        password_hash,
        role,
        status,
        created_at
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,NOW()
      )
      RETURNING id
      `,
      [
        name,
        email,
        email.split("@")[0],
        tempPassword,
        role,
        "inactive",
      ]
    );

    const finalUserId = insertRes.rows[0].id;

    // ================= UPDATE DETAILS TABLE =================
    if (type === "RA") {

      await client.query(
        `
        UPDATE ra_details
        SET status = 'approved',
            user_id = $1
        WHERE id = $2
        `,
        [finalUserId, userId]
      );

    } else {

      await client.query(
        `
        UPDATE broker_details
        SET status = 'approved',
            user_id = $1
        WHERE id = $2
        `,
        [finalUserId, userId]
      );
    }

    // ================= CREATE RESET TOKEN =================
    const token = crypto.randomBytes(32).toString("hex");

    await client.query(
      `
      UPDATE users
      SET reset_token = $1,
          token_expiry = $2
      WHERE id = $3
      `,
      [
        token,
        new Date(Date.now() + 60 * 60 * 1000),
        finalUserId,
      ]
    );

    // ================= COMMIT =================
    await client.query("COMMIT");

    // ================= AUDIT LOG =================
    await createAuditLog({
      adminId: req.user?.id,

      adminName: req.user?.name || "ADMIN",

      adminRole: req.user?.role || "ADMIN",

      action: "APPROVE",

      module: type,

      targetEntity: email,

      targetType: type,

      description: `${type} approved by admin`,

      status: "SUCCESS",

      ipAddress: getClientIp(req),

      device: req.headers["user-agent"] as string,

      oldValue: {
        status: "pending",
      },

      newValue: {
        status: "approved",
        user_id: finalUserId,
      },
    });

    // ================= SEND EMAIL =================
    const link = `${process.env.FRONTEND_URL}/subscription?token=${token}`;
    await sendApprovalMail(email, name, link);
    
    return res.json({
      success: true,
      message: `${type} approved successfully ✅`,
      user_id: finalUserId,
    });

  } catch (error) {

   try {
  await client.query("ROLLBACK");
} catch (rollbackError) {
  console.error("Rollback Error:", rollbackError);
}

    console.error("Approve Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Server error",
    });

  } finally {
    client.release();
  }
};