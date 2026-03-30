import { Router } from "express";
import {
  sendTelegram,
  verifyTelegramUser,
  getTelegramParticipant,
  updateTelegramParticipant,
  deleteTelegramParticipant,
  getTelegramParticipants,
} from "../controllers/telegram.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
console.log("🚀 Telegram routes file is running");

router.post("/send", authenticate, sendTelegram);
router.post("/verify", authenticate, verifyTelegramUser);
router.post("/save-user", authenticate, verifyTelegramUser); 
router.get(
  "/participant/:telegram_user_id",
  authenticate,
  getTelegramParticipant
);
router.put(
  "/participant/:telegram_user_id",
  authenticate,
  updateTelegramParticipant
);
router.delete(
  "/participant/:telegram_user_id",
  authenticate,
  deleteTelegramParticipant
);
router.get(
  "/participants",
  authenticate,
  getTelegramParticipants
);
router.get("/test", (req, res) => {
  res.send("Telegram route working");
});

export default router;