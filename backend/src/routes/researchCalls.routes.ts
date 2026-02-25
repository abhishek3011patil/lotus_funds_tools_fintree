import { Router } from "express";
import { createErrata, createResearchCall } from "../controllers/researchCalls.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
    getResearchCalls,
    getPublishedCalls
} from "../controllers/researchCalls.controller";
import { exitResearchCall } from "../controllers/exitResearchCall";


const router = Router();

router.post("/research/calls", authenticate, createResearchCall);

router.get("/research/calls/my", authenticate, getResearchCalls);
router.post("/research/calls/errata", authenticate, createErrata);
router.get("/research/calls/published", authenticate, getPublishedCalls);
router.put("/research/calls/:id/exit", authenticate, exitResearchCall);
// 🔹 Dashboard (already created)



router.get("/test", (req, res) => {
    console.log("TEST ROUTE HIT");
    res.json({ ok: true });
});

export default router;


