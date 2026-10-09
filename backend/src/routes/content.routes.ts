import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { createContent, deleteContent, listClientInsights, listMyContent, updateContent, uploadContentImage } from "../controllers/content.controller";
import { contentImageUpload } from "../middlewares/upload";

const router = Router();
router.get("/manage", authenticate, listMyContent);
router.post("/manage", authenticate, createContent);
router.post("/manage/images", authenticate, contentImageUpload.single("image"), uploadContentImage);
router.put("/manage/:id", authenticate, updateContent);
router.delete("/manage/:id", authenticate, deleteContent);
router.get("/client", authenticate, listClientInsights);
export default router;
