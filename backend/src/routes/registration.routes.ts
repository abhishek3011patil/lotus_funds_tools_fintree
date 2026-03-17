import express from "express";
import { registerRA, getAllRegistrations } from "../controllers/registration.controller";
import { authenticate } from "../middlewares/auth.middleware";
import multer from "multer";

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
    { name: "addressProofDoc", maxCount: 1 },
  ]),
  registerRA
);

router.get("/all-registrations", getAllRegistrations);
router.get("/test", (req, res) => {
  res.send("Registration route working");
});

export default router;