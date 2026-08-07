import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getMySubscriptionNotifications,
  getSubscriptionNotificationUnreadCount,
  markAllSubscriptionNotificationsRead,
  markSubscriptionNotificationRead,
} from "../controllers/subscriptionNotification.controller";

const router = Router();

router.use(authenticate);
router.get("/", getMySubscriptionNotifications);
router.get("/unread-count", getSubscriptionNotificationUnreadCount);
router.put("/read-all", markAllSubscriptionNotificationsRead);
router.put("/:id/read", markSubscriptionNotificationRead);

export default router;
