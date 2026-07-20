import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});
const getClientIp = (req: Request) => {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    ""
  );
};

/* =========================================================
   CREATE PAYMENT ORDER (POST /api/payments/create-order)
   ========================================================= */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, planName, resetToken } = req.body;

    const options = {
      amount: Number(amount) * 100, // conversion to paise
      currency: "INR",
      receipt: `receipt_${String(resetToken).substring(0, 10)}`,
    };

    const order = await razorpay.orders.create(options);

    // Update database using your specific column names: plan_selected
    if (resetToken && resetToken !== "test_bypass_user") {
      const dbQuery = `
        UPDATE users 
        SET razorpay_order_id = $1, 
            plan_selected = $2,
            payment_status = 'pending'
        WHERE reset_token = $3
      `;
      await pool.query(dbQuery, [order.id, planName, resetToken]);
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
    amount,
    currency: "INR",
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
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    resetToken,
    amountPaid,
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(sign.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
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
    const result = await pool.query(
      `
      UPDATE users 
      SET payment_status = 'completed',
          amount_paid = $1
      WHERE reset_token = $2
      RETURNING id, reset_token
      `,
      [amountPaid || 0, resetToken]
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
        amountPaid: amountPaid || 0,
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
  const { resetToken, planName } = req.body;

  try {
   const result = await pool.query(
  `UPDATE users 
   SET payment_status = 'completed',
       plan_selected = $1,
       amount_paid = 0
   WHERE reset_token = $2
   RETURNING id`,
  [planName, resetToken]
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
    planName,
    amountPaid: 0,
  },
});

    return res.status(200).json({ success: true, message: "Free plan activated" });
  } catch (error) {
    console.error("Free Activation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
