import { Router } from "express";
import { createErrata, createResearchCall, getCallVersionHistory, getMyRecommendationHistory, getRAMessageProfile } from "../controllers/researchCalls.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
    getResearchCalls,
    getPublishedCalls,
    publishDraftCall
} from "../controllers/researchCalls.controller";
import { exitResearchCall } from "../controllers/exitResearchCall";
import { upload } from "../middlewares/upload";


const router = Router();

router.post("/research/calls", authenticate, upload.single("file"), createResearchCall);

router.get("/research/calls/my", authenticate, getResearchCalls);
router.post("/research/calls/errata", authenticate, createErrata);
router.get(
  "/calls/:callId/versions",
  authenticate,
  getCallVersionHistory
);

router.get("/research/calls/published", authenticate, getPublishedCalls);
router.patch("/research/calls/:id/exit", authenticate, exitResearchCall);
//outer.get("/research/performance", authenticate, getResearchPerformance);




router.patch(
    "/research/calls/:id/publish",
    authenticate,
    publishDraftCall
);
// 🔹 Dashboard (already created)



router.get("/test", (req, res) => {
    console.log("TEST ROUTE HIT");
    res.json({ ok: true });
});


router.get(
  "/history/my",
  authenticate,
  getMyRecommendationHistory
);


router.get(
  "/ra/message-profile",
  authenticate,
  getRAMessageProfile
);

export default router;

