import crypto from "crypto";
import type { Response } from "express";
import { pool } from "../db";
import { sendApprovalMail } from "../config/mailer";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";

type ApplicantType = "RA" | "BROKER";

type ApprovalConfig = {
  applicantType: ApplicantType;
  role: "RESEARCH_ANALYST" | "BROKER";
  detailsTable: "ra_details" | "broker_details";
};

const APPROVAL_CONFIG: Record<
  ApplicantType,
  ApprovalConfig
> = {
  RA: {
    applicantType: "RA",
    role: "RESEARCH_ANALYST",
    detailsTable: "ra_details",
  },
  BROKER: {
    applicantType: "BROKER",
    role: "BROKER",
    detailsTable: "broker_details",
  },
};

const normalizeApplicantType = (
  value: unknown
): ApplicantType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toUpperCase();

  return normalized === "RA" ||
    normalized === "BROKER"
    ? normalized
    : null;
};

const getClientIp = (
  req: AuthRequest
): string => {
  const forwarded =
    req.headers["x-forwarded-for"]
      ?.toString()
      .split(",")[0]
      ?.trim();

  return (
    forwarded ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};

const normalizeEmail = (
  value: unknown
): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const createUsername = (
  email: string
): string => {
  const localPart =
    email.split("@")[0] || "user";

  const safeLocalPart = localPart
    .replace(/[^a-z0-9._-]/gi, "")
    .slice(0, 35);

  const suffix = crypto
    .randomBytes(4)
    .toString("hex");

  return `${safeLocalPart || "user"}_${suffix}`;
};

const createPasswordSetupLink = (
  plainToken: string
): string => {
  const frontendUrl = String(
    process.env.FRONTEND_URL || ""
  ).replace(/\/$/, "");

  if (!frontendUrl) {
    throw new Error(
      "FRONTEND_URL must be configured."
    );
  }

  return `${frontendUrl}/set-password?token=${encodeURIComponent(
    plainToken
  )}`;
};

const getPasswordTokenTtlHours =
  (): number => {
    const configured = Number(
      process.env.PASSWORD_SETUP_TOKEN_TTL_HOURS ||
        24
    );

    if (
      !Number.isFinite(configured) ||
      configured <= 0
    ) {
      return 24;
    }

    return Math.min(
      Math.floor(configured),
      168
    );
  };

/**
 * POST /admin/approve-user
 *
 * Existing frontend body remains unchanged:
 * {
 *   "userId": "<ra_details.id or broker_details.id>",
 *   "type": "RA" | "BROKER"
 * }
 *
 * Only registrations with:
 * registration_applications.status =
 * PAID_PENDING_APPROVAL
 *
 * and:
 * subscriptions.status =
 * PAID_PENDING_APPROVAL
 *
 * can be approved.
 */
export const approvePaidRegistration =
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const entityId =
        typeof req.body?.userId === "string"
          ? req.body.userId.trim()
          : "";

    const applicantType =
      normalizeApplicantType(req.body?.type);

    if (!entityId || !applicantType) {
      res.status(400).json({
        success: false,
        message:
          "userId and type (RA or BROKER) are required.",
      });
      return;
    }

    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        message:
          "Authenticated Admin user is required.",
      });
      return;
    }

    const config =
      APPROVAL_CONFIG[applicantType];

    const db = await pool.connect();
    let transactionOpen = false;

    let plainPasswordToken = "";
    let passwordSetupLink = "";
    let approvedResult:
      | {
          userId: string;
          subscriptionId: string;
          applicationId: string;
          name: string;
          email: string;
          username: string;
          subscriptionStartsAt: string;
          subscriptionExpiresAt: string;
          passwordTokenExpiresAt: string;
        }
      | undefined;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      /*
       * Table name comes only from APPROVAL_CONFIG,
       * never directly from request data.
       */
      const registrationResult =
        await db.query(
          `
            SELECT
              details.id AS entity_id,
              details.user_id AS details_user_id,
              details.status AS details_status,

              ${
                applicantType === "RA"
                  ? `TRIM(
                       CONCAT_WS(
                         ' ',
                         details.first_name,
                         details.surname
                       )
                     )`
                  : "details.legal_name"
              } AS applicant_name,

              details.email,

              application.id AS application_id,
              application.user_id AS application_user_id,
              application.status AS application_status,

              subscription.id AS subscription_id,
              subscription.user_id AS subscription_user_id,
              subscription.status AS subscription_status,
              subscription.duration_days_snapshot

            FROM ${config.detailsTable} details

            INNER JOIN registration_applications application
              ON application.entity_id = details.id
             AND application.applicant_type = $2

            INNER JOIN subscriptions subscription
              ON subscription.registration_application_id =
                 application.id

            WHERE details.id = $1

            ORDER BY application.created_at DESC
            LIMIT 1

            FOR UPDATE OF
              details,
              application,
              subscription
          `,
          [entityId, applicantType]
        );

      if (
        registrationResult.rows.length === 0
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(404).json({
          success: false,
          message:
            `${applicantType} paid registration was not found.`,
        });
        return;
      }

      const registration =
        registrationResult.rows[0];

      /*
       * Safe idempotent response for a completed approval.
       * Do not create another user or subscription period.
       */
      if (
        registration.application_status ===
          "APPROVED" &&
        registration.subscription_status ===
          "ACTIVE" &&
        registration.application_user_id
      ) {
        await db.query("COMMIT");
        transactionOpen = false;

        res.status(200).json({
          success: true,
          message:
            `${applicantType} registration is already approved.`,
          user_id:
            registration.application_user_id,
          subscription_id:
            registration.subscription_id,
          registration_status: "APPROVED",
          subscription_status: "ACTIVE",
          next_step: "PASSWORD_SETUP",
          alreadyApproved: true,
        });
        return;
      }

      if (
        registration.application_status !==
        "PAID_PENDING_APPROVAL"
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Registration must have a verified payment before Admin approval.",
          registrationStatus:
            registration.application_status,
        });
        return;
      }

      if (
        registration.subscription_status !==
        "PAID_PENDING_APPROVAL"
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Pending paid subscription was not found.",
          subscriptionStatus:
            registration.subscription_status,
        });
        return;
      }

      if (
        registration.details_user_id ||
        registration.application_user_id ||
        registration.subscription_user_id
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Registration is already linked to a user account.",
        });
        return;
      }

      const name = String(
        registration.applicant_name || ""
      ).trim();

      const email = normalizeEmail(
        registration.email
      );

      if (!name || !email) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Applicant name and email are required before approval.",
        });
        return;
      }

      const existingUser =
        await db.query(
          `
            SELECT
              id,
              status,
              role
            FROM users
            WHERE LOWER(TRIM(email)) = $1
            LIMIT 1
            FOR UPDATE
          `,
          [email]
        );

      if (existingUser.rows.length > 0) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "A user account already exists for this email. Do not create a duplicate account through registration approval.",
          existingUserId:
            existingUser.rows[0].id,
          existingStatus:
            existingUser.rows[0].status,
        });
        return;
      }

      const username =
        createUsername(email);

      /*
       * password_hash remains NULL until the applicant uses
       * the password setup link. Account remains inactive.
       */
      const userResult =
        await db.query(
          `
            INSERT INTO users (
              name,
              email,
              username,
              password_hash,
              role,
              status,
              is_active,
              payment_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              NULL,
              $4,
              'inactive',
              false,
              'paid',
              NOW(),
              NOW()
            )
            RETURNING
              id,
              username
          `,
          [
            name,
            email,
            username,
            config.role,
          ]
        );

      const finalUserId =
        userResult.rows[0].id;

      if (applicantType === "RA") {
        await db.query(
          `
            UPDATE ra_details
            SET
              status = 'approved',
              user_id = $1,
              approved_by = $2,
              approved_at = NOW(),
              rejection_reason = NULL
            WHERE id = $3
          `,
          [
            finalUserId,
            adminId,
            entityId,
          ]
        );
      } else {
        await db.query(
          `
            UPDATE broker_details
            SET
              status = 'approved',
              user_id = $1,
              approved_by = $2,
              approved_at = NOW(),
              rejection_reason = NULL,
              updated_at = NOW()
            WHERE id = $3
          `,
          [
            finalUserId,
            adminId,
            entityId,
          ]
        );
      }

      const applicationUpdate =
        await db.query(
          `
            UPDATE registration_applications
            SET
              user_id = $1,
              status = 'APPROVED',
              approved_at = NOW(),
              approved_by = $2,
              rejected_at = NULL,
              rejected_by = NULL,
              rejection_reason = NULL
            WHERE id = $3
            RETURNING
              id,
              approved_at
          `,
          [
            finalUserId,
            adminId,
            registration.application_id,
          ]
        );

      /*
       * Subscription period begins when Admin approves.
       * The user account itself remains inactive until
       * password setup is completed.
       */
      const subscriptionUpdate =
        await db.query(
          `
            UPDATE subscriptions
            SET
              user_id = $1,
              status = 'ACTIVE',
              starts_at = NOW(),
              expires_at =
                NOW() +
                (
                  duration_days_snapshot *
                  INTERVAL '1 day'
                ),
              approved_at = NOW(),
              approved_by = $2,
              cancelled_at = NULL,
              cancellation_reason = NULL,
              suspended_at = NULL,
              suspension_reason = NULL
            WHERE id = $3
            RETURNING
              id,
              starts_at,
              expires_at
          `,
          [
            finalUserId,
            adminId,
            registration.subscription_id,
          ]
        );

      await db.query(
        `
          UPDATE payment_orders
          SET user_id = $1
          WHERE registration_application_id = $2
            AND status = 'PAID'
        `,
        [
          finalUserId,
          registration.application_id,
        ]
      );

      /*
       * Revoke every old unused token before creating one
       * fresh token for this approval.
       */
      await db.query(
        `
          UPDATE password_setup_tokens
          SET revoked_at = NOW()
          WHERE user_id = $1
            AND used_at IS NULL
            AND revoked_at IS NULL
        `,
        [finalUserId]
      );

      plainPasswordToken = crypto
        .randomBytes(32)
        .toString("hex");

      const tokenHash = crypto
        .createHash("sha256")
        .update(plainPasswordToken)
        .digest("hex");

      const tokenExpiresAt = new Date(
        Date.now() +
          getPasswordTokenTtlHours() *
            60 *
            60 *
            1000
      );

      await db.query(
        `
          INSERT INTO password_setup_tokens (
            user_id,
            registration_application_id,
            token_hash,
            expires_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
        `,
        [
          finalUserId,
          registration.application_id,
          tokenHash,
          tokenExpiresAt,
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
            'ADMIN_APPROVED',
            'PAID_PENDING_APPROVAL',
            'ACTIVE',
            $2,
            'Registration approved by Admin',
            $3::jsonb
          )
        `,
        [
          registration.subscription_id,
          adminId,
          JSON.stringify({
            applicantType,
            entityId,
            applicationId:
              registration.application_id,
            userId: finalUserId,
            passwordSetupRequired: true,
          }),
        ]
      );

      await db.query("COMMIT");
      transactionOpen = false;

      passwordSetupLink =
        createPasswordSetupLink(
          plainPasswordToken
        );

      approvedResult = {
        userId: finalUserId,
        subscriptionId:
          subscriptionUpdate.rows[0].id,
        applicationId:
          applicationUpdate.rows[0].id,
        name,
        email,
        username:
          userResult.rows[0].username,
        subscriptionStartsAt:
          subscriptionUpdate.rows[0]
            .starts_at,
        subscriptionExpiresAt:
          subscriptionUpdate.rows[0]
            .expires_at,
        passwordTokenExpiresAt:
          tokenExpiresAt.toISOString(),
      };
    } catch (error: any) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "ADMIN APPROVAL ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      if (error?.code === "22P02") {
        res.status(400).json({
          success: false,
          message:
            "Invalid registration or Admin ID.",
        });
        return;
      }

      if (error?.code === "23505") {
        res.status(409).json({
          success: false,
          message:
            "Approval would create a duplicate user, username, or active password token.",
          constraint: error.constraint,
        });
        return;
      }

      throw error;
    } finally {
      db.release();
    }

    if (!approvedResult) {
      res.status(500).json({
        success: false,
        message:
          "Approval completed without a result.",
      });
      return;
    }

    let emailSent = false;
    let emailError: string | null = null;

    /*
     * Email is sent after COMMIT. A mail-provider failure
     * must not roll back a valid financial/account approval.
     */
    try {
      await sendApprovalMail(
        approvedResult.email,
        approvedResult.name,
        passwordSetupLink
      );

      emailSent = true;
    } catch (error) {
      emailError =
        error instanceof Error
          ? error.message
          : "Unable to send approval email.";

      console.error(
        "PASSWORD SETUP EMAIL ERROR:",
        error
      );
    }

    try {
      await createAuditLog({
        adminId,
        adminName:
          req.user?.name || "ADMIN",
        adminRole:
          req.user?.role || "ADMIN",
        action:
          "PAID_REGISTRATION_APPROVED",
        module: applicantType,
        targetEntity:
          approvedResult.email,
        targetType: applicantType,
        description:
          `${applicantType} paid registration approved and subscription activated`,
        status: "SUCCESS",
        ipAddress: getClientIp(req),
        device:
          req.headers["user-agent"]?.toString() ||
          "",
        oldValue: {
          registrationStatus:
            "PAID_PENDING_APPROVAL",
          subscriptionStatus:
            "PAID_PENDING_APPROVAL",
        },
        newValue: {
          userId: approvedResult.userId,
          applicationId:
            approvedResult.applicationId,
          subscriptionId:
            approvedResult.subscriptionId,
          registrationStatus: "APPROVED",
          subscriptionStatus: "ACTIVE",
          userStatus: "inactive",
          passwordSetupRequired: true,
          passwordSetupEmailSent:
            emailSent,
        },
      });
    } catch (auditError) {
      console.error(
        "ADMIN APPROVAL AUDIT ERROR:",
        auditError
      );
    }

    res.status(200).json({
      success: true,
      message: emailSent
        ? `${applicantType} approved. Password setup link sent successfully.`
        : `${applicantType} approved, but the password setup email could not be sent.`,
      user_id: approvedResult.userId,
      username: approvedResult.username,
      application_id:
        approvedResult.applicationId,
      subscription_id:
        approvedResult.subscriptionId,
      registration_status: "APPROVED",
      subscription_status: "ACTIVE",
      user_status: "inactive",
      subscription_starts_at:
        approvedResult.subscriptionStartsAt,
      subscription_expires_at:
        approvedResult.subscriptionExpiresAt,
      password_setup_required: true,
      password_setup_token_expires_at:
        approvedResult.passwordTokenExpiresAt,
      email_sent: emailSent,
      email_error: emailError,
      next_step: "PASSWORD_SETUP",

      /*
       * Useful in local/Test Mode when email is unavailable.
       * Never expose setup links from production responses.
       */
      ...(process.env.NODE_ENV !==
      "production"
        ? {
            development_password_setup_link:
              passwordSetupLink,
          }
        : {}),
    });
  } catch (error) {
    console.error(
      "APPROVE PAID REGISTRATION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to approve registration.",
    });
  }
};
