import { Router } from "express";
import { activateRA, approveUser, getDisclaimerHistoryByRA, resendPasswordLink, suspendUser } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import whatsappRoutes from "./whatsapp.routes";

const router = Router();

// ✅ Apply middleware to all admin routes
router.use(authenticate, requireAdmin);

router.post("/approve-user", approveUser);

router.post("/suspend-user", suspendUser);

router.get("/test", (req, res) => {
  res.send("ADMIN ROUTE WORKING");
});

router.post(
  "/resend-password-link",
  
  resendPasswordLink
);

router.put(
  "/activate/ra/:id",
  authenticate,
  requireAdmin,
  activateRA
);


router.get(
  "/history/:userId",
  getDisclaimerHistoryByRA
);




export default router;