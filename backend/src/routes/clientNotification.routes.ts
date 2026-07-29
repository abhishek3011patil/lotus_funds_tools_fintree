import { Router } from "express";
import {
  getClientNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/clientNotification.controller";

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, getClientNotifications);

router.put("/read-all", authenticate, markAllNotificationsRead);

router.put("/:id/read", authenticate, markNotificationRead);

router.delete("/:id", authenticate, deleteNotification);

export default router;