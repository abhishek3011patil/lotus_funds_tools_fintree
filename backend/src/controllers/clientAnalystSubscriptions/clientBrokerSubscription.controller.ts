import crypto from "crypto";
import type { Response } from "express";
import Razorpay from "razorpay";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const DEFAULT_PRICE_PAISE = 249_900;
const DEFAULT_DURATION_DAYS = 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const pricePaise = () => {
  const configured = Number(process.env.CLIENT_BROKER_SUBSCRIPTION_PRICE_PAISE);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_PRICE_PAISE;
};
const durationDays = () => {
  const configured = Number(process.env.CLIENT_BROKER_SUBSCRIPTION_DURATION_DAYS);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DURATION_DAYS;
};
const pageNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const razorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured.");
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

export const listClientBrokers = async (req: AuthRequest, res: Response) => {
  const clientUserId = req.user!.id;
  const search = String(req.query.search || "").trim();
  const page = pageNumber(req.query.page, 1);
  const limit = Math.min(pageNumber(req.query.limit, 12), 48);
  const offset = (page - 1) * limit;
  const pattern = `%${search}%`;
  try {
    await pool.query(
      `UPDATE client_broker_subscriptions SET status = 'EXPIRED', updated_at = NOW()
       WHERE client_user_id = $1 AND status = 'ACTIVE' AND expires_at <= NOW()`,
      [clientUserId]
    );
    const filter = `u.role = 'BROKER' AND u.status = 'active' AND COALESCE(u.is_active, false) = true
      AND lower(COALESCE(b.status, '')) = 'approved'
      AND EXISTS (
        SELECT 1
        FROM subscriptions platform_subscription
        JOIN subscription_plans platform_plan ON platform_plan.id = platform_subscription.plan_id
        WHERE platform_subscription.user_id = u.id
          AND platform_subscription.status = 'ACTIVE'
          AND platform_subscription.starts_at <= NOW()
          AND platform_subscription.expires_at > NOW()
          AND platform_plan.audience_type = 'BROKER'
      )
      AND ($2 = '' OR COALESCE(b.legal_name, '') ILIKE $3 OR COALESCE(b.trade_name, '') ILIKE $3
        OR COALESCE(b.sebi_registration_no, '') ILIKE $3 OR COALESCE(b.registration_category, '') ILIKE $3)`;
    const [countResult, brokersResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM broker_details b JOIN users u ON u.id = b.user_id
         WHERE $1::uuid IS NOT NULL AND ${filter}`,
        [clientUserId, search, pattern]
      ),
      pool.query(
        `SELECT b.id, b.legal_name, b.trade_name, b.entity_type,
           b.sebi_registration_no, b.registration_category,
           CONCAT_WS(', ', CASE WHEN b.exchange_nse THEN 'NSE' END, CASE WHEN b.exchange_bse THEN 'BSE' END,
             CASE WHEN b.exchange_smi THEN 'SMI' END, CASE WHEN b.exchange_ncdex THEN 'NCDEX' END) AS exchanges,
           CONCAT_WS(', ', CASE WHEN b.segment_cash THEN 'Cash' END, CASE WHEN b.segment_fo THEN 'F&O' END,
             CASE WHEN b.segment_currency THEN 'Currency' END) AS segments,
           COALESCE(stats.analyst_count, 0) AS analyst_count,
           COALESCE(stats.recommendation_count, 0) AS recommendation_count,
           COALESCE(stats.live_call_count, 0) AS live_call_count,
           (subscription.id IS NOT NULL) AS is_subscribed,
           subscription.expires_at AS subscription_expires_at
         FROM broker_details b JOIN users u ON u.id = b.user_id
         LEFT JOIN LATERAL (
           SELECT COUNT(DISTINCT bra.ra_id)::int AS analyst_count,
             COUNT(rc.id)::int AS recommendation_count,
             COUNT(rc.id) FILTER (WHERE rc.status = 'PUBLISHED')::int AS live_call_count
           FROM broker_research_analysts bra
           LEFT JOIN ra_details rd ON rd.id = bra.ra_id
           LEFT JOIN research_calls rc ON rc.ra_user_id = rd.user_id AND COALESCE(rc.is_latest, true) = true
           WHERE bra.broker_id = b.id AND bra.status = 'ACTIVE'
         ) stats ON true
         LEFT JOIN client_broker_subscriptions subscription
           ON subscription.client_user_id = $1 AND subscription.broker_id = b.id
          AND subscription.status = 'ACTIVE' AND subscription.expires_at > NOW()
         WHERE ${filter}
         ORDER BY (subscription.id IS NOT NULL) DESC, COALESCE(NULLIF(b.trade_name, ''), b.legal_name)
         LIMIT $4 OFFSET $5`,
        [clientUserId, search, pattern, limit, offset]
      ),
    ]);
    const total = Number(countResult.rows[0]?.total || 0);
    return res.json({
      success: true,
      brokers: brokersResult.rows.map(row => ({
        id: row.id,
        name: row.trade_name || row.legal_name,
        legalName: row.legal_name,
        entityType: row.entity_type,
        sebiRegistrationNumber: row.sebi_registration_no,
        category: row.registration_category,
        exchanges: row.exchanges,
        segments: row.segments,
        analystCount: Number(row.analyst_count || 0),
        recommendationCount: Number(row.recommendation_count || 0),
        liveCallCount: Number(row.live_call_count || 0),
        isSubscribed: Boolean(row.is_subscribed),
        subscriptionExpiresAt: row.subscription_expires_at,
        pricePaise: pricePaise(), currency: "INR", durationDays: durationDays(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("LIST CLIENT BROKERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load brokers." });
  }
};

export const cancelBrokerSubscription = async (req: AuthRequest, res: Response) => {
  const brokerId = String(req.params.brokerId || "");
  if (!UUID_PATTERN.test(brokerId)) return res.status(400).json({ message: "Invalid broker ID." });
  try {
    const result = await pool.query(
      `UPDATE client_broker_subscriptions SET status = 'CANCELLED', unsubscribed_at = NOW(), updated_at = NOW()
       WHERE client_user_id = $1 AND broker_id = $2 AND status = 'ACTIVE' AND expires_at > NOW()
       RETURNING id, status, unsubscribed_at`,
      [req.user!.id, brokerId]
    );
    if (!result.rowCount) return res.status(409).json({ message: "No active subscription was found for this broker." });
    return res.json({ success: true, message: "Broker subscription cancelled.", subscription: result.rows[0] });
  } catch (error) {
    console.error("CANCEL CLIENT BROKER SUBSCRIPTION ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to cancel the broker subscription." });
  }
};

export const createBrokerSubscriptionOrder = async (req: AuthRequest, res: Response) => {
  const clientUserId = req.user!.id;
  const brokerId = String(req.params.brokerId || "");
  if (!UUID_PATTERN.test(brokerId)) return res.status(400).json({ message: "Invalid broker ID." });
  const amount = pricePaise();
  const days = durationDays();
  const localOrderId = crypto.randomUUID();
  const receipt = `cbr_${localOrderId.replace(/-/g, "").slice(0, 30)}`;
  try {
    const brokerResult = await pool.query(
      `SELECT b.id, COALESCE(NULLIF(b.trade_name, ''), b.legal_name) AS name
       FROM broker_details b JOIN users u ON u.id = b.user_id
       WHERE b.id = $1 AND u.role = 'BROKER' AND u.status = 'active' AND COALESCE(u.is_active, false) = true
         AND lower(COALESCE(b.status, '')) = 'approved'
         AND EXISTS (
           SELECT 1 FROM subscriptions platform_subscription
           JOIN subscription_plans platform_plan ON platform_plan.id = platform_subscription.plan_id
           WHERE platform_subscription.user_id = u.id
             AND platform_subscription.status = 'ACTIVE'
             AND platform_subscription.starts_at <= NOW()
             AND platform_subscription.expires_at > NOW()
             AND platform_plan.audience_type = 'BROKER'
         )`,
      [brokerId]
    );
    if (!brokerResult.rowCount) return res.status(404).json({ message: "Broker not found." });
    const active = await pool.query(
      `SELECT id FROM client_broker_subscriptions
       WHERE client_user_id = $1 AND broker_id = $2 AND status = 'ACTIVE' AND expires_at > NOW()`,
      [clientUserId, brokerId]
    );
    if (active.rowCount) return res.status(409).json({ message: "You are already subscribed to this broker." });
    const notes = { purpose: "CLIENT_BROKER_SUBSCRIPTION", brokerId, durationDays: days };
    await pool.query(
      `INSERT INTO payment_orders (id, user_id, amount_paise, currency, status, idempotency_key, receipt, notes)
       VALUES ($1, $2, $3, 'INR', 'CREATED', $4, $5, $6::jsonb)`,
      [localOrderId, clientUserId, amount, `client-broker-${crypto.randomUUID()}`, receipt, JSON.stringify(notes)]
    );
    const providerOrder: any = await razorpay().orders.create({
      amount, currency: "INR", receipt,
      notes: { purpose: "CLIENT_BROKER_SUBSCRIPTION", clientUserId, brokerId },
    });
    await pool.query(
      `UPDATE payment_orders SET provider_order_id = $1, status = 'PENDING', updated_at = NOW() WHERE id = $2`,
      [providerOrder.id, localOrderId]
    );
    await pool.query(
      `INSERT INTO client_broker_subscriptions (client_user_id, broker_id, latest_payment_order_id, status, amount_paise, currency)
       VALUES ($1, $2, $3, 'PENDING_PAYMENT', $4, 'INR')
       ON CONFLICT (client_user_id, broker_id) DO UPDATE SET latest_payment_order_id = EXCLUDED.latest_payment_order_id,
         status = 'PENDING_PAYMENT', amount_paise = EXCLUDED.amount_paise, currency = EXCLUDED.currency,
         unsubscribed_at = NULL, updated_at = NOW()`,
      [clientUserId, brokerId, localOrderId, amount]
    );
    return res.status(201).json({
      success: true,
      order: { localOrderId, razorpayOrderId: providerOrder.id, amountPaise: amount, currency: "INR" },
      checkout: { keyId: process.env.RAZORPAY_KEY_ID, businessName: "Tarkashh",
        description: `Subscribe to ${brokerResult.rows[0].name}`,
        prefill: { name: req.user?.name || "", email: req.user?.email || "" } },
    });
  } catch (error) {
    await pool.query(
      `UPDATE payment_orders SET status = 'FAILED', failed_at = NOW(), failure_reason = $1, updated_at = NOW() WHERE id = $2`,
      [error instanceof Error ? error.message : "Order creation failed", localOrderId]
    ).catch(() => undefined);
    console.error("CREATE CLIENT BROKER ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to start Razorpay checkout." });
  }
};

export const verifyBrokerSubscriptionPayment = async (req: AuthRequest, res: Response) => {
  const clientUserId = req.user!.id;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: "Payment details are required." });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ message: "Razorpay is not configured." });
  const expected = crypto.createHmac("sha256", secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  const actualBuffer = Buffer.from(String(razorpaySignature), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }
  try {
    const payment: any = await razorpay().payments.fetch(String(razorpayPaymentId));
    if (String(payment.order_id) !== String(razorpayOrderId) || String(payment.status).toLowerCase() !== "captured") {
      return res.status(409).json({ message: "Payment is authentic but has not been captured yet." });
    }
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const orderResult = await db.query(
        `SELECT id, amount_paise, currency, status, notes FROM payment_orders
         WHERE provider_order_id = $1 AND user_id = $2 AND notes ->> 'purpose' = 'CLIENT_BROKER_SUBSCRIPTION' FOR UPDATE`,
        [razorpayOrderId, clientUserId]
      );
      if (!orderResult.rowCount) { await db.query("ROLLBACK"); return res.status(404).json({ message: "Payment order not found." }); }
      const order = orderResult.rows[0];
      const brokerId = String(order.notes?.brokerId || "");
      if (Number(payment.amount) !== Number(order.amount_paise) ||
          String(payment.currency).toUpperCase() !== String(order.currency).trim().toUpperCase() || !brokerId) {
        await db.query("ROLLBACK");
        return res.status(409).json({ message: "Razorpay payment does not match this subscription order." });
      }
      if (order.status === "PAID") {
        const existing = await db.query(
          `SELECT id, status, starts_at, expires_at FROM client_broker_subscriptions WHERE client_user_id = $1 AND broker_id = $2`,
          [clientUserId, brokerId]
        );
        await db.query("COMMIT");
        return res.json({ success: true, message: "Broker subscription is already active.", subscription: existing.rows[0] || null });
      }
      await db.query(
        `INSERT INTO payment_transactions (payment_order_id, provider_payment_id, provider_signature,
           transaction_type, status, amount_paise, currency, provider_payload)
         VALUES ($1, $2, $3, 'PAYMENT', 'CAPTURED', $4, $5, $6::jsonb)`,
        [order.id, razorpayPaymentId, razorpaySignature, order.amount_paise, order.currency, JSON.stringify(payment)]
      );
      await db.query(`UPDATE payment_orders SET status = 'PAID', paid_at = NOW(), updated_at = NOW() WHERE id = $1`, [order.id]);
      const subscription = await db.query(
        `INSERT INTO client_broker_subscriptions (client_user_id, broker_id, latest_payment_order_id, status,
           amount_paise, currency, starts_at, expires_at, subscribed_at, unsubscribed_at)
         VALUES ($1, $2, $3, 'ACTIVE', $4, $5, NOW(), NOW() + make_interval(days => $6), NOW(), NULL)
         ON CONFLICT (client_user_id, broker_id) DO UPDATE SET latest_payment_order_id = EXCLUDED.latest_payment_order_id,
           status = 'ACTIVE', amount_paise = EXCLUDED.amount_paise, currency = EXCLUDED.currency,
           starts_at = EXCLUDED.starts_at, expires_at = EXCLUDED.expires_at, subscribed_at = EXCLUDED.subscribed_at,
           unsubscribed_at = NULL, updated_at = NOW()
         RETURNING id, status, starts_at, expires_at`,
        [clientUserId, brokerId, order.id, order.amount_paise, order.currency, durationDays()]
      );
      await db.query("COMMIT");
      return res.json({ success: true, message: "Broker subscription activated.", subscription: subscription.rows[0] });
    } catch (error) { await db.query("ROLLBACK"); throw error; }
    finally { db.release(); }
  } catch (error) {
    console.error("VERIFY CLIENT BROKER PAYMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to verify the Razorpay payment." });
  }
};
