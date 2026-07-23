import { Router } from "express";
import {
  getSubscriptionPlanById,
  getSubscriptionPlans,
} from "../controllers/subscriptionPlans.controller";

const router = Router();

/**
 * Public registration endpoints:
 *
 * GET /api/subscription-plans?audienceType=RA
 * GET /api/subscription-plans/:planId
 */
router.get("/", getSubscriptionPlans);
router.get("/:planId", getSubscriptionPlanById);

export default router;
