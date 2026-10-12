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
import {
  listRAConnectionRequests,
  listRAConnectedBrokers,
  removeRAConnectedBroker,
  respondToRAConnectionRequest,
} from "../../controllers/brokerOnboarding.controller";
import {
  createAudienceGroup,
  deleteAudienceGroup,
  listAudienceConnections,
  listAudienceGroups,
  updateAudienceGroup,
} from "../../controllers/audienceGroups.controller";

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
router.get("/broker-requests", listRAConnectionRequests);
router.patch("/broker-requests/:brokerId", respondToRAConnectionRequest);
router.get("/broker-connections", listRAConnectedBrokers);
router.delete("/broker-connections/:brokerId", removeRAConnectedBroker);
router.get("/audience-groups", listAudienceGroups);
router.get("/audience-groups/connections", listAudienceConnections);
router.post("/audience-groups", createAudienceGroup);
router.put("/audience-groups/:groupId", updateAudienceGroup);
router.delete("/audience-groups/:groupId", deleteAudienceGroup);

export default router;
