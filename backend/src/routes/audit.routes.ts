import express from "express";

import { authenticate } from "../middlewares/auth.middleware";

import { exportAuditLogs, getAuditLogs } from "../controllers/audit.controller";

const router = express.Router();

router.get(
  "/",
  authenticate,
  getAuditLogs
);

router.get("/export", authenticate, exportAuditLogs);

export default router;