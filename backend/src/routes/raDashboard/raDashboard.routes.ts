import { Router } from "express";
import type { NextFunction, Response } from "express";
import {
  getRaDashboardSummary,
  listRaSubscribedClients,
} from "../../controllers/raDashboard/raDashboard.controller";
import {
  authenticate,
  type AuthRequest,
} from "../../middlewares/auth.middleware";

const router = Router();

const requireResearchAnalyst = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "RESEARCH_ANALYST") {
    return res.status(403).json({ message: "Research analyst access is required." });
  }

  next();
};

router.use(authenticate, requireResearchAnalyst);
router.get("/summary", getRaDashboardSummary);
router.get("/clients", listRaSubscribedClients);

export default router;
