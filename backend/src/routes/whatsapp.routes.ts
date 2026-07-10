import { Router } from "express";
import {
  
  getWhatsAppParticipants,
  addWhatsAppParticipant,
  updateWhatsAppParticipant,
  deleteWhatsAppParticipant,
} from "../controllers/whatsapp.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// WhatsApp test
router.get(
  "/participants",
  (req, _res, next) => {
    console.log("WHATSAPP PARTICIPANTS ROUTE HIT");
    next();
  },
  authenticate,
  getWhatsAppParticipants
);

// Participants
router.get("/participants", authenticate, getWhatsAppParticipants);

router.post("/participants", authenticate, addWhatsAppParticipant);

router.put("/participants/:id", authenticate, updateWhatsAppParticipant);

router.delete("/participants/:id", authenticate, deleteWhatsAppParticipant);

export default router;