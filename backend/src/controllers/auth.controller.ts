import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendOtpMail, sendApprovalMail } from "../config/mailer";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";


/* ================= GET CLIENT IP ================= */

const getClientIp = (req: Request) => {
  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  // if multiple IPs exist
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // convert IPv6 localhost
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // remove IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};


/* ================= SEND OTP AFTER PASSWORD ================= */
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).json({ message: "Token required" });

    const userRes = await pool.query(
      `SELECT * FROM users WHERE reset_token=$1 AND token_expiry > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    const user = userRes.rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await pool.query(
      `UPDATE users SET otp=$1, otp_expiry=$2 WHERE id=$3`,
      [otp, otpExpiry, user.id]
    );

    await sendOtpMail(user.email, otp);

    return res.json({ message: "OTP sent successfully ✅" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { token, otp, password } = req.body;

    if (!token || !otp || !password)
      return res.status(400).json({ message: "Token, OTP and password required" });

    const userRes = await pool.query(`SELECT * FROM users WHERE reset_token=$1`, [token]);

    if (userRes.rows.length === 0) return res.status(400).json({ message: "Invalid token" });

    const user = userRes.rows[0];

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate user
    await pool.query(
      `UPDATE users 
       SET password_hash=$1, status='active', otp=NULL, otp_expiry=NULL, reset_token=NULL
       WHERE id=$2`,
      [hashedPassword, user.id]
    );

    return res.json({ message: "Password set successfully ✅" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= Login ================= */
export const login = async (req: Request, res: Response) => {
  try {
    let { loginId, password } = req.body;

    // ✅ Normalize input
    loginId = loginId.trim().toLowerCase();

    console.log("LOGIN INPUT:", loginId);

    let user;

    /* ================= ADMIN LOGIN (STRICT) ================= */
    if (loginId === "admin") {
      const adminRes = await pool.query(
        `SELECT id, username, password_hash, role 
         FROM company_users 
         WHERE LOWER(username) = $1`,
        [loginId]
      );

      if (adminRes.rows.length === 0) {
        return res.status(400).json({ message: "Admin not found ❌" });
      }

      user = adminRes.rows[0];

    } else {
      /* ================= NORMAL USERS ================= */
      const userRes = await pool.query(
        `SELECT id, email, username, password_hash, role, status
         FROM users 
         WHERE LOWER(email) = $1`,
        [loginId]
      );

      if (userRes.rows.length === 0) {
        return res.status(400).json({ message: "Invalid credentials ❌" });
      }

      user = userRes.rows[0];

    if (user.status.toLowerCase() === "suspended") {
  return res.status(403).json({
    message: "Account suspended by admin ❌",
  });
}

if (user.status.toLowerCase() !== "active") {
  return res.status(403).json({
    message: "Account inactive ❌",
  });
}
    }

    /* ================= PASSWORD CHECK ================= */
    const match = await bcrypt.compare(password, user.password_hash);

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      return res.status(400).json({ message: "Invalid password ❌" });
    }

    /* ================= TOKEN ================= */
    const token = jwt.sign(
      {
  id: user.id,
  role: user.role,
  name: user.username || user.email
},
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

   if (
  user.role === "ADMIN" ||
  user.role === "SUPER_ADMIN" ||
  user.role === "EMPLOYEE"
) {
  await createAuditLog({
    adminId: user.id,

    adminName: user.username || user.email,

    adminRole: user.role,

    action: "LOGIN",

    module: "AUTH",

    targetEntity: user.email || user.username,

    targetType: "ADMIN",

    description: "Admin logged into system",

    status: "SUCCESS",

    ipAddress: getClientIp(req),

    device: req.headers["user-agent"] as string,

    oldValue: null,

    newValue: null,
  });
}


    return res.json({
      message: "Login successful ✅",
      token,
      role: user.role,
      username: user.username ?? user.email ?? "N/A",
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    // ONLY ADMINS
    if (
      req.user?.role === "ADMIN" ||
      req.user?.role === "SUPER_ADMIN" ||
      req.user?.role === "EMPLOYEE"
    ) {

      await createAuditLog({
        adminId: req.user?.id,

        adminName: req.user?.name,

        adminRole: req.user?.role,

        action: "LOGOUT",

        module: "AUTH",

        targetEntity: req.user?.email || req.user?.name,

        targetType: "ADMIN",

        description: "Admin logged out from system",

        status: "SUCCESS",

       ipAddress: getClientIp(req),

        device: req.headers["user-agent"] as string,

        oldValue: null,

        newValue: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful ✅",
    });

  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(500).json({
      message: "Logout failed",
    });
  }
};
/* ================= GET ME ================= */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user;

    // 🔹 Check in company_users (admin)
    const adminRes = await pool.query(
      `SELECT username, id, role FROM company_users WHERE id = $1`,
      [req.user.id]
    );

    if (adminRes.rows.length > 0) {
      user = adminRes.rows[0];
    } else {
      // 🔹 Check in users (RA / Broker)
      const userRes = await pool.query(
        `SELECT email, username, id, role FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      ...user,
      username: user.email || user.username, // ✅ FORCE EMAIL
    });

  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= CHANGE ADMIN PASSWORD =================

export const changeAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, password_hash 
       FROM company_users 
       WHERE id = $1`,
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = result.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);

   if (!isMatch) {

  await createAuditLog({
    adminId: req.user?.id,

    adminName: req.user?.name,

    adminRole: req.user?.role,

    action: "CHANGE_PASSWORD",

    module: "AUTH",

    targetEntity: req.user?.name,

    targetType: "ADMIN",

    description: "Admin failed to change password",

    status: "FAILED",

    reason: "Old password incorrect",

   ipAddress: getClientIp(req),

    device: req.headers["user-agent"] as string,

    oldValue: null,

    newValue: null,
  });

  return res.status(400).json({
    message: "Old password incorrect ❌",
  });
}

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE company_users 
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, adminId]
    );

    await createAuditLog({
  adminId: req.user?.id,

  adminName: req.user?.name,

  adminRole: req.user?.role,

  action: "CHANGE_PASSWORD",

  module: "AUTH",

  targetEntity: req.user?.name,

  targetType: "ADMIN",

  description: "Admin changed account password",

  status: "SUCCESS",

  ipAddress: getClientIp(req),

  device: req.headers["user-agent"] as string,

  oldValue: null,

  newValue: null,
});

    return res.json({
      message: "Password updated successfully ✅",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};