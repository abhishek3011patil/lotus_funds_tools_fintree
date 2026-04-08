import express from "express";
import { login, getMe, sendOtp, verifyOtp } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
const router = express.Router();

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

export default router;
