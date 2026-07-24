import express from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  getMe,
  sendOtp,
  verifyOtp,
  changeAdminPassword,
} from "../controllers/auth.controller";

import {
  completePasswordSetup,
  validatePasswordSetupToken,
} from "../controllers/passwordSetup.controller";

import {
  authenticate,
} from "../middlewares/auth.middleware";

import {
  requireAdmin,
} from "../middlewares/admin.middleware";

const router = express.Router();

console.log("✅ AUTH ROUTES LOADED");

const passwordSetupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password setup requests. Please try again later.",
  },
});

/* Public password-setup flow */

router.get(
  "/password-setup/validate",
  passwordSetupLimiter,
  validatePasswordSetupToken
);

router.post(
  "/password-setup",
  passwordSetupLimiter,
  completePasswordSetup
);

/* Authentication */

router.post(
  "/login",
  (req, res, next) => {
    console.log("🔥 LOGIN ROUTE HIT");
    next();
  },
  login
);

router.post(
  "/logout",
  authenticate,
  logout
);

router.get(
  "/me",
  authenticate,
  getMe
);

/* Legacy OTP password flow */

router.post(
  "/request-otp",
  sendOtp
);

router.post(
  "/verify-otp-and-set-password",
  verifyOtp
);

/* Admin password */

router.post(
  "/admin/change-password",
  authenticate,
  requireAdmin,
  changeAdminPassword
);

/* Temporary test routes */

router.get(
  "/test-auth",
  (_req, res) => {
    res.send("AUTH ROUTES WORKING");
  }
);

router.get(
  "/test-change",
  (_req, res) => {
    res.send(
      "CHANGE PASSWORD ROUTE WORKING"
    );
  }
);

export default router;