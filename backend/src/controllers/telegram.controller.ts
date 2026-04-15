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
    const { telegram_user_id, telegram_client_name, phone_number, user_id } = req.body;

    const query = `
INSERT INTO telegram_users (
  telegram_user_id,
  telegram_client_name,
  phone_number,
  user_id
)
VALUES ($1, $2, $3, $4)
ON CONFLICT (telegram_user_id)
DO UPDATE SET
  telegram_client_name = EXCLUDED.telegram_client_name,
  phone_number = EXCLUDED.phone_number,
  user_id = EXCLUDED.user_id
RETURNING *;
`;

    const values = [
  telegram_user_id,
  telegram_client_name,
  phone_number,
  user_id   // 👈 ADD THIS
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
      fields.push(`telegram\_client\_name = $${queryCount++}`);
      values.push(telegram_client_name);
    }

    if (phone_number !== undefined) {
      fields.push(`phone\_number = $${queryCount++}`);
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
export const getClientsByRA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM telegram_users WHERE user_id = $1",
      [id]
    );

    res.json(result.rows);

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessageToRAClients = async (req: Request, res: Response) => {
  try {
    const raId = (req as any).user?.id; // ✅ from JWT
    const { message } = req.body;

    if (!raId || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Valid message required",
      });
    }

    console.log("📡 Sending to RA:", raId);

    const result = await pool.query(
      "SELECT telegram_user_id FROM telegram_users WHERE user_id = $1",
      [raId]
    );

    const users = result.rows;

    console.log("👥 Clients count:", users.length);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No clients found for this RA",
      });
    }

    const results: any[] = [];

    for (const u of users) {
      const sendResult = await safeSendMessage(u.telegram_user_id, message);

      results.push({
        userId: u.telegram_user_id,
        ...sendResult,
      });

      await sleep(2000);
    }

    return res.status(200).json({
      success: true,
      message: "Messages sent to RA clients only",
      results,
    });

  } catch (error: any) {
    console.error("RA Message Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
