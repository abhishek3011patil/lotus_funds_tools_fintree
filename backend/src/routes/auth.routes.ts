import express from "express";
import { login, getMe, sendOtp, verifyOtp } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { changeAdminPassword } from "../controllers/auth.controller";
import { requireAdmin } from "../middlewares/admin.middleware";
const router = express.Router();
console.log("✅ AUTH ROUTES LOADED");

router.post("/login", (req, res, next) => {
  console.log("🔥 LOGIN ROUTE HIT");
  next();
}, login);
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