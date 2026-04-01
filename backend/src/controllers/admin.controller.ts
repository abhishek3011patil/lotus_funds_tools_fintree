import { Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../db";
import { sendApprovalMail } from "../config/mailer";
import bcrypt from "bcrypt";

export const approveUser = async (req: Request, res: Response) => {
    console.log("Approve API HIT");
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    /* ================= 1. GET RA DETAILS ================= */

    const raRes = await pool.query(
      `SELECT user_id, first_name, surname, email 
       FROM ra_details 
       WHERE id = $1`,
      [userId]
    );

    if (raRes.rows.length === 0) {
      return res.status(404).json({ message: "RA not found" });
    }

    const ra = raRes.rows[0];

    console.log("RA EMAIL:", ra.email);

    /* ================= 2. CHECK IF USER EXISTS ================= */

const existingUser = await pool.query(
  `SELECT id FROM users WHERE email = $1`,
  [ra.email]
);

/* ================= 3. INSERT USER IF NOT EXISTS ================= */

if (existingUser.rows.length === 0) {
  const username = `${ra.first_name}${ra.surname}`
    .toLowerCase()
    .replace(/\s+/g, "");

  // ✅ temporary password (will be replaced after OTP)
  const tempPassword = await bcrypt.hash("temp123", 10);

  await pool.query(
    `INSERT INTO users 
     (name, email, username, password_hash, role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      ra.user_id,
      `${ra.first_name} ${ra.surname}`,
      ra.email,
      username,
      tempPassword, // ✅ FIX
      "RESEARCH_ANALYST",
      "inactive"
    ]
  );
}

    /* ================= 4. GENERATE TOKEN ================= */

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    /* ================= 5. UPDATE USERS ================= */

    await pool.query(
  `UPDATE users
   SET reset_token = $1,
       token_expiry = $2,
       updated_at = NOW()
   WHERE email = $3`,
  [token, expiry, ra.email]
);
    /* ================= 6. UPDATE RA STATUS ================= */

    await pool.query(
      `UPDATE ra_details
       SET status = 'approved'
       WHERE user_id = $1`,
      [ra.user_id]
    );

    /* ================= 7. SEND EMAIL ================= */

    const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;

    await sendApprovalMail(
      ra.email,
      `${ra.first_name} ${ra.surname}`,
      link
    );

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      message: "User approved and email sent",
    });

  } catch (error) {
    console.error("Approve Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
