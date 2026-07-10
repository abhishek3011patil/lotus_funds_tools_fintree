import { Router } from "express";
import { testWhatsAppMessage } from "../controllers/whatsapp.controller";

const router = Router();

router.post("/test", testWhatsAppMessage);

export default router;