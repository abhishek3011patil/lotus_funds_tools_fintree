import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { checkClientSubscription } from "../middlewares/clientSubscription.middleware";
import { getClientRecommendations } from "../controllers/clientRecommendation.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  checkClientSubscription,
  getClientRecommendations
);

export default router;