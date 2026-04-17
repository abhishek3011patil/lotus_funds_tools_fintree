import { Router } from "express";
import { approveUser } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

// ✅ Apply middleware to all admin routes
router.use(authenticate, requireAdmin);

router.post("/approve-user", approveUser);

router.get("/test", (req, res) => {
  res.send("ADMIN ROUTE WORKING");
});


export default router;