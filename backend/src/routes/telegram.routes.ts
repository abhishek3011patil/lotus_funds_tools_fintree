import express from "express";
import {
  sendTelegramMessage,
  sendBulkTelegramMessages,
  getAllUsers,
  saveTelegramUser,
  updateParticipant,
  deleteParticipant,
} from "../controllers/telegram.controller";

const router = express.Router();

/**
 * Send message to one user
 */
router.post("/send", sendTelegramMessage);

/**
 * Send bulk messages
 */
router.post("/send-bulk", sendBulkTelegramMessages);

router.get('/participants', getAllUsers);

router.post('/save-user', saveTelegramUser);

router.put("/participant/:telegram_user_id", updateParticipant);
router.delete("/participant/:telegram_user_id", deleteParticipant);

export default router;