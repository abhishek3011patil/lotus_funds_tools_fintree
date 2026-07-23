import { Router } from "express";
import {
  authenticate,
} from "../middlewares/auth.middleware";
import {
  getMySubscriptionAccess,
} from "../controllers/subscriptionAccess.controller";

const router = Router();

router.get(
  "/me",
  authenticate,
  getMySubscriptionAccess
);

export default router;
