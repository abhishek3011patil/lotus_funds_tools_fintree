import { Request, Response } from "express";
import { client } from "../telegramClient";
import { pool } from "../db";
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

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // We use a string query because TelegramUser is just a TYPE for the result
    const result = await pool.query(
      "SELECT user_id, telegram_user_id, telegram_client_name, phone_number FROM telegram_users"
    );

    // result.rows will match your TelegramUser interface
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const saveTelegramUser = async (req: Request, res: Response) => {
  try {
    const { telegram_user_id, telegram_client_name, phone_number } = req.body;

    const query = `
      INSERT INTO telegram_users (
        telegram_user_id,
        telegram_client_name,
        phone_number
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_user_id)
      DO UPDATE SET
        telegram_client_name = EXCLUDED.telegram_client_name,
        phone_number = EXCLUDED.phone_number
      RETURNING *;
    `;

    const values = [
      telegram_user_id,
      telegram_client_name,
      phone_number
    ];

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error("DATABASE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateParticipant = async (req: Request, res: Response) => {
  try {
    const { telegram_user_id } = req.params;
    const { telegram_client_name, phone_number } = req.body;

    // 1. Build the dynamic query to handle one or both fields
    const fields = [];
    const values = [];
    let queryCount = 1;

    if (telegram_client_name !== undefined) {
      fields.push(`telegram_client_name = $${queryCount++}`);
      values.push(telegram_client_name);
    }

    if (phone_number !== undefined) {
      fields.push(`phone_number = $${queryCount++}`);
      values.push(phone_number);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    // 2. Add the ID as the final parameter
    values.push(telegram_user_id);
    const queryText = `
      UPDATE telegram_users 
      SET ${fields.join(", ")} 
      WHERE telegram_user_id = $${queryCount}
      RETURNING *;
    `;

    const result = await pool.query(queryText, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }

    res.json({
      success: true,
      message: "Participant updated successfully",
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error("UPDATE ERROR:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/telegram/participant/:telegram_user_id

export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { telegram_user_id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM telegram_users
      WHERE telegram_user_id = $1
      RETURNING *;
      `,
      [telegram_user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error: any) {
    console.error("DELETE ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
};