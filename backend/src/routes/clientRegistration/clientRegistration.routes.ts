import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  activateClient,
  getClientsForAdmin,
  registerClient,
} from "../../controllers/clientRegistration/clientRegistration.controller";
import { upload } from "../../middlewares/upload";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";

const router = Router();

const clientRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

router.get("/admin/clients", authenticate, requireAdmin, getClientsForAdmin);
router.put(
  "/admin/clients/:id/activate",
  authenticate,
  requireAdmin,
  activateClient
);

router.post(
  "/",
  clientRegistrationLimiter,
  upload.single("profilePicture"),
  registerClient
);

export default router;
