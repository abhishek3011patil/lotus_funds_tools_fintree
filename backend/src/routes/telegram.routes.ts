import express from "express";
import {
  sendTelegramMessage,
  sendBulkTelegramMessages,
} from "../controllers/telegram.controller";

const router = express.Router();

<<<<<<< HEAD
router.post("/send", authenticate, sendTelegram);
router.post("/verify", authenticate, verifyTelegramUser);
router.post("/save-user", authenticate, verifyTelegramUser);
router.get("/test", (req, res) => {
  res.send("Telegram route working");
});
=======
/**
 * Send message to one user
 */
router.post("/send", sendTelegramMessage);

/**
 * Send bulk messages
 */
router.post("/send-bulk", sendBulkTelegramMessages);
>>>>>>> telegram-changes

export default router;