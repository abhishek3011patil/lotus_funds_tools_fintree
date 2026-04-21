import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

import {
  registerRA,
  getAllRegistrations,
  approveRegistration,
  rejectUser,
  getRegistrationById,
  getBrokerById,
  updateRARegistration,
  getAllRegistrationsActiveUsers,
  updateBroker,
} from "../controllers/registration.controller";

const router = express.Router();

router.use((req, res, next) => {
  console.log("📍 REG ROUTER HIT:", req.method, req.url);
  next();
});

console.log("Registration route loaded");

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= RA REGISTRATION (Admin Only) ================= */

router.post(
  "/register-ra",
  authenticate,
  requireAdmin,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "pan_card", maxCount: 1 },
    { name: "address_proof_document", maxCount: 1 },
    { name: "sebi_certificate", maxCount: 1 },
    { name: "sebi_receipt", maxCount: 1 },
    { name: "nism_certificate", maxCount: 1 },
    { name: "cancelled_cheque", maxCount: 1 },
  ]),
  registerRA
);

router.put(
  "/edit/ra/:id",
  authenticate,
  requireAdmin,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "pan_card", maxCount: 1 },
    { name: "address_proof_document", maxCount: 1 },
    { name: "sebi_certificate", maxCount: 1 },
    { name: "sebi_receipt", maxCount: 1 },
    { name: "nism_certificate", maxCount: 1 },
    { name: "cancelled_cheque", maxCount: 1 },
  ]),
  updateRARegistration
);

/* ================= BROKER UPDATE (Admin Only) ================= */

router.put(
  "/edit/broker/:id",
  authenticate,
  requireAdmin,
  upload.fields([
    { name: "sebi_certificate", maxCount: 1 },
    { name: "exchange_certificates", maxCount: 1 },
    { name: "appointment_letter", maxCount: 1 },
    { name: "networth_certificate", maxCount: 1 },
    { name: "financial_statements", maxCount: 1 },
    { name: "ca_certificate", maxCount: 1 },
  ]),
  updateBroker
);

/* ================= ADMIN APIs ================= */

router.get("/all-registrations", authenticate, requireAdmin, getAllRegistrations);
router.get("/all-registrations-active-users", authenticate, requireAdmin, getAllRegistrationsActiveUsers);
router.put("/approve/:id", authenticate, requireAdmin, approveRegistration);
router.put("/reject/:type/:id", authenticate, requireAdmin, rejectUser);
router.get("/ra/:id", authenticate, requireAdmin, getRegistrationById);
router.get("/broker/:id", authenticate, requireAdmin, getBrokerById);

/* ================= TEST ROUTE ================= */

router.get("/test", (req: Request, res: Response) => {
  res.send("Registration route working");
});

export default router;