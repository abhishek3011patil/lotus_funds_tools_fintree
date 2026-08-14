import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { sendApprovalMail } from "../config/mailer";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";
import { emailService } from "../services/email";

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

/* =========================================================
   APPROVE USER (POST /admin/approve-user)
   ========================================================= */
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
   const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;


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
    const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
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

/* =========================================================
   SUSPEND USER (POST /admin/suspend-user)
   ========================================================= */
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

    //console.log("FOUND USER:", userRes.rows);

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


/* =========================================================
   ACTIVATE RESEARCH ANALYST (PUT /admin/activate/ra/:id)
   ========================================================= */
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


/* =========================================================
   RESEND PASSWORD LINK (POST /admin/resend-password-link)
   ========================================================= */
export const resendPasswordLink = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = String(req.body?.userId || "").trim();

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  const configuredTtlHours = Number(
    process.env.PASSWORD_SETUP_TOKEN_TTL_HOURS || 24
  );
  const tokenTtlHours =
    Number.isFinite(configuredTtlHours) && configuredTtlHours > 0
      ? Math.min(Math.floor(configuredTtlHours), 168)
      : 24;
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");

  if (!frontendUrl) {
    return res.status(503).json({
      success: false,
      message: "Password setup links are not configured.",
    });
  }

  const db = await pool.connect();
  let transactionOpen = false;

  try {
    await db.query("BEGIN");
    transactionOpen = true;

    const userRes = await db.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        status,
        is_active,
        password_hash,
        token_expiry
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (userRes.rowCount === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userRes.rows[0];

    if (!["RESEARCH_ANALYST", "CLIENT"].includes(user.role)) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      return res.status(409).json({
        success: false,
        message: "Password setup resend is available only for research analyst and client accounts.",
      });
    }

    const passwordSetupPending =
      !user.password_hash &&
      user.status === "inactive" &&
      user.is_active === false;
    const passwordResetAvailable =
      Boolean(user.password_hash) &&
      user.status === "active" &&
      user.is_active === true;

    if (!passwordSetupPending && !passwordResetAvailable) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      return res.status(409).json({
        success: false,
        message: "Password links are available only for inactive accounts awaiting setup or active accounts.",
      });
    }

    let registrationApplicationId: string | null = null;

    if (passwordSetupPending) {
      const registrationResult = await db.query(
        `SELECT application.id AS registration_application_id
         FROM registration_applications application
         INNER JOIN subscriptions subscription
           ON subscription.registration_application_id = application.id
         WHERE application.user_id = $1
           AND application.status = 'APPROVED'
           AND subscription.status = 'ACTIVE'
         ORDER BY application.approved_at DESC NULLS LAST
         LIMIT 1`,
        [userId]
      );

      if (registrationResult.rowCount === 0) {
        await db.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({
          success: false,
          message: "An approved registration with an active subscription is required.",
        });
      }

      registrationApplicationId =
        registrationResult.rows[0].registration_application_id;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(
      Date.now() + tokenTtlHours * 60 * 60 * 1000
    );

    if (passwordSetupPending) {
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      await db.query(
        `UPDATE password_setup_tokens
         SET revoked_at = NOW()
         WHERE user_id = $1
           AND used_at IS NULL
           AND revoked_at IS NULL`,
        [userId]
      );

      await db.query(
        `INSERT INTO password_setup_tokens (
           user_id,
           registration_application_id,
           token_hash,
           expires_at
         ) VALUES ($1, $2, $3, $4)`,
        [userId, registrationApplicationId, tokenHash, tokenExpiry]
      );

      await db.query(
        `UPDATE users
         SET reset_token = NULL,
             token_expiry = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
    } else {
      await db.query(
        `UPDATE users
         SET reset_token = $1,
             token_expiry = $2,
             otp = NULL,
             otp_expiry = NULL,
             updated_at = NOW()
         WHERE id = $3`,
        [token, tokenExpiry, userId]
      );
    }

    await db.query("COMMIT");
    transactionOpen = false;

    const link = passwordSetupPending
      ? `${frontendUrl}/set-password?token=${encodeURIComponent(token)}`
      : `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const emailResult = passwordSetupPending
      ? await emailService.send(
          "PASSWORD_SETUP_RESENT",
          user.email,
          {
            name: user.name,
            passwordSetupUrl: link,
            expiresInHours: tokenTtlHours,
          }
        )
      : await emailService.send(
          "PASSWORD_RESET_LINK",
          user.email,
          {
            name: user.name,
            passwordResetUrl: link,
            expiresInHours: tokenTtlHours,
          }
        );

    if (!emailResult.sent) {
      const message =
        emailResult.reason === "EMAIL_DISABLED"
          ? "Email delivery is disabled on the server."
          : emailResult.reason === "EMAIL_NOT_CONFIGURED"
            ? "Email delivery is not fully configured on the server."
            : "The password email could not be delivered.";

      return res.status(503).json({
        success: false,
        message,
      });
    }

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "PASSWORD_LINK_RESENT",
      module: "USER_MANAGEMENT",
      targetEntity: user.email,
      targetType: "USER",
      description: passwordSetupPending
        ? "Password setup link resent by admin"
        : "Password reset link sent by admin",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: {
        previousLegacyTokenExpiry: user.token_expiry || null,
      },
      newValue: {
        userId,
        email: user.email,
        tokenExpiry,
      },
    });

    return res.status(200).json({
      success: true,
      message: passwordSetupPending
        ? "A new password setup link was sent successfully."
        : "A password reset link was sent successfully.",
    });
  } catch (error) {
    if (transactionOpen) {
      await db.query("ROLLBACK");
    }
    console.error("Resend Password Link Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send the password link.",
    });
  } finally {
    db.release();
  }
};


/* =========================================================
   GET DISCLAIMER HISTORY BY RESEARCH ANALYST (GET /admin/history/:userId)
   ========================================================= */
export const getDisclaimerHistoryByRA = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
        dh.id,
        dh.version_number,
        dh.disclaimer_text,
        dh.created_at,
        u.name,
        u.username,
        u.email
      FROM disclaimer_history dh
      JOIN users u ON u.id = dh.ra_user_id
      WHERE dh.ra_user_id = $1
      ORDER BY dh.version_number DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      ra: result.rows[0]
        ? {
            name: result.rows[0].name,
            username: result.rows[0].username,
            email: result.rows[0].email,
          }
        : null,
      history: result.rows,
    });
  } catch (error) {
    console.error("GET DISCLAIMER HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
