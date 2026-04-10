
import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";

import {
  registerRA,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  getRegistrationById,
  updateRARegistration,
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

router.post(
  "/register-ra",
  authenticate,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "sebiCert", maxCount: 1 },
    { name: "sebiReceipt", maxCount: 1 },
    { name: "nismCert", maxCount: 1 },
    { name: "cancelledCheque", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "addressProofDoc", maxCount: 1 }
  ]),
  registerRA
);

/* ================= ADMIN APIs ================= */

router.get("/all-registrations", getAllRegistrations);
router.get("/all-registrations-active-users", getAllRegistrationsActiveUsers);

router.put("/approve/:id", approveRegistration);

router.put("/reject/:id", rejectRegistration);
router.get("/:id", getRegistrationById);

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