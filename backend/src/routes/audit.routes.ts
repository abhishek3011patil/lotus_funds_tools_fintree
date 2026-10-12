import express from "express";

import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

import { exportAuditLogs, getAuditLogs } from "../controllers/audit.controller";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAuditLogs
);

router.get("/export", authenticate, requireAdmin, exportAuditLogs);

export default router;
