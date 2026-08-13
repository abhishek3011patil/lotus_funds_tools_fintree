import crypto from "crypto";
import { createRaClientSubscriptionNotification } from "../../services/raClientSubscriptionNotification.service";
import type { Response } from "express";
import Razorpay from "razorpay";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const DEFAULT_PRICE_PAISE = 249_900;
const DEFAULT_DURATION_DAYS = 365;

const getPricePaise = () => {
  const configured = Number(process.env.CLIENT_RA_SUBSCRIPTION_PRICE_PAISE);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_PRICE_PAISE;
};

const getDurationDays = () => {
  const configured = Number(process.env.CLIENT_RA_SUBSCRIPTION_DURATION_DAYS);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_DURATION_DAYS;
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const safePageNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const formatAnalyst = (row: any) => ({
  id: row.id,
  name: row.name,
  organization: row.organization,
  shortBio: row.short_bio,
  profileImage: row.profile_image
    ? `/uploads/${String(row.profile_image).replace(/^[/\\]+/, "")}`
    : null,
  sebiRegistrationNumber: row.sebi_registration_number,
  marketExperience: row.market_experience,
  expertise: row.expertise,
  markets: row.markets,
  recommendationCount: Number(row.recommendation_count || 0),
  liveCallCount: Number(row.live_call_count || 0),
  isSubscribed: Boolean(row.is_subscribed),
  subscriptionExpiresAt: row.subscription_expires_at,
  pricePaise: getPricePaise(),
  currency: "INR",
  durationDays: getDurationDays(),
});

export const listClientAnalysts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const clientUserId = req.user!.id;
    const search = String(req.query.search || "").trim();
    const page = safePageNumber(req.query.page, 1);
    const limit = Math.min(safePageNumber(req.query.limit, 12), 48);
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    await pool.query(
      `UPDATE client_ra_subscriptions
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE client_user_id = $1
         AND status = 'ACTIVE'
         AND expires_at <= NOW()`,
      [clientUserId]
    );

    const filterSql = `
      u.role = 'RESEARCH_ANALYST'
      AND u.status = 'active'
      AND COALESCE(u.is_active, false) = true
      AND rd.status = 'approved'
      AND (
        $2 = '' OR
        COALESCE(u.name, '') ILIKE $3 OR
        COALESCE(rd.first_name, '') ILIKE $3 OR
        COALESCE(rd.surname, '') ILIKE $3 OR
        COALESCE(rd.org_name, '') ILIKE $3 OR
        COALESCE(rd.short_bio, '') ILIKE $3 OR
        COALESCE(rd.sebi_reg_no, '') ILIKE $3 OR
        COALESCE(rd.expertise, '') ILIKE $3 OR
        COALESCE(rd.markets, '') ILIKE $3
      )`;

    const [countResult, analystsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM users u
         INNER JOIN ra_details rd ON rd.user_id = u.id
         WHERE $1::uuid IS NOT NULL
           AND ${filterSql}`,
        [clientUserId, search, searchPattern]
      ),
      pool.query(
        `SELECT
           u.id,
           COALESCE(NULLIF(TRIM(CONCAT_WS(' ', rd.first_name, rd.surname)), ''), u.name) AS name,
           rd.org_name AS organization,
           rd.short_bio,
           rd.profile_image,
           rd.sebi_reg_no AS sebi_registration_number,
           rd.market_experience,
           rd.expertise,
           rd.markets,
           COALESCE(call_stats.recommendation_count, 0) AS recommendation_count,
           COALESCE(call_stats.live_call_count, 0) AS live_call_count,
           (subscription.id IS NOT NULL) AS is_subscribed,
           subscription.expires_at AS subscription_expires_at
         FROM users u
         INNER JOIN ra_details rd ON rd.user_id = u.id
         LEFT JOIN LATERAL (
           SELECT
             COUNT(*)::int AS recommendation_count,
             COUNT(*) FILTER (WHERE research_call.status = 'PUBLISHED')::int AS live_call_count
           FROM research_calls research_call
           WHERE research_call.ra_user_id = u.id
         ) call_stats ON true
         LEFT JOIN client_ra_subscriptions subscription
           ON subscription.client_user_id = $1
          AND subscription.ra_user_id = u.id
          AND subscription.status = 'ACTIVE'
          AND subscription.expires_at > NOW()
         WHERE ${filterSql}
         ORDER BY (subscription.id IS NOT NULL) DESC, u.name ASC
         LIMIT $4 OFFSET $5`,
        [clientUserId, search, searchPattern, limit, offset]
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    return res.status(200).json({
      success: true,
      analysts: analystsResult.rows.map(formatAnalyst),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("LIST CLIENT ANALYSTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load research analysts.",
    });
  }
};

export const createAnalystSubscriptionOrder = async (
  req: AuthRequest,
  res: Response
) => {
  const clientUserId = req.user!.id;
  const raUserId = String(req.params.raUserId || "");
  const amountPaise = getPricePaise();
  const durationDays = getDurationDays();
  const localOrderId = crypto.randomUUID();
  const idempotencyKey = `client-ra-${crypto.randomUUID()}`;
  const receipt = `cra_${localOrderId.replace(/-/g, "").slice(0, 30)}`;

  try {
    const analystResult = await pool.query(
      `SELECT
         u.id,
         COALESCE(NULLIF(TRIM(CONCAT_WS(' ', rd.first_name, rd.surname)), ''), u.name) AS name
       FROM users u
       INNER JOIN ra_details rd ON rd.user_id = u.id
       WHERE u.id = $1
         AND u.role = 'RESEARCH_ANALYST'
         AND u.status = 'active'
         AND COALESCE(u.is_active, false) = true
         AND rd.status = 'approved'`,
      [raUserId]
    );

    if (analystResult.rowCount === 0) {
      return res.status(404).json({ message: "Research analyst not found." });
    }

    const existingResult = await pool.query(
      `SELECT id
       FROM client_ra_subscriptions
       WHERE client_user_id = $1
         AND ra_user_id = $2
         AND status = 'ACTIVE'
         AND expires_at > NOW()`,
      [clientUserId, raUserId]
    );

    if ((existingResult.rowCount || 0) > 0) {
      return res.status(409).json({
        message: "You are already subscribed to this analyst.",
      });
    }

    const notes = {
      purpose: "CLIENT_RA_SUBSCRIPTION",
      raUserId,
      durationDays,
    };

    await pool.query(
      `INSERT INTO payment_orders (
         id, user_id, amount_paise, currency, status,
         idempotency_key, receipt, notes
       ) VALUES ($1, $2, $3, 'INR', 'CREATED', $4, $5, $6::jsonb)`,
      [
        localOrderId,
        clientUserId,
        amountPaise,
        idempotencyKey,
        receipt,
        JSON.stringify(notes),
      ]
    );

    const razorpay = getRazorpay();
    const providerOrder: any = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        purpose: "CLIENT_RA_SUBSCRIPTION",
        clientUserId,
        raUserId,
      },
    });

    await pool.query(
      `UPDATE payment_orders
       SET provider_order_id = $1, status = 'PENDING', updated_at = NOW()
       WHERE id = $2`,
      [providerOrder.id, localOrderId]
    );

    await pool.query(
      `INSERT INTO client_ra_subscriptions (
         client_user_id, ra_user_id, latest_payment_order_id,
         status, amount_paise, currency
       ) VALUES ($1, $2, $3, 'PENDING_PAYMENT', $4, 'INR')
       ON CONFLICT (client_user_id, ra_user_id)
       DO UPDATE SET
         latest_payment_order_id = EXCLUDED.latest_payment_order_id,
         status = 'PENDING_PAYMENT',
         amount_paise = EXCLUDED.amount_paise,
         currency = EXCLUDED.currency,
         unsubscribed_at = NULL,
         updated_at = NOW()`,
      [clientUserId, raUserId, localOrderId, amountPaise]
    );

    return res.status(201).json({
      success: true,
      order: {
        localOrderId,
        razorpayOrderId: providerOrder.id,
        amountPaise,
        currency: "INR",
      },
      checkout: {
        keyId: process.env.RAZORPAY_KEY_ID,
        businessName: "Tarkashh",
        description: `Subscribe to ${analystResult.rows[0].name}`,
        prefill: {
          name: req.user?.name || "",
          email: req.user?.email || "",
        },
      },
    });
  } catch (error) {
    await pool.query(
      `UPDATE payment_orders
       SET status = 'FAILED', failed_at = NOW(),
           failure_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [error instanceof Error ? error.message : "Order creation failed", localOrderId]
    ).catch(() => undefined);

    console.error("CREATE CLIENT ANALYST ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to start Razorpay checkout.",
    });
  }
};

