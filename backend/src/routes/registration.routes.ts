import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { changeRAUserPassword, getMyRAProfile } from "../controllers/registration.controller";
import { createRAProfileUpdateRequest } from "../controllers/registration.controller";
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
import { getRADisclaimer, updateRADisclaimer } from "../controllers/researchCalls.controller";

import {
  getRAProfileUpdateRequests,
  approveRAProfileUpdateRequest,
  rejectRAProfileUpdateRequest,
} from "../controllers/registration.controller";
import rateLimit from "express-rate-limit";


const router = express.Router();

// console.log("🔥 registration.routes.ts LOADED");

// router.use((req, res, next) => {
//   console.log("📍 REG ROUTER HIT:", req.method, req.url);
//   next();
// });

// console.log("Registration route loaded");

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only PDF, JPG, JPEG and PNG files are allowed")
      );
    }

    cb(null, true);
  },
});

/* ================= RA REGISTRATION (Admin Only) ================= */
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

router.post(
  "/register-ra",
  registrationLimiter,
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

router.get(
  "/research/disclaimer",
  authenticate,
  getRADisclaimer
);

router.put(
  "/research/disclaimer",
  authenticate,
  updateRADisclaimer
);
/* ================= TEST ROUTE ================= */

router.get("/test", (req: Request, res: Response) => {
  res.send("Registration route working");
});


router.post(
  "/ra/change-password",
  authenticate,
  changeRAUserPassword
);

router.post(
  "/ra/profile-update-request",
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
  createRAProfileUpdateRequest
);


router.get(
  "/ra-profile-update-requests",
  authenticate,
  requireAdmin,
  getRAProfileUpdateRequests
);

router.put(
  "/ra-profile-update-requests/:id/approve",
  authenticate,
  requireAdmin,
  approveRAProfileUpdateRequest
);

router.put(
  "/ra-profile-update-requests/:id/reject",
  authenticate,
  requireAdmin,
  rejectRAProfileUpdateRequest
);
router.get("/profile", authenticate, getMyRAProfile);

export default router;