import { Router } from "express";
import {
  authenticate,
} from "../middlewares/auth.middleware";
import {
  getMySubscriptionAccess,
} from "../controllers/subscriptionAccess.controller";
import {
  createSubscriptionRenewalOrder,
  cancelSubscriptionRenewalOrder,
  verifySubscriptionRenewalPayment,
} from "../controllers/subscriptionRenewal.controller";
import {
  cancelMySubscription,
} from "../controllers/subscriptionCancellation.controller";
import {
  getMySubscriptionHistory,
} from "../controllers/subscriptionHistory.controller";

const router = Router();

router.get(
  "/me",
  authenticate,
  getMySubscriptionAccess
);

router.get(
  "/history",
  authenticate,
  getMySubscriptionHistory
);

router.post(
  "/renewal/order",
  authenticate,
  createSubscriptionRenewalOrder
);

router.post(
  "/renewal/verify",
  authenticate,
  verifySubscriptionRenewalPayment
);

router.post(
  "/renewal/failure",
  authenticate,
  cancelSubscriptionRenewalOrder
);

router.post(
  "/cancel",
  authenticate,
  cancelMySubscription
);

export default router;
