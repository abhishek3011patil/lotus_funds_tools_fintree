import { Router } from "express";

import {
  sendAadhaarOtp,
  verifyAadhaarOtp,
} from "../controllers/aadhaarKyc.controller";



const router = Router();


/*
 * Send OTP to Aadhaar-linked mobile
 */
router.post(
  "/send-otp",
  sendAadhaarOtp
);


/*
 * Verify OTP
 */
router.post(
  "/verify-otp",
  verifyAadhaarOtp
);


export default router;