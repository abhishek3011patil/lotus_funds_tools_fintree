import { NextFunction, Response, Router } from "express";
import {
  changeClientPassword,
  getClientProfile,
} from "../../controllers/clientAccount/clientAccount.controller";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";

const router = Router();

const requireClient = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "CLIENT") {
    return res.status(403).json({ success: false, message: "Client access required" });
  }
  next();
};

router.use(authenticate, requireClient);
router.get("/profile", getClientProfile);
router.post("/change-password", changeClientPassword);

export default router;
