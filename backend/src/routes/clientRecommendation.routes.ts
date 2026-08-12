import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { checkClientSubscription } from "../middlewares/clientSubscription.middleware";
import { getClientRecommendationsFeed } from "../controllers/clientRecommendationsFeed/clientRecommendationsFeed.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  checkClientSubscription,
  getClientRecommendationsFeed
);

export default router;
