import { Router } from "express";
import {
  handleRazorpayWebhook,
} from "../controllers/razorpayWebhook.controller";

const router = Router();

/*
 * Mounted by app.ts at:
 * /api/payments/razorpay
 *
 * Final endpoint:
 * POST /api/payments/razorpay/webhook
 */
router.post(
  "/webhook",
  handleRazorpayWebhook
);

export default router;
