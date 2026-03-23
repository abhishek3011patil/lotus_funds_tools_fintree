import express from "express";
import { 
  createBroker, 
  getAllBrokers, 
  approveBroker, 
  rejectBroker 
} from "../controllers/broker.controller";
import { upload } from "../middlewares/upload";

const router = express.Router();

// Existing Registration Route
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

/* ================= ADMIN APPROVAL ROUTES ================= */

// Fetch all brokers for the admin table
router.get("/all-registrations", getAllBrokers);

// Approve a broker by ID
router.put("/approve/:id", approveBroker);

// Reject a broker by ID (expects { reason: "..." } in body)
router.put("/reject/:id", rejectBroker);

export default router;