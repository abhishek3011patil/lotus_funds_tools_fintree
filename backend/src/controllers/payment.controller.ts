import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from "../db";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

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

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, resetToken, amountPaid } = req.body;

  // DEBUG LOGS
  console.log("Verify called for Token:", resetToken);
  console.log("Order ID:", razorpay_order_id);

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(sign.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    try {
    const result = await pool.query(
      `UPDATE users 
       SET payment_status = 'completed', 
           is_active = true, 
           status = 'approved' 
       WHERE reset_token = $1 
       RETURNING id, reset_token`,
      [resetToken]
    );

    if (result.rowCount === 0) {
       res.status(404).json({ message: "Invalid session or payment already processed." });
    }

    // Success! The frontend will now handle the redirect.
    res.status(200).json({ 
        success: true, 
        message: "Payment verified",
        token: result.rows[0].reset_token // Pass the token back just in case
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
  } else {
    console.error("❌ SIGNATURE MISMATCH!");
    res.status(400).send("Invalid Signature");
  }
};

export const activateFreePlan = async (req: Request, res: Response) => {
  const { resetToken, planName } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET payment_status = 'completed', 
           is_active = true, 
           status = 'approved',
           plan_selected = $1,
           amount_paid = 0 
       WHERE reset_token = $2 
       RETURNING id`,
      [planName, resetToken]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Invalid session or user not found." });
    }

    return res.status(200).json({ success: true, message: "Free plan activated" });
  } catch (error) {
    console.error("Free Activation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};