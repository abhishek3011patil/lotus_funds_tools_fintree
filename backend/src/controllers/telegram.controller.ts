import { Request, Response } from "express";
import { client } from "../telegramClient";

/**
 * Utility: sleep (for flood wait handling)
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe message sender (handles Telegram rate limits)
 */
async function safeSendMessage(userId: any, message: string) {
  try {
<<<<<<< HEAD
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

=======
    await client.sendMessage(userId, { message });
    return { success: true };
>>>>>>> telegram-changes
  } catch (err: any) {
    console.error("Telegram Error:", err);

    if (err.errorMessage?.includes("FLOOD_WAIT")) {
      const seconds = parseInt(err.errorMessage.split("_").pop());
      console.log(`⏳ Flood wait for ${seconds} seconds`);

      await sleep(seconds * 1000);

      // retry once
      await client.sendMessage(userId, { message });
      return { success: true, retried: true };
    }

    return { success: false, error: err.message };
  }
}

/**
 * Send message to a single user
 * Body: { userId, message }
 */
export const sendTelegramMessage = async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;

<<<<<<< HEAD
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
=======
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: "userId and message are required",
      });
    }

    const result = await safeSendMessage(userId, message);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: result.error,
      });
    }

    return res.status(200).json({
>>>>>>> telegram-changes
      success: true,
      message: "Message sent successfully",
      retried: result.retried || false,
    });
  } catch (error: any) {
    console.error("Controller Error:", error);

<<<<<<< HEAD
  } catch (err: any) {
  console.error("🔥 FULL ERROR:", err);

  return res.status(500).json({
    error: err.message || "Verification failed",
  });
}}; 
=======
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Send bulk messages (with delay)
 * Body: { users: [userId1, userId2], message }
 */
export const sendBulkTelegramMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const { users, message } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "users array is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const results: any[] = [];

    for (const userId of users) {
      const result = await safeSendMessage(userId, message);

      results.push({
        userId,
        ...result,
      });

      // 🔥 IMPORTANT: delay to avoid ban
      await sleep(2000);
    }

    return res.status(200).json({
      success: true,
      message: "Bulk messages processed",
      results,
    });
  } catch (error: any) {
    console.error("Bulk Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
>>>>>>> telegram-changes
