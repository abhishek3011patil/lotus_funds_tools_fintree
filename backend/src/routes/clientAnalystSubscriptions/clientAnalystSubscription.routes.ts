import { Router } from "express";
import {
  cancelAnalystSubscription,
  createAnalystSubscriptionOrder,
  listClientAnalysts,
  verifyAnalystSubscriptionPayment,
} from "../../controllers/clientAnalystSubscriptions/clientAnalystSubscription.controller";
import {
  authenticate,
  type AuthRequest,
} from "../../middlewares/auth.middleware";
import type { NextFunction, Response } from "express";
import {
  cancelBrokerSubscription,
  createBrokerSubscriptionOrder,
  listClientBrokers,
  verifyBrokerSubscriptionPayment,
} from "../../controllers/clientAnalystSubscriptions/clientBrokerSubscription.controller";
import {
  getClientAnalystProfile,
  getClientBrokerProfile,
} from "../../controllers/clientAnalystSubscriptions/clientMarketplaceProfile.controller";

const router = Router();

const requireClient = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "CLIENT") {
    return res.status(403).json({ message: "Client access is required." });
  }

  next();
};

router.use(authenticate, requireClient);
router.get("/brokers", listClientBrokers);
router.get("/brokers/:brokerId/profile", getClientBrokerProfile);
router.patch("/brokers/:brokerId/cancel", cancelBrokerSubscription);
router.post("/brokers/:brokerId/order", createBrokerSubscriptionOrder);
router.post("/brokers/payment/verify", verifyBrokerSubscriptionPayment);
router.get("/", listClientAnalysts);
router.get("/:raUserId/profile", getClientAnalystProfile);
router.patch("/:raUserId/cancel", cancelAnalystSubscription);
router.post("/:raUserId/order", createAnalystSubscriptionOrder);
router.post("/payment/verify", verifyAnalystSubscriptionPayment);

export default router;
