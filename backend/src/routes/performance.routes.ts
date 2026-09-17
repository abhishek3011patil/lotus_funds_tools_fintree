import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getResearchPerformance , exportResearchPerformance} from "../controllers/performance.controller";

const router = Router();

router.use(authenticate);

router.get("/", getResearchPerformance);

router.get("/export", exportResearchPerformance);

export default router;