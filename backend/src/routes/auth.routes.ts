import express from "express";
import { login, logout , getMe, sendOtp, verifyOtp } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { changeAdminPassword } from "../controllers/auth.controller";
import { requireAdmin } from "../middlewares/admin.middleware";

import rateLimit from "express-rate-limit";
import {
  completePasswordSetup,
  validatePasswordSetupToken,
} from "../controllers/passwordSetup.controller";




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




router.post("/login", (req, res, next) => {
  console.log("🔥 LOGIN ROUTE HIT");
  next();
}, login);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/request-otp", sendOtp);
router.post("/verify-otp-and-set-password", verifyOtp);

router.get("/test-auth", (req, res) => {
  res.send("AUTH ROUTES WORKING");
});

router.post(
  "/admin/change-password",
  authenticate,
  requireAdmin,
  changeAdminPassword
);
router.get("/test-change", (req, res) => {
  res.send("CHANGE PASSWORD ROUTE WORKING");
});

export default router;
