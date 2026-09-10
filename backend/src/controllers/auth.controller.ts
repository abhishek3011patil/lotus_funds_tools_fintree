import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendOtpMail, sendApprovalMail } from "../config/mailer";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";
import { emailService } from "../services/email";


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

const validateResetPassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 bytes.";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
};

const getPasswordResetRequestMessage = (role: string) =>
  `If an active ${role === "CLIENT" ? "Client" : "Research Analyst"} account exists for that email, a password reset link has been sent.`;

/* =========================================================
   REQUEST PASSWORD RESET LINK
   POST /api/auth/request-password-reset
   ========================================================= */
export const requestPasswordReset = async (
  req: Request,
  res: Response
) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const requestedRole =
    req.body?.requestedRole === "CLIENT"
      ? "CLIENT"
      : "RESEARCH_ANALYST";
  const requestMessage =
    getPasswordResetRequestMessage(requestedRole);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const frontendUrl = String(
    process.env.FRONTEND_URL || ""
  ).replace(/\/$/, "");

  if (!frontendUrl) {
    return res.status(503).json({
      success: false,
      message: "Password reset is temporarily unavailable.",
    });
  }

  const configuredTtlHours = Number(
    process.env.PASSWORD_RESET_TOKEN_TTL_HOURS || 1
  );
  const tokenTtlHours =
    Number.isFinite(configuredTtlHours) &&
    configuredTtlHours > 0
      ? Math.min(Math.floor(configuredTtlHours), 24)
      : 1;

  try {
    const userResult = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE LOWER(email) = $1
         AND role = $2
         AND status = 'active'
         AND is_active = true
         AND password_hash IS NOT NULL
       LIMIT 1`,
      [email, requestedRole]
    );

    // Always return the same response for unknown or unavailable accounts.
    if (userResult.rowCount === 0) {
      return res.status(200).json({
        success: true,
        message: requestMessage,
      });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(
      Date.now() + tokenTtlHours * 60 * 60 * 1000
    );

    await pool.query(
      `UPDATE users
       SET reset_token = $1,
           token_expiry = $2,
           otp = NULL,
           otp_expiry = NULL,
           updated_at = NOW()
       WHERE id = $3`,
      [token, tokenExpiry, user.id]
    );

    const passwordResetUrl =
      `${frontendUrl}/reset-password?token=` +
      encodeURIComponent(token);
    const emailResult = await emailService.send(
      "PASSWORD_RESET_LINK",
      user.email,
      {
        name:
          user.name ||
          (requestedRole === "CLIENT"
            ? "Client"
            : "Research Analyst"),
        passwordResetUrl,
        expiresInHours: tokenTtlHours,
      }
    );

    if (!emailResult.sent) {
      console.error("PASSWORD RESET EMAIL NOT SENT", {
        reason: emailResult.reason,
      });
      // Preserve the neutral response so delivery failures cannot be used
      // to determine whether an account exists.
      return res.status(200).json({
        success: true,
        message: requestMessage,
      });
    }

    return res.status(200).json({
      success: true,
      message: requestMessage,
    });
  } catch (error) {
    console.error("REQUEST PASSWORD RESET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Password reset is temporarily unavailable.",
    });
  }
};


/* ================= SEND OTP AFTER PASSWORD ================= */
/* =========================================================
   REQUEST PASSWORD RESET OTP (POST /api/auth/request-otp)
   ========================================================= */
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
/* =========================================================
   VERIFY OTP AND SET PASSWORD (POST /api/auth/verify-otp-and-set-password)
   ========================================================= */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { token, otp, password } = req.body;

    if (!token || !otp || !password)
      return res.status(400).json({ message: "Token, OTP and password required" });

    const passwordError = validateResetPassword(String(password));
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const userRes = await pool.query(
      `SELECT *
       FROM users
       WHERE reset_token = $1
         AND token_expiry > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) return res.status(400).json({ message: "Invalid token" });

    const user = userRes.rows[0];

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Preserve suspended/disabled states; only legacy inactive setup is activated.
    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END,
           is_active = CASE WHEN status = 'inactive' THEN true ELSE is_active END,
           otp = NULL,
           otp_expiry = NULL,
           reset_token = NULL,
           token_expiry = NULL,
           updated_at = NOW()
       WHERE id=$2`,
      [hashedPassword, user.id]
    );

    return res.json({
      message: "Password set successfully ✅",
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= Login ================= */
/* =========================================================
   LOG IN (POST /api/auth/login)
   ========================================================= */
export const login = async (req: Request, res: Response) => {
  try {
    let { loginId, password, otp, requestedRole } = req.body;

    // ✅ Normalize input
    loginId = loginId.trim().toLowerCase();

    

   let user;

const normalizedRequestedRole = String(requestedRole || "")
  .trim()
  .toUpperCase();

const allowedRequestedRoles = new Set([
  "ADMIN",
  "SUPERADMIN",
  "EMPLOYEE",
  "RESEARCH_ANALYST",
  "BROKER",
  "CLIENT",
]);

/* ================= VALIDATE LOGIN PORTAL ================= */

if (!normalizedRequestedRole) {
  return res.status(400).json({
    success: false,
    code: "LOGIN_PORTAL_REQUIRED",
    message:
      "Please select the appropriate login portal to continue.",
  });
}

if (!allowedRequestedRoles.has(normalizedRequestedRole)) {
  return res.status(400).json({
    success: false,
    code: "INVALID_LOGIN_PORTAL",
    message:
      "You are trying to access an invalid login portal. Please use the appropriate login portal for your account.",
  });
}

/* ================= ADMIN / COMPANY LOGIN ================= */

if (
  normalizedRequestedRole === "ADMIN" ||
  normalizedRequestedRole === "SUPERADMIN" ||
  normalizedRequestedRole === "EMPLOYEE"
) {
  const adminRes = await pool.query(
    `
      SELECT
        id,
        username,
        password_hash,
        role
      FROM company_users
      WHERE LOWER(username) = $1
    `,
    [loginId]
  );

  if (adminRes.rows.length === 0) {
    return res.status(404).json({
      success: false,
      code: "ACCOUNT_NOT_FOUND",
      message:
        "No Company account was found with the provided username. Please check your username and try again.",
    });
  }

  user = adminRes.rows[0];

  /* ================= WRONG COMPANY PORTAL ================= */

  if (user.role?.toUpperCase() !== normalizedRequestedRole) {
    return res.status(403).json({
      success: false,
      code: "WRONG_LOGIN_PORTAL",
      message:
        "This account is not authorized to access the Company Portal. Please use the appropriate login portal for your account.",
    });
  }
}

/* ================= NORMAL USERS ================= */

else {
  const userRes = await pool.query(
    `
      SELECT
        id,
        email,
        username,
        password_hash,
        role,
        status,
        is_active,
        otp,
        otp_expiry,
        otp_verified_until
      FROM users
      WHERE LOWER(email) = $1
        AND role = $2
    `,
    [loginId, normalizedRequestedRole]
  );

  if (userRes.rows.length === 0) {
    const roleMessage =
      normalizedRequestedRole === "RESEARCH_ANALYST"
        ? "No Research Analyst account was found with the provided email address. Please check your email and try again."
        : normalizedRequestedRole === "BROKER"
        ? "No Broker account was found with the provided email address. Please check your email and try again."
        : "No Client account was found with the provided email address. Please check your email and try again.";

    return res.status(404).json({
      success: false,
      code: "ACCOUNT_NOT_FOUND",
      message: roleMessage,
    });
  }

  user = userRes.rows[0];

  /* ================= ACCOUNT STATUS ================= */

  if (user.status?.toLowerCase() === "suspended") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_SUSPENDED",
      message:
        `Your ${normalizedRequestedRole === "RESEARCH_ANALYST"
          ? "Research Analyst"
          : normalizedRequestedRole === "BROKER"
          ? "Broker"
          : "Client"} account has been suspended by the administrator. Please contact the administrator for assistance.`,
    });
  }

  if (!user.password_hash) {
    return res.status(403).json({
      success: false,
      code: "PASSWORD_NOT_SETUP",
      message:
        "Your account setup is incomplete. Please use the password setup link sent to your registered email.",
    });
  }

  if (
    user.status?.toLowerCase() !== "active" ||
    user.is_active !== true
  ) {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_INACTIVE",
      message:
        `Your ${normalizedRequestedRole === "RESEARCH_ANALYST"
          ? "Research Analyst"
          : normalizedRequestedRole === "BROKER"
          ? "Broker"
          : "Client"} account is currently inactive. Please contact the administrator for assistance.`,
    });
  }
}
    /* ================= PASSWORD CHECK ================= */
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
  return res.status(401).json({
    success: false,
    code: "INVALID_PASSWORD",
    message:
      "Incorrect password. Please check your password and try again.",
  });
}

    const otpSessionExpired =
    !user.otp_verified_until ||
    new Date(user.otp_verified_until) < new Date();

   if (user.role === "RESEARCH_ANALYST" && otpSessionExpired) {

    // User needs OTP only if previous verification expired

    if (!otp) {
  return res.status(200).json({
    success: true,
    requireOtp: true,
    code: "OTP_REQUIRED",
    message:
      "For security verification, an OTP is required. Please check your registered email for the OTP.",
  });
}

if (user.otp !== otp) {
  return res.status(401).json({
    success: false,
    code: "INVALID_OTP",
    message:
      "The OTP you entered is incorrect. Please check the OTP and try again.",
  });
}

if (
  !user.otp_expiry ||
  new Date(user.otp_expiry) < new Date()
) {
  return res.status(401).json({
    success: false,
    code: "OTP_EXPIRED",
    message:
      "Your OTP has expired. Please request a new OTP and try again.",
  });
}

    await pool.query(
        `
        UPDATE users
        SET
            otp = NULL,
            otp_expiry = NULL,
            otp_verified_until = NOW() + INTERVAL '30 days'
        WHERE id = $1
        `,
        [user.id]
    );
}
    /* ================= TOKEN ================= */
    const token = jwt.sign(
      {
  id: user.id,
  role: user.role,
  name: user.username || user.email
},
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

   if (
  user.role === "ADMIN" ||
  user.role === "SUPERADMIN" ||
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
  success: true,
  message: "Login successful. Welcome back!",
  token,
  role: user.role,
  username: user.username ?? user.email ?? "N/A",
});

 } catch (error) {
  console.error("LOGIN ERROR:", error);

  return res.status(500).json({
    success: false,
    code: "LOGIN_SERVER_ERROR",
    message:
      "We're unable to complete your login right now. Please try again later.",
  });
}
};

export const sendLoginOtp = async (
  req: Request,
  res: Response
) => {
  try {
    let { loginId } = req.body;

    if (!loginId) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    loginId = loginId.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
          id,
          email,
          role,
          status,
          is_active,
          otp,
          otp_expiry
      FROM users
      WHERE LOWER(email) = $1
        AND role = 'RESEARCH_ANALYST'
      `,
      [loginId]
    );

   if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    code: "RA_ACCOUNT_NOT_FOUND",
    message:
      "No Research Analyst account was found with the provided email address. Please check your details and try again.",
  });
}

    const user = result.rows[0];

    // Only RA
    if (user.role !== "RESEARCH_ANALYST") {
      return res.status(403).json({
        message: "OTP login allowed only for Research Analysts.",
      });
    }

   if (
  user.status?.toLowerCase() !== "active" ||
  user.is_active !== true
) {
  return res.status(403).json({
    success: false,
    code: "ACCOUNT_INACTIVE",
    message:
      "Your Research Analyst account is currently inactive. Please contact the administrator for assistance.",
  });
}

    // Don't generate a new OTP if the current one is still valid
    if (
      user.otp &&
      user.otp_expiry &&
      new Date(user.otp_expiry) > new Date()
    ) {
      return res.status(200).json({
  success: true,
  code: "OTP_ALREADY_SENT",
  message:
    "An OTP has already been sent to your registered email. Please check your email and enter the OTP.",
});
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 🧪 Testing: 5 minutes
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // 🚀 Production:
    // const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `
      UPDATE users
      SET
          otp = $1,
          otp_expiry = $2
      WHERE id = $3
      `,
      [otp, expiry, user.id]
    );

    await sendOtpMail(user.email, otp);

   return res.status(200).json({
  success: true,
  code: "OTP_SENT",
  message:
    "OTP has been sent to your registered email. Please enter the OTP to continue.",
});
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
  success: false,
  code: "OTP_SERVER_ERROR",
  message:
    "We couldn't send the OTP right now. Please try again later.",
});
  }
};

/* ================= LOGOUT ================= */
/* =========================================================
   LOG OUT (POST /api/auth/logout)
   ========================================================= */
export const logout = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    // ONLY ADMINS
    if (
      req.user?.role === "ADMIN" ||
      req.user?.role === "SUPERADMIN" ||
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
/* =========================================================
   GET CURRENT USER (GET /api/auth/me)
   ========================================================= */
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

/* =========================================================
   CHANGE ADMIN PASSWORD (POST /api/auth/admin/change-password)
   ========================================================= */
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
