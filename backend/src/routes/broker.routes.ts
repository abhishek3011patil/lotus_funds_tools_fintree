import express from "express";
import {
  changeBrokerPassword,
  createBroker,
  getAllBrokers,
  getMyBrokerProfile,
} from "../controllers/broker.controller";
import { upload } from "../middlewares/upload";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import rateLimit from "express-rate-limit";
import { requireBroker, listBrokerAnalysts, searchExistingAnalysts, addExistingAnalyst,
  createBrokerInvitation, getBrokerInvitation, listBrokerCalls } from "../controllers/brokerOnboarding.controller";

const router = express.Router();
const invitationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
router.get("/ra-invitations/:token", invitationLimiter, getBrokerInvitation);
router.get("/research-analysts", authenticate, requireBroker, listBrokerAnalysts);
router.get("/research-analysts/search", authenticate, requireBroker, searchExistingAnalysts);
router.post("/research-analysts", authenticate, requireBroker, addExistingAnalyst);
router.post("/ra-invitations", authenticate, requireBroker, invitationLimiter, createBrokerInvitation);
router.get("/research-calls", authenticate, requireBroker, listBrokerCalls);

router.post(
  "/register-broker",
  upload.fields([
    { name: "sebi_certificate", maxCount: 1 },
    { name: "exchange_certificates", maxCount: 10 },
    { name: "appointment_letter", maxCount: 1 },
    { name: "networth_certificate", maxCount: 1 },
    { name: "financial_statements", maxCount: 1 },
    { name: "ca_certificate", maxCount: 1 },
  ]),
  createBroker
);

router.get(
  "/all-brokers",
  authenticate,
  requireAdmin,
  getAllBrokers
);

router.get("/me", authenticate, getMyBrokerProfile);
router.post(
  "/change-password",
  authenticate,
  changeBrokerPassword
);

export default router;
