// telegram.controller.ts
import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { RecommendationPayload, sendMessageSplit } from "../bot";
import { bot } from "../bot";

/* ─── FORMAT MESSAGE ─────────────────────────────────────────────────── */
function formatRecommendationMessage(data: RecommendationPayload): string {
  let message = `📊 *New Recommendation*\n
*Action:* ${data.action}
*Symbol:* ${data.symbol}
*Type:* ${data.callType}
*Trade:* ${data.tradeType}\n`;

  // ✅ Entry
  if (data.entryLow && data.entryUpper) {
    message += `\n*Entry Range:* ${data.entryLow} - ${data.entryUpper}`;
  } else {
    message += `\n*Entry:* ${data.entry}`;
  }

  // ✅ Targets
  message += `\n*Target 1:* ${data.target}`;
  if (data.target2) message += `\n*Target 2:* ${data.target2}`;
  if (data.target3) message += `\n*Target 3:* ${data.target3}`;

  // ✅ Stop Loss
  message += `\n*Stop Loss:* ${data.stopLoss}`;
  if (data.stopLoss2) message += `\n*SL 2:* ${data.stopLoss2}`;
  if (data.stopLoss3) message += `\n*SL 3:* ${data.stopLoss3}`;

  // ✅ Other
  message += `\n\n*Rationale:* ${data.rationale}`;
  message += `\n*Holding:* ${data.holding}`;

  message += `\n\n#StockMarket #Trading`;

  return message;
}

/* ─── MAIN CONTROLLER ───────────────────────────────────────────────── */
export const sendTelegram = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as RecommendationPayload;
    const raUserId = req.user?.id ?? data?.ra_user_id;

    if (!raUserId) return res.status(400).json({ error: "ra_user_id missing" });

    const message = formatRecommendationMessage(data);

    // 1️⃣ Save message to DB
    await pool.query(
      `INSERT INTO telegram_messages
   (ra_user_id, message_text, action, symbol, call_type, trade_type,
    entry_price, entry_low, entry_upper,
    target_price, target_price_2, target_price_3,
    stop_loss, stop_loss_2, stop_loss_3,
    rationale, holding_period)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        raUserId,
        message,
        data.action,
        data.symbol,
        data.callType,
        data.tradeType,

        data.entry,
        data.entryLow || null,
        data.entryUpper || null,

        data.target,
        data.target2 || null,
        data.target3 || null,

        data.stopLoss,
        data.stopLoss2 || null,
        data.stopLoss3 || null,

        data.rationale,
        data.holding,
      ]
    );
    console.log("✅ Message saved to DB");

    // ✅ Store user IDs in variable
    let chatIds: number[] = [];

    const users = await pool.query(
      "SELECT telegram_user_id FROM telegram_users WHERE telegram_user_id IS NOT NULL"
    );

    chatIds = users.rows
      .map((u: { telegram_user_id: string }) => Number(u.telegram_user_id.trim()))
      .filter(Boolean);


    // 3️⃣ Send messages only to valid users
    for (const chatId of chatIds) {
      await sendMessageSplit(chatId, message);
    }

    return res.json({
      success: true,
      total: chatIds.length,
      sent: chatIds.length,
      tip: "Messages saved to DB and sent to active users",
    });

  } catch (err: any) {
    console.error("🔥 Failed to send Telegram message:", err);
    return res.status(500).json({ error: "Failed to send message", detail: err?.message });
  }
};

/* ─── VERIFY & SAVE TELEGRAM USER ───────────────────────────── */

export const verifyTelegramUser = async (req: AuthRequest, res: Response) => {
  try {
    const { telegram_user_id, telegram_client_name } = req.body;
    const userId = req.user?.id;

    if (!telegram_user_id) {
      return res.status(400).json({ error: "Telegram ID is required" });
    }

    if (!/^\d+$/.test(telegram_user_id)) {
      return res.status(400).json({ error: "Invalid Telegram ID format" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let msg;

    try {
      msg = await bot.sendMessage(
        telegram_user_id,
        "✅ Verification successful! Your Telegram is connected."
      );
    } catch (err: any) {
      console.error("Telegram error:", err.response?.body || err.message);
      return res.status(400).json({
        error: "Invalid Telegram ID or user has not started the bot",
      });
    }

    // ✅ Validate username (optional but recommended)
    const realUsername = msg.chat.username;

    if (
      telegram_client_name &&
      realUsername &&
      realUsername !== telegram_client_name.replace("@", "")
    ) {
      return res.status(400).json({
        error: "Username does not match Telegram ID",
      });
    }

    await pool.query(
      `INSERT INTO telegram_users (user_id, telegram_user_id, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_user_id) DO UPDATE 
       SET username = EXCLUDED.username`,
      [userId, telegram_user_id, telegram_client_name || null]
    );

    return res.json({
      success: true,
      message: "Telegram user verified and saved",
    });

  } catch (err: any) {
  console.error("🔥 FULL ERROR:", err);

  return res.status(500).json({
    error: err.message || "Verification failed",
  });
}}; 