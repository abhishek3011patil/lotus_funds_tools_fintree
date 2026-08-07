import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { emailService } from "../services/email";
import { expireDueSubscriptions } from "../services/subscriptionAccess.service";
import { createAuditLog } from "../utils/auditLogger";

const getClientIp = (req: AuthRequest): string =>
  req.headers["x-forwarded-for"]
    ?.toString()
    .split(",")[0]
    ?.trim() ||
  req.socket.remoteAddress ||
  "";

export const cancelMySubscription = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const role = String(req.user?.role || "").toUpperCase();
  const confirmation =
    typeof req.body?.confirmation === "string"
      ? req.body.confirmation.trim()
      : "";
  const reason =
    typeof req.body?.reason === "string"
      ? req.body.reason.trim()
      : "";

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
    return;
  }

  if (!["RA", "RESEARCH_ANALYST"].includes(role)) {
    res.status(403).json({
      success: false,
      message:
        "Only a Research Analyst can use this cancellation endpoint.",
    });
    return;
  }

  if (confirmation !== "CANCEL") {
    res.status(400).json({
      success: false,
      message: 'Type "CANCEL" to confirm subscription cancellation.',
    });
    return;
  }

  if (reason.length < 5 || reason.length > 500) {
    res.status(400).json({
      success: false,
      message:
        "Cancellation reason must be between 5 and 500 characters.",
    });
    return;
  }

  await expireDueSubscriptions({ userId, batchSize: 10 });

  const db = await pool.connect();
  let transactionOpen = false;

  try {
    await db.query("BEGIN");
    transactionOpen = true;

    const result = await db.query(
      `
        SELECT
          subscription.id,
          subscription.status,
          subscription.plan_name_snapshot,
          subscription.expires_at,
          subscription.cancelled_at,
          subscription.cancellation_reason,
          user_account.name,
          user_account.email,
          user_account.status AS user_status,
          ra.status AS ra_status
        FROM subscriptions subscription
        INNER JOIN users user_account
          ON user_account.id = subscription.user_id
        INNER JOIN ra_details ra
          ON ra.user_id = user_account.id
        WHERE subscription.user_id = $1
        ORDER BY
          CASE WHEN subscription.status = 'ACTIVE' THEN 0 ELSE 1 END,
          subscription.created_at DESC
        LIMIT 1
        FOR UPDATE OF subscription
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(404).json({
        success: false,
        message: "No subscription was found.",
      });
      return;
    }

    const subscription = result.rows[0];

    if (subscription.status === "CANCELLED") {
      await db.query("COMMIT");
      transactionOpen = false;
      res.status(200).json({
        success: true,
        message: "Subscription is already cancelled.",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelledAt: subscription.cancelled_at,
          cancellationReason:
            subscription.cancellation_reason,
        },
      });
      return;
    }

    if (subscription.status !== "ACTIVE") {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(409).json({
        success: false,
        message: `A ${String(subscription.status).toLowerCase()} subscription cannot be cancelled.`,
      });
      return;
    }

    const openRenewal = await db.query(
      `
        SELECT id
        FROM payment_orders
        WHERE user_id = $1
          AND notes ->> 'subscriptionId' = $2
          AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
          AND status IN ('CREATED', 'PENDING')
        LIMIT 1
        FOR UPDATE
      `,
      [userId, subscription.id]
    );

    if (openRenewal.rows.length > 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(409).json({
        success: false,
        code: "RENEWAL_PAYMENT_IN_PROGRESS",
        message:
          "A renewal payment is in progress. Close or complete it before cancelling.",
      });
      return;
    }

    const cancelled = await db.query(
      `
        UPDATE subscriptions
        SET
          status = 'CANCELLED',
          auto_renew = false,
          cancelled_at = NOW(),
          cancellation_reason = $1,
          updated_at = NOW()
        WHERE id = $2
          AND status = 'ACTIVE'
        RETURNING id, status, cancelled_at, cancellation_reason
      `,
      [reason, subscription.id]
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
          'SUBSCRIPTION_CANCELLED',
          'ACTIVE',
          'CANCELLED',
          $2,
          $3,
          $4::jsonb
        )
      `,
      [
        subscription.id,
        userId,
        reason,
        JSON.stringify({
          selfService: true,
          planName: subscription.plan_name_snapshot,
          previousExpiresAt: subscription.expires_at,
          accountStatusUnchanged: true,
        }),
      ]
    );

    await db.query("COMMIT");
    transactionOpen = false;

    const cancelledAt =
      cancelled.rows[0].cancelled_at;

    let emailSent = false;
    try {
      const emailResult = await emailService.send(
        "SUBSCRIPTION_CANCELLED",
        subscription.email,
        {
          name: subscription.name || "Research Analyst",
          planName: subscription.plan_name_snapshot,
          cancelledAt: new Date(cancelledAt).toISOString(),
          reason,
        }
      );
      emailSent = emailResult.sent;
    } catch (emailError) {
      console.error(
        "SUBSCRIPTION CANCELLATION EMAIL ERROR:",
        emailError
      );
    }

    try {
      await createAuditLog({
        adminId: userId,
        adminName:
          subscription.name || req.user?.name || "Research Analyst",
        adminRole: role,
        action: "SUBSCRIPTION_CANCELLED",
        module: "SUBSCRIPTION",
        targetEntity: subscription.id,
        targetType: "SUBSCRIPTION",
        description:
          "Research Analyst cancelled their subscription",
        status: "SUCCESS",
        reason,
        ipAddress: getClientIp(req),
        device:
          req.headers["user-agent"]?.toString() || "",
        oldValue: {
          status: "ACTIVE",
          expiresAt: subscription.expires_at,
        },
        newValue: {
          status: "CANCELLED",
          cancelledAt,
        },
      });
    } catch (auditError) {
      console.error(
        "SUBSCRIPTION CANCELLATION AUDIT ERROR:",
        auditError
      );
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully.",
      emailSent,
      subscription: {
        id: subscription.id,
        status: "CANCELLED",
        cancelledAt,
        cancellationReason: reason,
      },
    });
  } catch (error) {
    if (transactionOpen) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "SUBSCRIPTION CANCELLATION ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error("CANCEL SUBSCRIPTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to cancel the subscription.",
    });
  } finally {
    db.release();
  }
};
