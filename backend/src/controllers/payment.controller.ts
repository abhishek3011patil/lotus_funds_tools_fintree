import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

const getRazorpayClient = (): Razorpay | null => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};
const getClientIp = (req: Request) => {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    ""
  );
};

type LegacyPlan = {
  storedName: string;
  role: "RESEARCH_ANALYST" | "BROKER" | "CLIENT";
  amountPaise: number;
};

// This route supports the older password-link subscription screen. Prices are
// authoritative here; values sent by the browser are display-only.
const LEGACY_PLANS: Record<string, LegacyPlan> = {
  "RA Starter": { storedName: "RA Starter", role: "RESEARCH_ANALYST", amountPaise: 149900 },
  "RA Professional": { storedName: "RA Professional", role: "RESEARCH_ANALYST", amountPaise: 399900 },
  "RA Elite": { storedName: "RA Elite", role: "RESEARCH_ANALYST", amountPaise: 899900 },
  "Broker Basic": { storedName: "Broker Basic", role: "BROKER", amountPaise: 249900 },
  "Broker Professional": { storedName: "Broker Professional", role: "BROKER", amountPaise: 699900 },
  "Broker Enterprise": { storedName: "Broker Enterprise", role: "BROKER", amountPaise: 1899900 },
  "Client Basic": { storedName: "Client Basic", role: "CLIENT", amountPaise: 0 },
  "Client Premium": { storedName: "Client Premium", role: "CLIENT", amountPaise: 29900 },
  "Client Elite": { storedName: "Client Elite", role: "CLIENT", amountPaise: 79900 },
  Free: { storedName: "Client Basic", role: "CLIENT", amountPaise: 0 },
};

const findLegacySession = async (resetToken: unknown) => {
  if (typeof resetToken !== "string" || resetToken.length < 20) return null;

  const result = await pool.query(
    `SELECT id, role, payment_status, razorpay_order_id, plan_selected
       FROM users
      WHERE reset_token = $1
        AND token_expiry > NOW()
      LIMIT 1`,
    [resetToken]
  );
  return result.rows[0] || null;
};

const signaturesMatch = (expected: string, received: unknown): boolean => {
  if (typeof received !== "string") return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

/* =========================================================
   CREATE PAYMENT ORDER (POST /api/payments/create-order)
   ========================================================= */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      res.status(503).json({ message: "Payment service is not configured" });
      return;
    }

    const { planName, resetToken } = req.body;
    const plan = LEGACY_PLANS[String(planName || "")];
    const session = await findLegacySession(resetToken);

    if (!plan || plan.amountPaise <= 0) {
      res.status(400).json({ message: "Select a valid paid plan" });
      return;
    }

    if (!session || String(session.role).toUpperCase() !== plan.role) {
      res.status(403).json({ message: "Invalid or expired payment session" });
      return;
    }

    const options = {
      amount: plan.amountPaise,
      currency: "INR",
      receipt: `legacy_${String(session.id).replace(/-/g, "").slice(0, 24)}`,
      notes: {
        userId: String(session.id),
        planName: plan.storedName,
      },
    };

    const order = await razorpay.orders.create(options);

    const updateResult = await pool.query(
      `UPDATE users
          SET razorpay_order_id = $1,
              plan_selected = $2,
              payment_status = 'pending'
        WHERE id = $3
          AND reset_token = $4
          AND token_expiry > NOW()`,
      [order.id, plan.storedName, session.id, resetToken]
    );

    if (updateResult.rowCount !== 1) {
      res.status(409).json({ message: "Payment session changed. Please try again." });
      return;
    }
    await createAuditLog({
  
  adminName: "SYSTEM",
adminRole: "SYSTEM",
  action: "PAYMENT_ORDER_CREATED",
  module: "PAYMENT",
  targetEntity: order.id,
  targetType: "PAYMENT_ORDER",
  description: "Payment order created",
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: null,
  newValue: {
    orderId: order.id,
    amountPaise: plan.amountPaise,
    currency: "INR",
    planName: plan.storedName,
  },
});

    // Send everything to frontend, including the Key ID
    res.status(200).json({
      ...order,
      key_id: process.env.RAZORPAY_KEY_ID 
    });

  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

