import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getResearchPerformance } from "../controllers/performance.controller";

const router = Router();

router.use(authenticate);

router.get("/", getResearchPerformance);

export default router;