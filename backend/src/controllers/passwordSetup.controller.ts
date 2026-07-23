import crypto from "crypto";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

type PasswordSetupBody = {
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

const getString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"]
    ?.toString()
    .split(",")[0]
    ?.trim();

  const ip =
    forwarded ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  if (ip === "::1") {
    return "127.0.0.1";
  }

  return ip.startsWith("::ffff:")
    ? ip.replace("::ffff:", "")
    : ip;
};

const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "hidden";
  }

  const visibleLocal =
    localPart.length <= 2
      ? localPart.slice(0, 1)
      : localPart.slice(0, 2);

  return `${visibleLocal}${"*".repeat(
    Math.max(localPart.length - visibleLocal.length, 2)
  )}@${domain}`;
};

const validatePassword = (
  password: string
): string | null => {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  /*
   * bcrypt uses only the first 72 bytes. Reject longer values
   * instead of silently accepting a truncated password.
   */
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 bytes.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  return null;
};

const getTokenRecord = async (
  tokenHash: string
) =>
  pool.query(
    `
      SELECT
        setup_token.id AS setup_token_id,
        setup_token.user_id,
        setup_token.registration_application_id,
        setup_token.expires_at,
        setup_token.used_at,
        setup_token.revoked_at,

        user_account.name,
        user_account.email,
        user_account.role,
        user_account.status AS user_status,
        user_account.is_active,
        user_account.password_hash,

        application.status AS registration_status,
        subscription.id AS subscription_id,
        subscription.status AS subscription_status

      FROM password_setup_tokens setup_token

      INNER JOIN users user_account
        ON user_account.id = setup_token.user_id

      INNER JOIN registration_applications application
        ON application.id =
           setup_token.registration_application_id

      INNER JOIN subscriptions subscription
        ON subscription.registration_application_id =
           application.id

      WHERE setup_token.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

const validateRecord = (
  record: any
): { valid: true } | {
  valid: false;
  status: number;
  message: string;
} => {
  if (record.used_at) {
    return {
      valid: false,
      status: 409,
      message:
        "This password setup link has already been used.",
    };
  }

  if (record.revoked_at) {
    return {
      valid: false,
      status: 400,
      message:
        "This password setup link is no longer valid.",
    };
  }

  if (
    new Date(record.expires_at).getTime() <=
    Date.now()
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "This password setup link has expired.",
    };
  }

  if (
    record.registration_status !== "APPROVED"
  ) {
    return {
      valid: false,
      status: 409,
      message:
        "Registration has not been approved.",
    };
  }

  if (
    record.subscription_status !== "ACTIVE"
  ) {
    return {
      valid: false,
      status: 409,
      message:
        "The subscription is not active.",
    };
  }

  if (
    record.password_hash ||
    record.user_status === "active" ||
    record.is_active === true
  ) {
    return {
      valid: false,
      status: 409,
      message:
        "Password setup has already been completed.",
    };
  }

  return { valid: true };
};

/**
 * GET /api/auth/password-setup/validate?token=...
 *
 * Public endpoint. It confirms whether the emailed setup link
 * is usable without exposing the token hash or full email.
 */
export const validatePasswordSetupToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = getString(req.query.token);

  if (!token) {
    res.status(400).json({
      success: false,
      valid: false,
      message: "Password setup token is required.",
    });
    return;
  }

  /*
   * The generated token is 32 random bytes encoded as 64 hex
   * characters. Reject malformed values before querying.
   */
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    res.status(400).json({
      success: false,
      valid: false,
      message:
        "Invalid password setup link.",
    });
    return;
  }

  try {
    const result = await getTokenRecord(
      hashToken(token)
    );

    if (result.rows.length === 0) {
      res.status(400).json({
        success: false,
        valid: false,
        message:
          "Invalid password setup link.",
      });
      return;
    }

    const record = result.rows[0];
    const validation =
      validateRecord(record);

    if (!validation.valid) {
      res.status(validation.status).json({
        success: false,
        valid: false,
        message: validation.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      account: {
        name: record.name,
        email: maskEmail(record.email),
        role: record.role,
      },
      expiresAt: record.expires_at,
      nextStep: "SET_PASSWORD",
    });
  } catch (error) {
    console.error(
      "VALIDATE PASSWORD SETUP TOKEN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      valid: false,
      message:
        "Unable to validate the password setup link.",
    });
  }
};

/**
 * POST /api/auth/password-setup
 *
 * Body:
 * {
 *   token,
 *   password,
 *   confirmPassword
 * }
 *
 * The account becomes active only after this transaction
 * completes successfully.
 */
export const completePasswordSetup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = (req.body || {}) as PasswordSetupBody;

  const token = getString(body.token);
  const password =
    typeof body.password === "string"
      ? body.password
      : "";
  const confirmPassword =
    typeof body.confirmPassword === "string"
      ? body.confirmPassword
      : "";

  if (!token || !password || !confirmPassword) {
    res.status(400).json({
      success: false,
      message:
        "Token, password and confirmPassword are required.",
    });
    return;
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    res.status(400).json({
      success: false,
      message:
        "Invalid password setup link.",
    });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({
      success: false,
      message:
        "Password and confirmation do not match.",
    });
    return;
  }

  const passwordError =
    validatePassword(password);

  if (passwordError) {
    res.status(400).json({
      success: false,
      message: passwordError,
    });
    return;
  }

  const db = await pool.connect();
  let transactionOpen = false;

  let activatedUser:
    | {
        id: string;
        name: string;
        email: string;
        role: string;
        subscriptionId: string;
      }
    | undefined;

  try {
    await db.query("BEGIN");
    transactionOpen = true;

    const tokenHash = hashToken(token);

    /*
     * Lock all state that controls account activation. This
     * prevents two simultaneous requests from using one token.
     */
    const result = await db.query(
      `
        SELECT
          setup_token.id AS setup_token_id,
          setup_token.user_id,
          setup_token.registration_application_id,
          setup_token.expires_at,
          setup_token.used_at,
          setup_token.revoked_at,

          user_account.name,
          user_account.email,
          user_account.role,
          user_account.status AS user_status,
          user_account.is_active,
          user_account.password_hash,

          application.status AS registration_status,
          subscription.id AS subscription_id,
          subscription.status AS subscription_status

        FROM password_setup_tokens setup_token

        INNER JOIN users user_account
          ON user_account.id = setup_token.user_id

        INNER JOIN registration_applications application
          ON application.id =
             setup_token.registration_application_id

        INNER JOIN subscriptions subscription
          ON subscription.registration_application_id =
             application.id

        WHERE setup_token.token_hash = $1

        LIMIT 1

        FOR UPDATE OF
          setup_token,
          user_account,
          application,
          subscription
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(400).json({
        success: false,
        message:
          "Invalid password setup link.",
      });
      return;
    }

    const record = result.rows[0];
    const validation =
      validateRecord(record);

    if (!validation.valid) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(validation.status).json({
        success: false,
        message: validation.message,
      });
      return;
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await db.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          status = 'active',
          is_active = true,
          reset_token = NULL,
          token_expiry = NULL,
          otp = NULL,
          otp_expiry = NULL,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        hashedPassword,
        record.user_id,
      ]
    );

    await db.query(
      `
        UPDATE password_setup_tokens
        SET used_at = NOW()
        WHERE id = $1
      `,
      [record.setup_token_id]
    );

    /*
     * Revoke every other unused setup link for this account.
     */
    await db.query(
      `
        UPDATE password_setup_tokens
        SET revoked_at = NOW()
        WHERE user_id = $1
          AND id <> $2
          AND used_at IS NULL
          AND revoked_at IS NULL
      `,
      [
        record.user_id,
        record.setup_token_id,
      ]
    );

    /*
     * Registration access is no longer needed after the
     * permanent account password has been created.
     */
    await db.query(
      `
        UPDATE registration_applications
        SET
          registration_token_hash = NULL,
          registration_token_expires_at = NULL
        WHERE id = $1
      `,
      [
        record.registration_application_id,
      ]
    );

    await db.query(
      `
        INSERT INTO subscription_events (
          subscription_id,
          event_type,
          previous_status,
          new_status,
          actor_user_id,
          reason,
          metadata
        )
        VALUES (
          $1,
          'PASSWORD_SETUP_COMPLETED',
          'ACTIVE',
          'ACTIVE',
          $2,
          'Approved user completed password setup',
          $3::jsonb
        )
      `,
      [
        record.subscription_id,
        record.user_id,
        JSON.stringify({
          registrationApplicationId:
            record.registration_application_id,
          accountActivated: true,
        }),
      ]
    );

    await db.query("COMMIT");
    transactionOpen = false;

    activatedUser = {
      id: record.user_id,
      name: record.name,
      email: record.email,
      role: record.role,
      subscriptionId:
        record.subscription_id,
    };
  } catch (error: any) {
    if (transactionOpen) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "PASSWORD SETUP ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    if (error?.code === "23514") {
      res.status(409).json({
        success: false,
        message:
          "Account status could not be activated because of a database constraint.",
      });
      return;
    }

    console.error(
      "COMPLETE PASSWORD SETUP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to complete password setup.",
    });
    return;
  } finally {
    db.release();
  }

  if (!activatedUser) {
    res.status(500).json({
      success: false,
      message:
        "Password setup completed without an account result.",
    });
    return;
  }

  try {
    await createAuditLog({
      adminName: activatedUser.name,
      adminId: activatedUser.id,
      adminRole: activatedUser.role,
      action: "PASSWORD_SETUP_COMPLETED",
      module: "AUTH",
      targetEntity: activatedUser.email,
      targetType: "USER",
      description:
        "Approved user created a password and activated the account",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device:
        req.headers["user-agent"]?.toString() ||
        "",
      oldValue: {
        status: "inactive",
        isActive: false,
        passwordConfigured: false,
      },
      newValue: {
        status: "active",
        isActive: true,
        passwordConfigured: true,
        subscriptionId:
          activatedUser.subscriptionId,
      },
    });
  } catch (auditError) {
    console.error(
      "PASSWORD SETUP AUDIT ERROR:",
      auditError
    );
  }

  res.status(200).json({
    success: true,
    message:
      "Password created successfully. Your account is now active.",
    accountStatus: "active",
    nextStep: "LOGIN",
    loginPath: "/login",
  });
};
