import express from "express";
import { createBroker, getAllBrokers } from "../controllers/broker.controller";
import { upload } from "../middlewares/upload";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = express.Router();

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

router.get("/all-brokers", getAllBrokers);

export default router;