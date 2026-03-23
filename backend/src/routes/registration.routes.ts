import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";

import {
  registerRA,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration
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

router.put("/approve/:id", approveRegistration);

router.put("/reject/:id", rejectRegistration);

/* ================= TEST ROUTE ================= */

router.get("/test", (req: Request, res: Response) => {
  res.send("Registration route working");
});

export default router;