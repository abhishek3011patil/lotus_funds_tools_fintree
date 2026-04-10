
import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";

import {
  registerRA,
  getAllRegistrations,
  approveRegistration,
  rejectUser,
  getRegistrationById,
  getBrokerById,
  updateRARegistration,
  updateBroker,
  getAllRegistrationsActiveUsers
} from "../controllers/registration.controller";

const router = express.Router();

console.log("Registration route loaded");

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= RA REGISTRATION ================= */

router.put(
  "/edit/ra/:id",
  authenticate,
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

// BROKER UPDATE
router.put(
  "/edit/broker/:id",
  authenticate,
  upload.fields([
    { name: "sebi_certificate", maxCount: 1 },
    { name: "exchange_certificates", maxCount: 1 },
    { name: "appointment_letter", maxCount: 1 },
    { name: "networth_certificate", maxCount: 1 },
    { name: "financial_statements", maxCount: 1 },
    { name: "ca_certificate", maxCount: 1 }
  ]),
  updateBroker
);

/* ================= ADMIN APIs ================= */

router.get("/all-registrations", getAllRegistrations);
router.get("/all-registrations-active-users", getAllRegistrationsActiveUsers);

router.put("/approve/:id", approveRegistration);

//router.put("/reject/:id", rejectRegistration);
router.put("/reject/:type/:id", rejectUser);
//router.get("/:id", getRegistrationById);
router.get("/ra/:id", getRegistrationById);
router.get("/broker/:id", getBrokerById);

/* ================= TEST ROUTE ================= */

router.get("/test", (req: Request, res: Response) => {
  res.send("Registration route working");
});

router.put(
  "/edit/:id",
  authenticate,
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

router.use((req, res, next) => {
  console.log("📍 REG ROUTER HIT:", req.method, req.url);
  next();
});

export default router;