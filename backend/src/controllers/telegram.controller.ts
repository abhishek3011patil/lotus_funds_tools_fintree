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
    await client.sendMessage(userId, { message });
    return { success: true };
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
      success: true,
      message: "Message sent successfully",
      retried: result.retried || false,
    });
  } catch (error: any) {
    console.error("Controller Error:", error);

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
