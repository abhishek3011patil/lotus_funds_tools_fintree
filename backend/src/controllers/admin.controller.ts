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

  const existing = existingUser.rows[0];

  console.log("EXISTING USER:", existing);

  // ✅ RE-ACTIVATE SUSPENDED USER
  if (
    existing.status &&
    existing.status.toLowerCase() === "suspended"
  ) {

    // ================= CREATE NEW RESET TOKEN =================
    const token = crypto.randomBytes(32).toString("hex");

    // ✅ RESET USER FLOW AGAIN
    // User must do:
    // Email -> Payment -> Set Password -> OTP -> Login

    await client.query(
      `
      UPDATE users
      SET
        status = 'inactive',
        password_hash = $1,
        reset_token = $2,
        token_expiry = $3,
        suspended_at = NULL,
        suspended_reason = NULL,
        updated_at = NOW()
      WHERE id = $4
      `,
      [
        await bcrypt.hash("temp123", 10),
        token,
        new Date(Date.now() + 60 * 60 * 1000),
        existing.id,
      ]
    );

    // ================= UPDATE DETAILS TABLE =================
    if (type === "RA") {

      await client.query(
        `
        UPDATE ra_details
        SET
          status = 'approved',
          user_id = $1
        WHERE id = $2
        `,
        [existing.id, userId]
      );

    } else {

      await client.query(
        `
        UPDATE broker_details
        SET
          status = 'approved',
          user_id = $1
        WHERE id = $2
        `,
        [existing.id, userId]
      );
    }

    // ================= COMMIT =================
    await client.query("COMMIT");

    // ================= SEND EMAIL AGAIN =================
    const link = `${process.env.FRONTEND_URL}/subscription?token=${token}`;

    await sendApprovalMail(email, name, link);

    return res.status(200).json({
      success: true,
      message: `${type} reactivated successfully ✅`,
      user_id: existing.id,
    });
  }

  // ❌ ALREADY APPROVED USER
  await client.query("ROLLBACK");

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
/* ================= SUSPEND USER ================= */

export const suspendUser = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {

    // ✅ FIXED
    const { userId, suspendReason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId required",
      });
    }

    await client.query("BEGIN");

    // ✅ DEBUG LOG
    console.log("Suspend userId:", userId);

    const userRes = await client.query(
      `
      SELECT id, name, email, role, status
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    console.log("FOUND USER:", userRes.rows);

    if (userRes.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userRes.rows[0];

    if (user.role === "RESEARCH_ANALYST") {
  await client.query(
    `
    UPDATE ra_details
    SET status = 'suspended'
    WHERE user_id = $1
    `,
    [userId]
  );
}

if (user.role === "BROKER") {
  await client.query(
    `
    UPDATE broker_details
    SET status = 'suspended'
    WHERE user_id = $1
    `,
    [userId]
  );
}

    if (user.status.toLowerCase() !== "active") {

      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Cannot suspend ${user.status} user`,
      });
    }

    await client.query(
      `
      UPDATE users
      SET
        status = 'suspended',
        suspended_at = NOW(),
        suspended_reason = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        suspendReason || "Suspended by admin",
        userId,
      ]
    );

    await client.query("COMMIT");

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "SUSPEND",
      module: user.role,
      targetEntity: user.email,
      targetType: user.role,
      description: `${user.role} suspended by admin`,
      status: "SUCCESS",
      reason: suspendReason || "Suspended by admin",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: {
        status: "active",
      },
      newValue: {
        status: "suspended",
      },
    });

    return res.status(200).json({
      success: true,
      message: "User suspended successfully ✅",
    });

  } catch (error) {

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback Error:", rollbackError);
    }

    console.error("Suspend User Error:", error);

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


export const activateRA = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const oldData = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      `,
      [id]
    );
    const currentUser = oldData.rows[0];

if (!currentUser) {
  return res.status(404).json({
    success: false,
    message: "User not found",
  });
}

if (currentUser.status === "active") {
  return res.status(400).json({
    success: false,
    message: "User is already active",
  });
}

    const result = await pool.query(
      `
      UPDATE users
      SET
        status = 'active',
        is_active = true,
        suspended_at = NULL,
        suspended_reason = NULL
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await pool.query(
      `
     UPDATE ra_details
  SET status = 'approved'
  WHERE user_id = $1
      `,
      [id]
    );

    await createAuditLog({
      adminName: req.user?.name || "ADMIN",
      adminId: req.user?.id,
      adminRole: req.user?.role || "ADMIN",

      action: "ACTIVATE",
      module: "RA",

      targetEntity: result.rows[0].email,
      targetType: "RA",

      description: "RA account activated",

      status: "SUCCESS",

      ipAddress: getClientIp(req),
      device: req.headers["user-agent"],

      oldValue: oldData.rows[0],
      newValue: result.rows[0],
    });

    return res.status(200).json({
      success: true,
      message: "RA activated successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};