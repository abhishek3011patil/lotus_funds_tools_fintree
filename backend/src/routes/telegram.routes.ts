import express from "express";
import {
  getAllUsers,
  saveTelegramUser,
  updateParticipant,
  deleteParticipant,
  sendMessageToRAClients,
  sendOtp,
  verifyOtp,
  getTelegramStatus,
} from "../controllers/telegram.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { getParticipantsByRA } from "../controllers/telegram.controller";
const router = express.Router();

router.get('/participants', getAllUsers);
router.post("/save-user", authenticate, saveTelegramUser);
router.put("/participant/:id", authenticate, updateParticipant);
router.delete("/participant/:id", authenticate, deleteParticipant);
router.post("/send-ra-message", authenticate, sendMessageToRAClients);
router.post("/send-otp", authenticate, sendOtp);
router.post("/verify-otp", authenticate, verifyOtp);
router.get("/ra/:raId", authenticate, getParticipantsByRA);
router.get("/telegram/status", authenticate, getTelegramStatus);

export default router;

