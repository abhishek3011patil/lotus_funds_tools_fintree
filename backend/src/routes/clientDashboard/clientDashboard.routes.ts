import { Router } from "express";
import type { NextFunction, Response } from "express";
import { getClientDashboard } from "../../controllers/clientDashboard/clientDashboard.controller";
import {
  authenticate,
  type AuthRequest,
} from "../../middlewares/auth.middleware";

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

router.get("/", authenticate, requireClient, getClientDashboard);

export default router;