export const verifyAnalystSubscriptionPayment = async (
  req: AuthRequest,
  res: Response
) => {
  const clientUserId = req.user!.id;
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body || {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: "Payment details are required." });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(503).json({ message: "Razorpay is not configured." });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const actualBuffer = Buffer.from(String(razorpaySignature), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureIsValid =
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);

  if (!signatureIsValid) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }

  try {
    const razorpay = getRazorpay();
    const providerPayment: any = await razorpay.payments.fetch(
      String(razorpayPaymentId)
    );

    if (
      String(providerPayment.order_id || "") !== String(razorpayOrderId) ||
      String(providerPayment.status || "").toLowerCase() !== "captured"
    ) {
      return res.status(409).json({
        message: "Payment is authentic but has not been captured yet.",
      });
    }

    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const orderResult = await db.query(
        `SELECT id, amount_paise, currency, status, notes
         FROM payment_orders
         WHERE provider_order_id = $1
           AND user_id = $2
           AND notes ->> 'purpose' = 'CLIENT_RA_SUBSCRIPTION'
         FOR UPDATE`,
        [razorpayOrderId, clientUserId]
      );

      if (orderResult.rowCount === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ message: "Payment order not found." });
      }

      const order = orderResult.rows[0];
      const raUserId = String(order.notes?.raUserId || "");
      const amountMatches = Number(providerPayment.amount) === Number(order.amount_paise);
      const currencyMatches =
        String(providerPayment.currency || "").toUpperCase() ===
        String(order.currency || "").trim().toUpperCase();

      if (!amountMatches || !currencyMatches || !raUserId) {
        await db.query("ROLLBACK");
        return res.status(409).json({
          message: "Razorpay payment does not match this subscription order.",
        });
      }

      if (order.status === "PAID") {
        const existingSubscription = await db.query(
          `SELECT id, status, starts_at, expires_at
           FROM client_ra_subscriptions
           WHERE client_user_id = $1
             AND ra_user_id = $2`,
          [clientUserId, raUserId]
        );
        await db.query("COMMIT");
        return res.status(200).json({
          success: true,
          message: "Analyst subscription is already active.",
          subscription: existingSubscription.rows[0] || null,
        });
      }

      await db.query(
          `INSERT INTO payment_transactions (
             payment_order_id, provider_payment_id, provider_signature,
             transaction_type, status, amount_paise, currency, provider_payload
           ) VALUES ($1, $2, $3, 'PAYMENT', 'CAPTURED', $4, $5, $6::jsonb)`,
          [
            order.id,
            razorpayPaymentId,
            razorpaySignature,
            order.amount_paise,
            order.currency,
            JSON.stringify(providerPayment),
          ]
        );

      await db.query(
          `UPDATE payment_orders
           SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [order.id]
        );
      const subscriptionResult = await db.query(
        `INSERT INTO client_ra_subscriptions (
           client_user_id, ra_user_id, latest_payment_order_id,
           status, amount_paise, currency, starts_at, expires_at,
           subscribed_at, unsubscribed_at
         ) VALUES (
           $1, $2, $3, 'ACTIVE', $4, $5,
           NOW(), NOW() + make_interval(days => $6), NOW(), NULL
         )
         ON CONFLICT (client_user_id, ra_user_id)
         DO UPDATE SET
           latest_payment_order_id = EXCLUDED.latest_payment_order_id,
           status = 'ACTIVE',
           amount_paise = EXCLUDED.amount_paise,
           currency = EXCLUDED.currency,
           starts_at = EXCLUDED.starts_at,
           expires_at = EXCLUDED.expires_at,
           subscribed_at = EXCLUDED.subscribed_at,
           unsubscribed_at = NULL,
           updated_at = NOW()
         RETURNING id, status, starts_at, expires_at`,
        [
          clientUserId,
          raUserId,
          order.id,
          order.amount_paise,
          order.currency,
          getDurationDays(),
        ]
      );

      await createRaClientSubscriptionNotification({
        db,
        clientRaSubscriptionId: subscriptionResult.rows[0].id,
        event: "ACTIVATED",
      });

      await db.query("COMMIT");
      return res.status(200).json({
        success: true,
        message: "Analyst subscription activated.",
        subscription: subscriptionResult.rows[0],
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("VERIFY CLIENT ANALYST PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify the Razorpay payment.",
    });
  }
};
