import { Router } from "express";
import {
  createAnalystSubscriptionOrder,
  listClientAnalysts,
  verifyAnalystSubscriptionPayment,
} from "../../controllers/clientAnalystSubscriptions/clientAnalystSubscription.controller";
import {
  authenticate,
  type AuthRequest,
} from "../../middlewares/auth.middleware";
import type { NextFunction, Response } from "express";

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
router.get("/", listClientAnalysts);
router.post("/:raUserId/order", createAnalystSubscriptionOrder);
router.post("/payment/verify", verifyAnalystSubscriptionPayment);

export default router;
