import { Router } from "express";
import { activateRA, getDisclaimerHistoryByRA, resendPasswordLink, suspendUser } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import whatsappRoutes from "./whatsapp.routes";
import { approvePaidRegistration } from "../controllers/adminSubscriptionApproval.controller";
import { runSubscriptionNotificationPass } from "../controllers/subscriptionNotification.controller";
import {
  getAllSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
  getNewSupportRequestCount,
} from "../controllers/support.controller";



const router = Router();

router.post("/approve-user", authenticate, requireAdmin, approvePaidRegistration);

router.post("/suspend-user", authenticate, requireAdmin, suspendUser);

router.post(
  "/subscription-notifications/run",
  authenticate,
  requireAdmin,
  runSubscriptionNotificationPass
);

router.post(
  "/resend-password-link",
  authenticate,
  requireAdmin,
  resendPasswordLink
);

router.put(
  "/activate/ra/:id",
  authenticate,
  requireAdmin,
  activateRA
);


router.get(
  "/history/:userId",
  authenticate,
  requireAdmin,
  getDisclaimerHistoryByRA
);

// ADMIN SUPPORT REQUESTS

router.get(
  "/support/requests",
  getAllSupportRequests
);

// Get new support request count for sidebar badge
router.get(
  "/support/requests/unread-count",
  getNewSupportRequestCount
);

router.get(
  "/support/requests/:id",
  getSupportRequestById
);

router.put(
  "/support/requests/:id",
  updateSupportRequest
);



export default router;
