import express, { Response } from "express";
import {
  getAllUsers,
  saveTelegramUser,
  updateParticipant,
  deleteParticipant,
  sendMessageToRAClients,
  sendOtp,
  verifyOtp,
  getTelegramStatus,
  getMyParticipants,
  saveParticipantRA,
} from "../controllers/telegram.controller";
import {
  authenticate,
  AuthRequest,
} from "../middlewares/auth.middleware";
import { getParticipantsByRA } from "../controllers/telegram.controller";
import { pool } from "../db";

const router = express.Router();

router.get('/participants', getAllUsers);
router.post("/save-user", authenticate, saveTelegramUser);
router.put("/participant/:id", authenticate, updateParticipant);
router.delete("/participant/:id", authenticate, deleteParticipant);
router.post("/send-ra-message", authenticate, sendMessageToRAClients);
router.post("/send-otp", authenticate, sendOtp);
router.post("/verify-otp", authenticate, verifyOtp);
router.get("/ra/:raId", authenticate, getParticipantsByRA);
//router.get("/telegram/status", authenticate, getTelegramStatus);
router.get(
  "/my-participants",
  authenticate,
  getMyParticipants
);

router.post(
  "/add-participant",
  authenticate,
  saveParticipantRA
);

// ✅ STATUS ROUTE
router.get(
  "/status",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const result = await pool.query(
        `
        SELECT telegram_session
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      const user = result.rows[0];

      res.json({
        connected: !!user?.telegram_session,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        connected: false,
      });
    }
  }
);
export default router;