/* =========================================================
   VERIFY PAYMENT (POST /api/payments/verify)
   ========================================================= */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(503).json({ message: "Payment service is not configured" });
    return;
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    resetToken,
  } = req.body;

  const session = await findLegacySession(resetToken);
  const plan = session ? LEGACY_PLANS[String(session.plan_selected || "")] : null;

  if (!session || !plan || plan.amountPaise <= 0 ||
      session.razorpay_order_id !== razorpay_order_id) {
    res.status(403).json({ message: "Invalid or expired payment session" });
    return;
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(sign.toString())
    .digest("hex");

  if (!signaturesMatch(expectedSignature, razorpay_signature)) {
    await createAuditLog({
      adminName: "SYSTEM",
      adminRole: "SYSTEM",
      action: "PAYMENT_FAILED",
      module: "PAYMENT",
      targetEntity: razorpay_order_id,
      targetType: "USER_PAYMENT",
      description: "Payment signature verification failed",
      status: "FAILED",
      reason: "Invalid Razorpay signature",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: null,
      newValue: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    res.status(400).send("Invalid Signature");
    return;
  }

  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      res.status(503).json({ message: "Payment service is not configured" });
      return;
    }

    const [providerOrder, providerPayment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);

    if (Number(providerOrder.amount) !== plan.amountPaise ||
        providerOrder.currency !== "INR" ||
        Number(providerPayment.amount) !== plan.amountPaise ||
        providerPayment.currency !== "INR" ||
        providerPayment.order_id !== razorpay_order_id ||
        providerPayment.status !== "captured") {
      res.status(409).json({
        message: "Payment details do not match the selected plan",
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE users 
      SET payment_status = 'completed',
          amount_paid = $1
      WHERE reset_token = $2
        AND token_expiry > NOW()
        AND razorpay_order_id = $3
        AND payment_status IS DISTINCT FROM 'completed'
      RETURNING id, reset_token
      `,
      [plan.amountPaise / 100, resetToken, razorpay_order_id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Invalid session or payment already processed.",
      });
      return;
    }

    await createAuditLog({
      adminName: "SYSTEM",
      adminRole: "SYSTEM",
      action: "PAYMENT_SUCCESS",
      module: "PAYMENT",
      targetEntity: result.rows[0].id,
      targetType: "USER_PAYMENT",
      description: "Payment verified successfully",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: null,
      newValue: {
        userId: result.rows[0].id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amountPaid: plan.amountPaise / 100,
        planName: plan.storedName,
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment verified",
      token: result.rows[0].reset_token,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/* =========================================================
   ACTIVATE FREE PLAN (POST /api/payments/activate-free-plan)
   ========================================================= */
export const activateFreePlan = async (req: Request, res: Response) => {
  const { resetToken } = req.body;

  try {
   const session = await findLegacySession(resetToken);
   if (!session || String(session.role).toUpperCase() !== "CLIENT") {
     return res.status(403).json({ message: "Invalid or expired free-plan session" });
   }

   const result = await pool.query(
  `UPDATE users 
   SET payment_status = 'completed',
       plan_selected = $1,
       amount_paid = 0
   WHERE reset_token = $2
     AND token_expiry > NOW()
     AND payment_status IS DISTINCT FROM 'completed'
   RETURNING id`,
  ["Client Basic", resetToken]
);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Invalid session or user not found." });
    }

    await createAuditLog({
  adminName: "SYSTEM",
adminRole: "SYSTEM",
  action: "FREE_TRIAL_ACTIVATED",
  module: "PAYMENT",
  targetEntity: result.rows[0]?.id,
  targetType: "USER_PLAN",
  description: "Free trial/free plan activated",
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: null,
  newValue: {
    userId: result.rows[0]?.id,
    planName: "Client Basic",
    amountPaid: 0,
  },
});

    return res.status(200).json({ success: true, message: "Free plan activated" });
  } catch (error) {
    console.error("Free Activation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
