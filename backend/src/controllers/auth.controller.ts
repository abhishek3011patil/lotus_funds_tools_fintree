import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendOtpMail } from "../config/mailer";
import { sendApprovalMail } from "../config/mailer";
import crypto from "crypto";
/* ================= LOGIN ================= */

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    let user;
    let source = "users";

    // ✅ FIX 1: CHECK RA USERS FIRST
    let result = await pool.query(
      `SELECT id, username, password_hash, role, status
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length > 0) {
      user = result.rows[0];
      source = "users";
    } else {
      // THEN CHECK ADMIN
      result = await pool.query(
        `SELECT id, username, password_hash, role, status
         FROM company_users
         WHERE username = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      user = result.rows[0];
      source = "company_users";
    }

    // ✅ FIX 2: STATUS CHECK
    if (user.status?.toLowerCase() !== "active") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        source
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      username: user.username
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ME ================= */

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({
    id: req.user.id,
    role: req.user.role
  });
};

/* ================= SEND OTP ================= */

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const userRes = await pool.query(
      `SELECT * FROM users 
       WHERE reset_token=$1 AND token_expiry > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    const user = userRes.rows[0];

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users 
       SET otp=$1, otp_expiry=$2, password_hash=$3 
       WHERE id=$4`,
      [otp, expiry, hashedPassword, user.id]
    );

    await sendOtpMail(user.email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */

export const verifyOtp = async (req: Request, res: Response) => {
    console.log("🔥 VERIFY OTP HIT"); 
    
  try {
    const { token, otp } = req.body;

    const userRes = await pool.query(
      `SELECT * FROM users 
       WHERE reset_token=$1 AND otp=$2 AND otp_expiry > NOW()`,
      [token, otp]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = userRes.rows[0];

    // ✅ FIX 3: USE status='active' (NOT is_active)
    await pool.query(
      `UPDATE users 
       SET status='active',
           reset_token=NULL,
           token_expiry=NULL,
           otp=NULL,
           otp_expiry=NULL
       WHERE id=$1`,
      [user.id]
    );

    res.json({ message: "Password set successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
  
};

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
      `SELECT id FROM users WHERE id = $1`,
      [ra.user_id]
    );

    /* ================= 3. INSERT USER IF NOT EXISTS ================= */

    if (existingUser.rows.length === 0) {
      await pool.query(
        `INSERT INTO users 
         (id, name, email, username, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          ra.user_id,
          `${ra.first_name} ${ra.surname}`,
          ra.email,
         `${ra.first_name.toLowerCase()}${ra.surname.toLowerCase()}`, // username = email
          "RA",
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
       WHERE id = $3`,
      [token, expiry, ra.user_id]
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
