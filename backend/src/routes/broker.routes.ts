import express from "express";
import {
  changeBrokerPassword,
  createBroker,
  getAllBrokers,
  getMyBrokerProfile,
  getBrokerAnalystsById
} from "../controllers/broker.controller";
import { upload } from "../middlewares/upload";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import rateLimit from "express-rate-limit";
import { requireBroker, listBrokerAnalysts, searchExistingAnalysts, addExistingAnalyst, removeBrokerAnalyst,
  createBrokerInvitation, getBrokerInvitation, listBrokerCalls, publishBrokerCall } from "../controllers/brokerOnboarding.controller";
import {
  addBrokerClientToTelegram,
  addBrokerClientToWhatsApp,
  createBrokerClient,
  listBrokerClientDeliveries,
  listBrokerClients,
  removeBrokerClientFromTelegram,
  removeBrokerClientFromWhatsApp,
} from "../controllers/brokerClients.controller";
import { pool } from "../db";
import { requireActiveSubscription } from "../middlewares/subscriptionAccess.middleware";
import { getBrokerDisclaimer, updateBrokerDisclaimer } from "../controllers/brokerDisclaimer.controller";
import { getBrokerCallTemplates, saveBrokerCallTemplate } from "../controllers/researchCallTemplate.controller";

const router = express.Router();
const invitationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
router.get("/ra-invitations/:token", invitationLimiter, getBrokerInvitation);
router.get("/research-analysts", authenticate, requireBroker, listBrokerAnalysts);
router.get("/research-analysts/search", authenticate, requireBroker, searchExistingAnalysts);
router.post("/research-analysts", authenticate, requireBroker, requireActiveSubscription, addExistingAnalyst);
router.delete("/research-analysts/:raId", authenticate, requireBroker, requireActiveSubscription, removeBrokerAnalyst);
router.post("/ra-invitations", authenticate, requireBroker, requireActiveSubscription, invitationLimiter, createBrokerInvitation);
router.get("/research-calls", authenticate, requireBroker, listBrokerCalls);
router.post("/research-calls/:callId/publish", authenticate, requireBroker, requireActiveSubscription, publishBrokerCall);
router.get("/clients", authenticate, requireBroker, listBrokerClients);
router.post("/clients", authenticate, requireBroker, requireActiveSubscription, createBrokerClient);
router.get("/clients/:clientId/deliveries", authenticate, requireBroker, listBrokerClientDeliveries);
router.post("/clients/:clientId/whatsapp", authenticate, requireBroker, requireActiveSubscription, addBrokerClientToWhatsApp);
router.delete("/clients/:clientId/whatsapp", authenticate, requireBroker, requireActiveSubscription, removeBrokerClientFromWhatsApp);
router.post("/clients/:clientId/telegram", authenticate, requireBroker, requireActiveSubscription, addBrokerClientToTelegram);
router.delete("/clients/:clientId/telegram", authenticate, requireBroker, requireActiveSubscription, removeBrokerClientFromTelegram);

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
router.get("/disclaimer", authenticate, getBrokerDisclaimer);
router.put("/disclaimer", authenticate, updateBrokerDisclaimer);
router.get("/message-templates", authenticate, getBrokerCallTemplates);
router.put("/message-templates/:messageType", authenticate, saveBrokerCallTemplate);
router.post(
  "/change-password",
  authenticate,
  changeBrokerPassword
);

// Register this in your broker/admin router:
// Express Route Handler
router.get(
  "/:id/ras",
  authenticate,
  getBrokerAnalystsById
);

export default router;
