import crypto from "crypto";
import type { Response } from "express";
import Razorpay from "razorpay";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { expireDueSubscriptions } from "../services/subscriptionAccess.service";

const DEFAULT_RENEWAL_WINDOW_DAYS = 30;

const getRenewalWindowDays = (): number => {
  const configured = Number(
    process.env.SUBSCRIPTION_RENEWAL_WINDOW_DAYS ||
      DEFAULT_RENEWAL_WINDOW_DAYS
  );

  if (!Number.isFinite(configured) || configured < 1) {
    return DEFAULT_RENEWAL_WINDOW_DAYS;
  }

  return Math.min(Math.floor(configured), 365);
};

const getAudienceForRole = (
  role?: string
): "RA" | "BROKER" | "CLIENT" | null => {
  switch (String(role || "").toUpperCase()) {
    case "RA":
    case "RESEARCH_ANALYST":
      return "RA";
    case "BROKER":
      return "BROKER";
    case "CLIENT":
      return "CLIENT";
    default:
      return null;
  }
};

const getRazorpayClient = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const getString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const secureHexEquals = (
  firstValue: string,
  secondValue: string
): boolean => {
  if (
    !/^[a-f0-9]+$/i.test(firstValue) ||
    !/^[a-f0-9]+$/i.test(secondValue)
  ) {
    return false;
  }

  const first = Buffer.from(firstValue, "hex");
  const second = Buffer.from(secondValue, "hex");

  return (
    first.length > 0 &&
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
};

const sendOrder = (
  res: Response,
  order: any,
  user: any,
  planName: string,
  message: string
): void => {
  res.status(200).json({
    success: true,
    message,
    order: {
      localOrderId: order.id,
      razorpayOrderId: order.provider_order_id,
      amountPaise: Number(order.amount_paise),
      amountRupees: Number(order.amount_paise) / 100,
      currency: String(order.currency).trim(),
      receipt: order.receipt,
      status: order.status,
    },
    checkout: {
      keyId: process.env.RAZORPAY_KEY_ID,
      businessName:
        process.env.RAZORPAY_CHECKOUT_NAME || "Lotus Funds",
      description: `${planName} renewal`,
      prefill: {
        email: user.email || "",
        contact: "",
      },
    },
    nextStep: "OPEN_RAZORPAY_CHECKOUT",
  });
};

export const createSubscriptionRenewalOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const audienceType = getAudienceForRole(req.user?.role);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
    return;
  }

  if (!audienceType) {
    res.status(403).json({
      success: false,
      message: "This account role cannot renew a subscription.",
    });
    return;
  }

  await expireDueSubscriptions({ userId, batchSize: 10 });

  const db = await pool.connect();
  let transactionOpen = false;

  try {
    await db.query("BEGIN");
    transactionOpen = true;

    const subscriptionResult = await db.query(
      `
        SELECT
          subscription.id,
          subscription.status,
          subscription.expires_at,
          subscription.plan_id,
          plan.plan_code,
          plan.display_name,
          plan.tier_code,
          plan.price_paise,
          plan.currency,
          plan.duration_days,
          plan.version,
          plan.audience_type,
          user_account.email,
          user_account.status AS user_status
        FROM subscriptions subscription
        INNER JOIN subscription_plans plan
          ON plan.id = subscription.plan_id
        INNER JOIN users user_account
          ON user_account.id = subscription.user_id
        WHERE subscription.user_id = $1
        ORDER BY
          CASE WHEN subscription.status = 'ACTIVE' THEN 0 ELSE 1 END,
          subscription.created_at DESC
        LIMIT 1
        FOR UPDATE OF subscription
      `,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(404).json({
        success: false,
        message: "No subscription was found to renew.",
      });
      return;
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.audience_type !== audienceType) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(403).json({
        success: false,
        message: "The subscription does not belong to this account role.",
      });
      return;
    }

    if (
      String(subscription.user_status || "").toLowerCase() !==
      "active"
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(403).json({
        success: false,
        message: "An active account is required to renew.",
      });
      return;
    }

    if (
      !["ACTIVE", "EXPIRED", "CANCELLED"].includes(
        subscription.status
      )
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(409).json({
        success: false,
        message: `A ${String(subscription.status).toLowerCase()} subscription cannot be renewed.`,
      });
      return;
    }

    const expiryTime = subscription.expires_at
      ? new Date(subscription.expires_at).getTime()
      : 0;
    const renewalWindowMs =
      getRenewalWindowDays() * 86_400_000;

    if (
      subscription.status === "ACTIVE" &&
      expiryTime - Date.now() > renewalWindowMs
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(409).json({
        success: false,
        message: `Renewal is available within ${getRenewalWindowDays()} days of expiry.`,
        code: "RENEWAL_NOT_YET_AVAILABLE",
      });
      return;
    }

    const planResult = await db.query(
      `
        SELECT
          id,
          plan_code,
          display_name,
          tier_code,
          price_paise,
          currency,
          duration_days,
          version
        FROM subscription_plans
        WHERE id = $1
          AND audience_type = $2
          AND is_active = true
          AND effective_from <= NOW()
          AND (
            effective_until IS NULL OR
            effective_until > NOW()
          )
        LIMIT 1
      `,
      [subscription.plan_id, audienceType]
    );

    if (planResult.rows.length === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;
      res.status(409).json({
        success: false,
        message:
          "The current plan is no longer available. Please choose another plan.",
        nextStep: "CHANGE_PLAN",
      });
      return;
    }

    const plan = planResult.rows[0];
    const existingOrder = await db.query(
      `
        SELECT *
        FROM payment_orders
        WHERE user_id = $1
          AND notes ->> 'subscriptionId' = $2
          AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
          AND status IN ('CREATED', 'PENDING')
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [userId, subscription.id]
    );

    if (existingOrder.rows.length > 0) {
      await db.query("COMMIT");
      transactionOpen = false;
      sendOrder(
        res,
        existingOrder.rows[0],
        subscription,
        plan.display_name,
        "Existing renewal order returned."
      );
      return;
    }

    const previousAttempts = await db.query(
      `
        SELECT COUNT(*)::integer AS count
        FROM payment_orders
        WHERE user_id = $1
          AND notes ->> 'subscriptionId' = $2
          AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
      `,
      [userId, subscription.id]
    );
    const attemptNumber =
      Number(previousAttempts.rows[0]?.count || 0) + 1;
    const renewalKey = `renewal:${subscription.id}:${
      subscription.expires_at
        ? new Date(subscription.expires_at).toISOString()
        : "no-expiry"
    }:attempt:${attemptNumber}`;

    const razorpay = getRazorpayClient();
    const receipt = `renew_${String(subscription.id)
      .replace(/-/g, "")
      .slice(0, 12)}_${Date.now().toString(36)}`;

    const providerOrder = await razorpay.orders.create({
      amount: Number(plan.price_paise),
      currency: String(plan.currency).trim(),
      receipt,
      notes: {
        purpose: "SUBSCRIPTION_RENEWAL",
        subscriptionId: subscription.id,
        userId,
      },
    });

    const notes = {
      purpose: "SUBSCRIPTION_RENEWAL",
      subscriptionId: subscription.id,
      previousExpiresAt: subscription.expires_at,
      planId: plan.id,
      planCode: plan.plan_code,
      planName: plan.display_name,
      tierCode: plan.tier_code,
      durationDays: Number(plan.duration_days),
      planVersion: Number(plan.version),
    };

    const insertedOrder = await db.query(
      `
        INSERT INTO payment_orders (
          user_id,
          provider,
          provider_order_id,
          amount_paise,
          currency,
          status,
          idempotency_key,
          receipt,
          notes
        )
        VALUES ($1, 'RAZORPAY', $2, $3, $4, 'CREATED', $5, $6, $7::jsonb)
        RETURNING *
      `,
      [
        userId,
        providerOrder.id,
        Number(plan.price_paise),
        String(plan.currency).trim(),
        renewalKey,
        receipt,
        JSON.stringify(notes),
      ]
    );

    await db.query("COMMIT");
    transactionOpen = false;

    sendOrder(
      res,
      insertedOrder.rows[0],
      subscription,
      plan.display_name,
      "Renewal payment order created."
    );
  } catch (error) {
    if (transactionOpen) {
      await db.query("ROLLBACK");
    }
    console.error("CREATE SUBSCRIPTION RENEWAL ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create the renewal payment order.",
    });
  } finally {
    db.release();
  }
};

export const verifySubscriptionRenewalPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const localOrderId = getString(req.body?.localOrderId);
  const razorpayOrderId = getString(req.body?.razorpayOrderId);
  const razorpayPaymentId = getString(req.body?.razorpayPaymentId);
  const razorpaySignature = getString(req.body?.razorpaySignature);
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  if (
    !localOrderId ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    res.status(400).json({
      success: false,
      message: "Complete Razorpay payment details are required.",
    });
    return;
  }

  if (!keySecret) {
    res.status(500).json({
      success: false,
      message: "Payment verification is not configured.",
    });
    return;
  }

  try {
    const initialResult = await pool.query(
      `
        SELECT id, user_id, provider_order_id, amount_paise, currency, status
        FROM payment_orders
        WHERE id = $1
          AND user_id = $2
          AND provider = 'RAZORPAY'
          AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
        LIMIT 1
      `,
      [localOrderId, userId]
    );

    if (initialResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Renewal payment order not found.",
      });
      return;
    }

    const initial = initialResult.rows[0];

    if (initial.provider_order_id !== razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: "Razorpay order does not match the renewal order.",
      });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!secureHexEquals(expectedSignature, razorpaySignature)) {
      res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature.",
      });
      return;
    }

    const razorpay = getRazorpayClient();
    const providerPayment: any =
      await razorpay.payments.fetch(razorpayPaymentId);

    if (
      String(providerPayment.order_id || "") !== razorpayOrderId ||
      Number(providerPayment.amount) !== Number(initial.amount_paise) ||
      String(providerPayment.currency || "").toUpperCase() !==
        String(initial.currency || "").trim().toUpperCase()
    ) {
      res.status(409).json({
        success: false,
        message: "Razorpay payment does not match the renewal order.",
      });
      return;
    }

    if (String(providerPayment.status || "").toLowerCase() !== "captured") {
      res.status(409).json({
        success: false,
        message: "The renewal payment has not been captured yet.",
        nextStep: "WAIT_FOR_PAYMENT_CAPTURE",
      });
      return;
    }

    const db = await pool.connect();
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      const lockedResult = await db.query(
        `
          SELECT
            payment_order.id AS payment_order_id,
            payment_order.status AS payment_order_status,
            payment_order.amount_paise,
            payment_order.currency,
            payment_order.notes,
            subscription.id AS subscription_id,
            subscription.status AS subscription_status,
            subscription.starts_at,
            subscription.expires_at,
            subscription.cancelled_at,
            payment_order.created_at AS payment_order_created_at
          FROM payment_orders payment_order
          INNER JOIN subscriptions subscription
            ON subscription.id::text = payment_order.notes ->> 'subscriptionId'
          INNER JOIN users user_account
            ON user_account.id = payment_order.user_id
          WHERE payment_order.id = $1
            AND payment_order.user_id = $2
            AND payment_order.provider_order_id = $3
            AND payment_order.notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
            AND LOWER(user_account.status) = 'active'
          FOR UPDATE OF payment_order, subscription
        `,
        [localOrderId, userId, razorpayOrderId]
      );

      if (lockedResult.rows.length === 0) {
        await db.query("ROLLBACK");
        transactionOpen = false;
        res.status(409).json({
          success: false,
          message: "The account or subscription is no longer eligible for renewal.",
        });
        return;
      }

      const locked = lockedResult.rows[0];

      if (locked.payment_order_status === "PAID") {
        await db.query("COMMIT");
        transactionOpen = false;
        res.status(200).json({
          success: true,
          message: "Renewal payment was already applied.",
          subscriptionId: locked.subscription_id,
          expiresAt: locked.expires_at,
        });
        return;
      }

      if (
        !["ACTIVE", "EXPIRED", "CANCELLED"].includes(
          locked.subscription_status
        )
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;
        res.status(409).json({
          success: false,
          message: `A ${String(locked.subscription_status).toLowerCase()} subscription cannot be renewed.`,
        });
        return;
      }

      if (
        locked.subscription_status === "CANCELLED" &&
        locked.cancelled_at &&
        new Date(locked.payment_order_created_at).getTime() <=
          new Date(locked.cancelled_at).getTime()
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;
        res.status(409).json({
          success: false,
          message:
            "This renewal order was created before the subscription was cancelled and cannot reactivate it.",
        });
        return;
      }

      const durationDays = Number(locked.notes.durationDays);
      if (!Number.isSafeInteger(durationDays) || durationDays < 1) {
        throw new Error("Renewal order contains an invalid duration.");
      }

      const previousExpiresAt = locked.expires_at;
      const wasStillActive =
        locked.subscription_status === "ACTIVE" &&
        previousExpiresAt &&
        new Date(previousExpiresAt).getTime() > Date.now();

      const renewalBase = wasStillActive
        ? new Date(previousExpiresAt)
        : new Date();
      const newExpiresAt = new Date(renewalBase);
      newExpiresAt.setUTCDate(newExpiresAt.getUTCDate() + durationDays);

      const existingTransaction = await db.query(
        `
          SELECT id
          FROM payment_transactions
          WHERE payment_order_id = $1
            AND provider_payment_id = $2
            AND transaction_type = 'PAYMENT'
          LIMIT 1
        `,
        [localOrderId, razorpayPaymentId]
      );

      if (existingTransaction.rows.length === 0) {
        await db.query(
          `
            INSERT INTO payment_transactions (
              payment_order_id,
              provider_payment_id,
              provider_signature,
              transaction_type,
              status,
              amount_paise,
              currency,
              provider_payload
            )
            VALUES ($1, $2, $3, 'PAYMENT', 'CAPTURED', $4, $5, $6::jsonb)
          `,
          [
            localOrderId,
            razorpayPaymentId,
            razorpaySignature,
            Number(providerPayment.amount),
            String(providerPayment.currency),
            JSON.stringify(providerPayment),
          ]
        );
      }

      await db.query(
        `
          UPDATE payment_orders
          SET status = 'PAID', paid_at = NOW(), failed_at = NULL,
              failure_reason = NULL, updated_at = NOW()
          WHERE id = $1
        `,
        [localOrderId]
      );

      const updatedSubscription = await db.query(
        `
          UPDATE subscriptions
          SET
            status = 'ACTIVE',
            starts_at = CASE WHEN $2::boolean THEN starts_at ELSE NOW() END,
            expires_at = $3,
            payment_order_id = $4,
            price_paise_snapshot = $5,
            duration_days_snapshot = $6,
            plan_id = $7,
            plan_code_snapshot = $8,
            plan_name_snapshot = $9,
            tier_code_snapshot = $10,
            plan_version_snapshot = $11,
            cancelled_at = NULL,
            cancellation_reason = NULL,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id, starts_at, expires_at
        `,
        [
          locked.subscription_id,
          Boolean(wasStillActive),
          newExpiresAt,
          localOrderId,
          Number(locked.amount_paise),
          durationDays,
          locked.notes.planId,
          locked.notes.planCode,
          locked.notes.planName,
          locked.notes.tierCode,
          Number(locked.notes.planVersion),
        ]
      );

      await db.query(
        `
          INSERT INTO subscription_events (
            subscription_id, event_type, previous_status, new_status,
            actor_user_id, reason, metadata
          )
          VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6::jsonb)
        `,
        [
          locked.subscription_id,
          locked.subscription_status === "CANCELLED"
            ? "SUBSCRIPTION_REACTIVATED_BY_RENEWAL"
            : "SUBSCRIPTION_RENEWED",
          locked.subscription_status,
          userId,
          locked.subscription_status === "CANCELLED"
            ? "Cancelled subscription reactivated after captured renewal payment"
            : "Subscription renewed after captured payment",
          JSON.stringify({
            paymentOrderId: localOrderId,
            razorpayOrderId,
            razorpayPaymentId,
            previousExpiresAt,
            newExpiresAt: newExpiresAt.toISOString(),
            durationDays,
          }),
        ]
      );

      await db.query("COMMIT");
      transactionOpen = false;

      res.status(200).json({
        success: true,
        message: "Subscription renewed successfully.",
        subscriptionId: locked.subscription_id,
        startsAt: updatedSubscription.rows[0].starts_at,
        expiresAt: updatedSubscription.rows[0].expires_at,
      });
    } catch (error) {
      if (transactionOpen) {
        await db.query("ROLLBACK");
      }
      throw error;
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("VERIFY SUBSCRIPTION RENEWAL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify the renewal payment.",
    });
  }
};

export const cancelSubscriptionRenewalOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const localOrderId = getString(req.body?.localOrderId);
  const razorpayOrderId = getString(req.body?.razorpayOrderId);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (!localOrderId || !razorpayOrderId) {
    res.status(400).json({
      success: false,
      message: "Renewal order details are required.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `
        UPDATE payment_orders
        SET
          status = 'CANCELLED',
          failed_at = NOW(),
          failure_reason =
            'Renewal checkout was closed or payment failed',
          updated_at = NOW()
        WHERE id = $1
          AND user_id = $2
          AND provider_order_id = $3
          AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
          AND status IN ('CREATED', 'PENDING')
        RETURNING id, status
      `,
      [localOrderId, userId, razorpayOrderId]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        `
          SELECT status
          FROM payment_orders
          WHERE id = $1
            AND user_id = $2
            AND provider_order_id = $3
            AND notes ->> 'purpose' = 'SUBSCRIPTION_RENEWAL'
          LIMIT 1
        `,
        [localOrderId, userId, razorpayOrderId]
      );

      if (existing.rows[0]?.status === "PAID") {
        res.status(409).json({
          success: false,
          message:
            "The renewal payment has already been completed.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Renewal order is already closed.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Renewal order closed.",
    });
  } catch (error) {
    console.error("CANCEL RENEWAL ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to close the renewal order.",
    });
  }
};
