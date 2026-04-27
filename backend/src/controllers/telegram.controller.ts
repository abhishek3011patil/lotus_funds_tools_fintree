import { Request, Response } from "express";
//import { client } from "../telegramClient";
import { pool } from "../db";
import {AuthRequest} from "../middlewares/auth.middleware";
import { createClient } from "../utils/telegramClientFactory";
import { otpStore } from "../utils/telegramStore";
import { Api } from "telegram";

/**
 * Safe message sender (handles Telegram rate limits)
 */
// async function safeSendMessage(userId: any, message: string) {
//   try {
//     await client.sendMessage(userId, { message });
//     return { success: true };
//   } catch (err: any) {
//     console.error("Telegram Error:", err);

//     if (err.errorMessage?.includes("FLOOD_WAIT")) {
//       const seconds = parseInt(err.errorMessage.split("_").pop());
//       console.log(`⏳ Flood wait for ${seconds} seconds`);

//       await sleep(seconds * 1000);

//       // retry once
//       await client.sendMessage(userId, { message });
//       return { success: true, retried: true };
//     }

//     return { success: false, error: err.message };
//   }
// }

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


export const saveTelegramUser = async (req: AuthRequest, res: Response) => {
  try {
    const {
      telegram_user_id,
      telegram_client_name,
      phone_number,
      user_id, // ✅ RA ID from frontend
    } = req.body;

    // ✅ 1. Validate RA ID presence
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "RA ID (user_id) is required",
      });
    }

    // ✅ 2. Ensure RA exists (prevents FK error)
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid RA ID (not found in users table)",
      });
    }

    // ✅ 3. At least one field required
    if (!telegram_user_id && !telegram_client_name && !phone_number) {
      return res.status(400).json({
        success: false,
        message: "Provide telegram_user_id or username or phone",
      });
    }

    // ✅ 4. Get RA Telegram session (optional)
    const sessionResult = await pool.query(
      `SELECT telegram_session FROM users WHERE id = $1`,
      [user_id]
    );

    const sessionString = sessionResult.rows[0]?.telegram_session;

    // ✅ 5. Prepare resolved values
    let resolvedTelegramId = telegram_user_id || null;
    let resolvedUsername = telegram_client_name || "";

    // 👉 Normalize username if entered manually
    if (resolvedUsername && !resolvedUsername.startsWith("@")) {
      resolvedUsername = `@${resolvedUsername}`;
    }

    // ✅ 6. STRICT Telegram check ONLY if session exists
    if (sessionString) {
      try {
        const client = await createClient(sessionString);

        let entity: any;

        if (telegram_user_id) {
          entity = await client.getEntity(telegram_user_id);
        } else if (telegram_client_name) {
          entity = await client.getEntity(telegram_client_name);
        } else if (phone_number) {
          entity = await client.getEntity(phone_number);
        }

        if (!entity || !entity.id) {
          return res.status(400).json({
            success: false,
            message: "User not found on Telegram",
          });
        }

        // ✅ Always trust Telegram data if available
        resolvedTelegramId = entity.id.toString();

        if (entity.username) {
          resolvedUsername = `@${entity.username}`;
        }

      } catch (err) {
        console.error("❌ Telegram lookup failed:", err);
        return res.status(400).json({
          success: false,
          message: "User not found on Telegram",
        });
      }
    }

    // ✅ 7. SAME QUERY (unchanged)
    const query = `
      INSERT INTO telegram_users (
        telegram_user_id,
        telegram_client_name,
        phone_number,
        user_id
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_user_id, user_id)
      DO UPDATE SET
        telegram_client_name = EXCLUDED.telegram_client_name,
        phone_number = EXCLUDED.phone_number
      RETURNING *;
    `;

    const result = await pool.query(query, [
      resolvedTelegramId,
      resolvedUsername, // ✅ FIXED HERE
      phone_number || "",
      user_id,
    ]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: sessionString
        ? "Saved after Telegram verification"
        : "Saved (Telegram not connected, skipped verification)",
    });

  } catch (error: any) {
    console.error("SAVE TELEGRAM USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const updateParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role; // ✅ IMPORTANT
    const { id } = req.params;

    const { telegram_client_name, phone_number } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    let query;
    let values;

    // ✅ ADMIN can update ANY participant
    if (role === "ADMIN") {
      query = `
        UPDATE telegram_users
        SET 
          telegram_client_name = COALESCE($1, telegram_client_name),
          phone_number = COALESCE($2, phone_number)
        WHERE id = $3
        RETURNING *
      `;
      values = [telegram_client_name, phone_number, id];
    } 
    // ✅ RA can update only their own
    else {
      query = `
        UPDATE telegram_users
        SET 
          telegram_client_name = COALESCE($1, telegram_client_name),
          phone_number = COALESCE($2, phone_number)
        WHERE id = $3 AND user_id = $4
        RETURNING *
      `;
      values = [telegram_client_name, phone_number, id, userId];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Participant not found" });
    }

    return res.json({
      message: "Participant updated successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/telegram/participant/:telegram_user_id

export const deleteParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role; // ✅ IMPORTANT
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    let query;
    let values;

    // ✅ ADMIN can delete ANY participant
    if (role === "ADMIN") {
      query = `
        DELETE FROM telegram_users
        WHERE id = $1
        RETURNING *
      `;
      values = [id];
    } 
    // ✅ RA restricted
    else {
      query = `
        DELETE FROM telegram_users
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      values = [id, userId];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Participant not found" });
    }

    return res.json({
      message: "Participant deleted successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getParticipantsByRA = async (req: Request, res: Response) => {
  try {
    const { raId } = req.params;

    if (!raId || raId === "undefined" || raId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid RA ID",
      });
    }

    const result = await pool.query(
      `SELECT 
        id,  -- ✅ CRITICAL (DB PRIMARY KEY)
        telegram_user_id,
        telegram_client_name,
        phone_number
       FROM telegram_users
       WHERE user_id = $1
       ORDER BY telegram_client_name ASC`,
      [raId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("GET PARTICIPANTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch participants",
    });
  }
};

// Utility: sleep
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sendMessageToRAClients = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const raId = req.user!.id;
    const { message: frontendMessage } = req.body;

    if (!frontendMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // ✅ 1. GET TELEGRAM SESSION
    const sessionResult = await pool.query(
      `SELECT telegram_session FROM users WHERE id = $1`,
      [raId]
    );

    const sessionString = sessionResult.rows[0]?.telegram_session;

    if (!sessionString) {
      return res.status(400).json({
        success: false,
        message: "Telegram not connected",
      });
    }

    const client = await createClient(sessionString);

    // ✅ 2. GET RA DETAILS (FIXED TABLE)
    const raResult = await pool.query(
      `
      SELECT 
        salutation,
        first_name,
        middle_name,
        surname,
        org_name,
        sebi_reg_no,
        mobile,
        email
      FROM ra_details
      WHERE user_id = $1
      `,
      [raId]
    );

    const ra = raResult.rows[0];

    if (!ra) {
      return res.status(400).json({
        success: false,
        message: "RA details not found",
      });
    }

    const fullName = [
      ra.salutation,
      ra.first_name,
      ra.middle_name,
      ra.surname,
    ]
      .filter(Boolean)
      .join(" ");

    // ✅ 3. FINAL MESSAGE (TEMPLATE)
    const finalMessage = `
${frontendMessage}

*DISCLAIMER CUM DISCLOSURE:*
Investment in securities market are subject to market risks. Read all the related documents carefully before investing.

Research Analyst: ${fullName} (${ra.org_name || "N/A"})
SEBI Registration No: ${ra.sebi_reg_no || "N/A"}
Contact No: ${ra.mobile || "N/A"}
Email ID : ${ra.email || "N/A"}

Read Full Disclaimer / Disclosure at :
https://lotusfunds.com/disclaimer&disclosure
`;

    // ✅ 4. FETCH CLIENTS
    const users = await pool.query(
      `SELECT telegram_user_id FROM telegram_users WHERE user_id = $1`,
      [raId]
    );

    let successCount = 0;
    let failCount = 0;

    for (const u of users.rows) {
      try {
        const entity = await client.getEntity(u.telegram_user_id);

        await client.sendMessage(entity, { message: finalMessage });

        successCount++;

        await sleep(2000);

      } catch (err: any) {
        if (err.errorMessage?.includes("FLOOD_WAIT")) {
          const seconds = parseInt(err.errorMessage.split("_").pop());

          console.log(`⏳ Flood wait ${seconds}s`);

          await sleep(seconds * 1000);

          try {
            const entity = await client.getEntity(u.telegram_user_id);
            await client.sendMessage(entity, { message: finalMessage });
            successCount++;
          } catch {
            failCount++;
          }
        } else {
          console.log("❌ Failed:", u.telegram_user_id, err.message);
          failCount++;
        }
      }
    }

    return res.json({
      success: true,
      message: "Messages processed",
      stats: {
        total: users.rows.length,
        sent: successCount,
        failed: failCount,
      },
    });

  } catch (err: any) {
    console.error("SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

import { setClient, getClient, deleteClient } from "../utils/telegramClientStore";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const sendOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const client = new TelegramClient(
      new StringSession(""), // ✅ fresh session
      Number(process.env.TELEGRAM_API_ID),
      process.env.TELEGRAM_API_HASH!,
      { connectionRetries: 5 }
    );

    await client.connect();

    const result: any = await client.sendCode(
      {
        apiId: Number(process.env.TELEGRAM_API_ID),
        apiHash: process.env.TELEGRAM_API_HASH!,
      },
      phoneNumber
    );

    const userId = Number(req.user!.id);

    // ✅ store client temporarily
    setClient(userId, client);

    // ✅ store OTP metadata
    otpStore.set(userId, {
      phoneCodeHash: result.phoneCodeHash,
      phoneNumber,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err: any) {
    console.error("SEND OTP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send OTP",
    });
  }
};

export const verifyOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;

    const data = otpStore.get(Number(req.user!.id));

    if (!data) {
      return res.status(400).json({ message: "OTP session expired" });
    }

    const client = getClient(Number(req.user!.id));

    if (!client) {
      return res.status(400).json({ message: "Session expired" });
    }

    const { Api } = await import("telegram");

    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: data.phoneNumber,
        phoneCode: code,
        phoneCodeHash: data.phoneCodeHash,
      })
    );

    const sessionString = client.session.save();

    await pool.query(
      `UPDATE users SET telegram_session = $1 WHERE id = $2`,
      [sessionString, req.user!.id]
    );

    deleteClient(Number(req.user!.id));
    otpStore.delete(Number(req.user!.id));

    return res.json({ success: true });

  } catch (err: any) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/telegram/status
export const getTelegramStatus = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT telegram_session FROM users WHERE id = $1`,
      [req.user!.id]
    );

    const isConnected = !!result.rows[0]?.telegram_session;

    return res.json({ connected: isConnected });

  } catch (err) {
    return res.status(500).json({ message: "Error" });
  }
};