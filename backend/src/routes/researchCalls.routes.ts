import { Router } from "express";
import { createResearchCall } from "../controllers/researchCalls.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
    getResearchCalls,
    getPublishedCalls
} from "../controllers/researchCalls.controller";


const router = Router();

router.post("/research/calls", authenticate, createResearchCall);

router.get("/research/calls/my", authenticate, getResearchCalls);

// 🔹 Dashboard (already created)
router.get("/research/calls/published", authenticate, getPublishedCalls);
export default router;
