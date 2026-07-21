import { Router } from "express";
import {
  getNotifications,
  deleteNotification,
  markAllNotificationsRead,
} from "../controllers/notification.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", getNotifications);

router.delete("/:id", deleteNotification);

router.put("/mark-all-read", markAllNotificationsRead);

export default router;