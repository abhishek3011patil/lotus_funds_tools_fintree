import { Request, Response } from "express";
//import { client } from "../telegramClient";
import { pool } from "../db";
import {AuthRequest} from "../middlewares/auth.middleware";
import { createClient } from "../utils/telegramClientFactory";
import { otpStore } from "../utils/telegramStore";
import { Api } from "telegram";
import { createAuditLog } from "../utils/auditLogger";
import fs from "fs";
import * as XLSX from "xlsx";
import path from "path";


/* ================= GET CLIENT IP ================= */

const getClientIp = (req: Request) => {
  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  // if multiple IPs exist
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // convert IPv6 localhost
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // remove IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};

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
interface ExcelParticipant {
  Username?: string;
  username?: string;
  Phone?: string;
  phone?: string;
  "Telegram Username"?: string;
  "Phone Number"?: string;
  "User ID"?: string;
  user_id?: string;
  telegram_user_id?: string;
}

/* =========================================================
   GET ALL TELEGRAM PARTICIPANTS (GET /api/telegram/participants)
   ========================================================= */
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


/* =========================================================
   SAVE TELEGRAM USER (POST /api/telegram/save-user)
   ========================================================= */
export const saveTelegramUser = async (
  req: AuthRequest,
  res: Response
) => {
   console.log("=== SAVE USER ===");
  console.log("req.user:", req.user);
  console.log("req.body:", req.body);
  try {
    const {
      telegram_user_id,
      telegram_client_name,
      phone_number,
      user_id,
    } = req.body;

    // ✅ Validate RA ID
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "RA ID (user_id) is required",
      });
    }

    // ✅ Ensure RA exists
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid RA ID (not found in users table)",
      });
    }

    // ✅ At least one field required
    if (
      !telegram_user_id &&
      !telegram_client_name &&
      !phone_number
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide telegram_user_id or username or phone",
      });
    }

    // ✅ Get RA Telegram session
    const sessionResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id = $1
      `,
      [user_id]
    );

    const sessionString = sessionResult.rows[0]?.telegram_session;
    console.log("SESSION =", sessionString);

    // ✅ Default values
    let resolvedTelegramId =
      telegram_user_id || null;

    let resolvedUsername =
      telegram_client_name || "";

    let entityType = "USER";

    // Normalize username
    if (
      resolvedUsername &&
      !resolvedUsername.startsWith("@")
    ) {
      resolvedUsername =
        `@${resolvedUsername}`;
    }

    // ✅ Verify from Telegram if session exists
    if (sessionString) {

      try {

        const client =
          await createClient(sessionString);

        // ✅ Supports:
        // USER
        // GROUP
        // CHANNEL
        const entity: any =
          await client.getEntity(
            telegram_user_id ||
            telegram_client_name ||
            phone_number
          );

        if (!entity || !entity.id) {
          return res.status(400).json({
            success: false,
            message:
              "Telegram entity not found",
          });
        }

        // ✅ Telegram ID
        resolvedTelegramId =
          entity.id.toString();

        // ✅ Detect entity type
        if (entity.className === "Channel") {
          entityType = entity.megagroup
            ? "GROUP"
            : "CHANNEL";
        }

        if (entity.className === "Chat") {
          entityType = "GROUP";
        }

        // ✅ Resolve name
        if (entity.username) {
          resolvedUsername =
            `@${entity.username}`;

        } else if (entity.title) {

          resolvedUsername =
            entity.title;

        } else if (
          entity.firstName ||
          entity.lastName
        ) {

          resolvedUsername =
            `${entity.firstName || ""} ${
              entity.lastName || ""
            }`.trim();
        }

      } catch (err) {

        console.error(
          "❌ Telegram lookup failed:",
          err
        );

        return res.status(400).json({
          success: false,
          message:
            "Telegram user/group/channel not found",
        });
      }
    }

    // ✅ Save in DB
    const query = `
      INSERT INTO telegram_users (
        telegram_user_id,
        telegram_client_name,
        phone_number,
        user_id,
        entity_type
      )
      VALUES ($1, $2, $3, $4, $5)

      ON CONFLICT (
        telegram_user_id,
        user_id
      )

      DO UPDATE SET

        telegram_client_name =
          EXCLUDED.telegram_client_name,

        phone_number =
          EXCLUDED.phone_number,

        entity_type =
          EXCLUDED.entity_type

      RETURNING *;
    `;

    const result = await pool.query(
      query,
      [
        resolvedTelegramId,
        resolvedUsername,
        phone_number || "",
        user_id,
        entityType,
      ]
    );

    // ✅ AUDIT LOG (ADMIN ONLY)
    if (req.user?.role === "ADMIN") {

      await createAuditLog({
        adminId: req.user?.id,

        adminName:
          req.user?.name || "ADMIN",

        adminRole:
          req.user?.role || "ADMIN",

        action: "ADD",

        module: "TELEGRAM_CLIENT",

        targetEntity:
          resolvedUsername ||
          resolvedTelegramId ||
          phone_number,

        targetType: entityType,

        description:
          `Admin added Telegram ${entityType} for RA ID ${user_id}`,

        status: "SUCCESS",

        ipAddress: getClientIp(req),

        device:
          req.headers[
            "user-agent"
          ] as string,

        newValue: result.rows[0],
      });
    }

    return res.json({
      success: true,

      data: result.rows[0],

      message: sessionString
        ? `${entityType} saved after Telegram verification`
        : `${entityType} saved (Telegram not connected, verification skipped)`,
    });

  } catch (error: any) {

    console.error(
      "SAVE TELEGRAM ENTITY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Internal server error",
    });
  }
};

/* =========================================================
   UPDATE TELEGRAM PARTICIPANT (PUT /api/telegram/participant/:id)
   ========================================================= */
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

    const oldData = await pool.query(
  `SELECT * FROM telegram_users WHERE id = $1`,
  [id]
);

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

    // ✅ AUDIT LOG
if (role === "ADMIN") {
  await createAuditLog({
    adminId: req.user?.id,

    adminName: req.user?.name || "ADMIN",

    adminRole: req.user?.role || "ADMIN",

    action: "UPDATE",

    module: "TELEGRAM_CLIENT",

    targetEntity:
      result.rows[0]?.telegram_client_name ||
      result.rows[0]?.telegram_user_id,

    targetType: "CLIENT",

    description: "Admin updated Telegram client",

    status: "SUCCESS",

   ipAddress: getClientIp(req),

    device: req.headers["user-agent"] as string,

    oldValue: oldData.rows[0],

    newValue: result.rows[0],
  });
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

/* =========================================================
   DELETE TELEGRAM PARTICIPANT (DELETE /api/telegram/participant/:id)
   ========================================================= */
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

    const oldData = await pool.query(
  `SELECT * FROM telegram_users WHERE id = $1`,
  [id]
);

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

    // ✅ AUDIT LOG
if (role === "ADMIN") {
  await createAuditLog({
    adminId: req.user?.id,

    adminName: req.user?.name || "ADMIN",

    adminRole: req.user?.role || "ADMIN",

    action: "DELETE",

    module: "TELEGRAM_CLIENT",

    targetEntity:
      oldData.rows[0]?.telegram_client_name ||
      oldData.rows[0]?.telegram_user_id,

    targetType: "CLIENT",

    description: "Admin deleted Telegram client",

    status: "SUCCESS",

    ipAddress: getClientIp(req),

    device: req.headers["user-agent"] as string,

    oldValue: oldData.rows[0],
  });
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

/* =========================================================
   GET TELEGRAM PARTICIPANTS BY RESEARCH ANALYST (GET /api/telegram/ra/:raId)
   ========================================================= */
export const getParticipantsByRA = async (
  req: Request,
  res: Response
) => {
  try {

    const { raId } = req.params;

    if (
      !raId ||
      raId === "undefined" ||
      raId === "null"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid RA ID",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        telegram_user_id,
        telegram_client_name,
        phone_number,
        entity_type
      FROM telegram_users
      WHERE user_id = $1
      ORDER BY telegram_client_name ASC
      `,
      [raId]
    );

    return res.json({
      success: true,

      count: result.rows.length,

      data: result.rows,
    });

  } catch (err) {

    console.error(
      "GET PARTICIPANTS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch participants",
    });
  }
};

// Utility: sleep
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/* =========================================================
   SEND MESSAGE TO RESEARCH ANALYST CLIENTS (POST /api/telegram/send-ra-message)
   ========================================================= */
export const sendMessageToRAClients = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("SEND RA MESSAGE HIT");
    console.log("BODY RECEIVED:", req.body);

    const raId = req.user?.id;
    const { message: frontendMessage } = req.body;

    if (!raId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!frontendMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

   const [sessionResult, usersResult] = await Promise.all([
      pool.query(
        `
        SELECT telegram_session
        FROM users
        WHERE id = $1
        `,
        [raId]
      ),

   

      pool.query(
        `
        SELECT
          telegram_user_id,
          telegram_client_name,
          entity_type
        FROM telegram_users
        WHERE user_id = $1
        `,
        [raId]
      ),
    ]);

    const sessionString = sessionResult.rows[0]?.telegram_session;
  
    const users = usersResult.rows;

    if (!sessionString) {
      return res.status(400).json({
        success: false,
        message: "Telegram not connected",
      });
    }

   

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Telegram participants found",
      });
    }

   const finalMessage = String(frontendMessage).trim();

// Read Full Disclaimer / Disclosure at : https://lotusfunds.com/disclaimer&disclosure


    // ✅ Respond immediately. Frontend will not wait for Telegram sending.
    res.status(202).json({
      success: true,
      message: "Telegram sending started",
      stats: {
        total: users.length,
      },
    });

    // ✅ Send Telegram in background
    setImmediate(async () => {
      let successCount = 0;
      let failCount = 0;
      const failedEntities: any[] = [];

      try {
        const client = await createClient(sessionString);

        for (const u of users) {
          try {
            console.log(
              `📨 Sending to ${u.entity_type}:`,
              u.telegram_client_name || u.telegram_user_id
            );

            const entity = await client.getEntity(u.telegram_user_id);

            await client.sendMessage(entity, {
              message: finalMessage,
            });

            console.log(
              `✅ Sent to ${u.entity_type}:`,
              u.telegram_client_name
            );

            successCount++;

            await sleep(2000);
          } catch (err: any) {
            console.error(
              `❌ Failed for ${u.entity_type}:`,
              u.telegram_client_name,
              err.message
            );

            if (err.errorMessage?.includes("FLOOD_WAIT")) {
              const seconds = parseInt(err.errorMessage.split("_").pop());

              console.log(`⏳ Flood wait ${seconds}s`);

              await sleep(seconds * 1000);

              try {
                const retryEntity = await client.getEntity(u.telegram_user_id);

                await client.sendMessage(retryEntity, {
                  message: finalMessage,
                });

                console.log("✅ Retry success:", u.telegram_client_name);

                successCount++;
              } catch (retryErr: any) {
                failCount++;

                failedEntities.push({
                  entity: u.telegram_client_name || u.telegram_user_id,
                  type: u.entity_type,
                  reason: retryErr.message,
                });
              }
            } else {
              failCount++;

              failedEntities.push({
                entity: u.telegram_client_name || u.telegram_user_id,
                type: u.entity_type,
                reason: err.message,
              });
            }
          }
        }

        console.log("✅ BACKGROUND TELEGRAM DONE", {
          total: users.length,
          sent: successCount,
          failed: failCount,
          failedEntities,
        });
        await createAuditLog({
  adminId: req.user?.id,
 adminName: req.user?.name || "RA",
  adminRole: req.user?.role || "RESEARCH_ANALYST",
  action: "TELEGRAM_MESSAGE_SENT",
  module: "TELEGRAM",
  targetEntity: raId,
  targetType: "TELEGRAM_BROADCAST",
  description: "Research call/message sent via Telegram",
  status: failCount === 0 ? "SUCCESS" : "PARTIAL_SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: null,
  newValue: {
    totalRecipients: users.length,
    successCount,
    failCount,
    failedEntities,
    messageLength: frontendMessage.length,
  },
});
      } catch (err: any) {
        console.error("❌ BACKGROUND TELEGRAM ERROR:", err.message);
      }
    });

    return;
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

/* =========================================================
   SEND TELEGRAM OTP (POST /api/telegram/send-otp)
   ========================================================= */
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

/* =========================================================
   VERIFY TELEGRAM OTP (POST /api/telegram/verify-otp)
   ========================================================= */
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
// GET /api/telegram/status
export const getTelegramStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(
      `SELECT telegram_session FROM users WHERE id = $1`,
      [req.user!.id]
    );

    const telegramSession =
      result.rows[0]?.telegram_session;

    // ✅ IMPORTANT FIX
    const isConnected =
      !!telegramSession &&
      telegramSession !== "null" &&
      telegramSession.trim() !== "";

    console.log(
      "TELEGRAM SESSION:",
      telegramSession
    );

    console.log(
      "CONNECTED STATUS:",
      isConnected
    );

    return res.json({
      connected: isConnected,
    });

  } catch (err) {
    console.error("STATUS ERROR:", err);

    return res.status(500).json({
      connected: false,
    });
  }
};

/* =========================================================
   ADD TELEGRAM PARTICIPANT (POST /api/telegram/add-participant)
   ========================================================= */
export const saveParticipantRA = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let {
      telegram_client_name,
    } = req.body;

    if (!telegram_client_name) {
      return res.status(400).json({
        success: false,
        message:
          "Telegram username is required",
      });
    }

    // ✅ Normalize username
    telegram_client_name =
      telegram_client_name
        .trim()
        .replace("@", "");

    // ==========================================
    // ✅ GET TELEGRAM SESSION
    // ==========================================

    const userResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    const sessionString =
      userResult.rows[0]?.telegram_session;

    if (!sessionString) {
      return res.status(401).json({
        success: false,
        message:
          "Telegram session not found",
      });
    }

    // ✅ Create client
    const client =
      await createClient(sessionString);

    // ==========================================
    // ✅ GET ENTITY
    // ==========================================

    let entity: any;

    try {

      entity = await client.getEntity(
        telegram_client_name
      );

    } catch (telegramError: any) {

      console.error(
        "❌ TELEGRAM ERROR:",
        telegramError
      );

      return res.status(404).json({
        success: false,
        message:
          "Telegram entity not found",
      });
    }

    // ==========================================
    // ✅ DETECT ENTITY TYPE
    // ==========================================

    let entityType = "USER";

    if (
      entity.className === "Channel"
    ) {

      entityType =
        entity.broadcast
          ? "CHANNEL"
          : "GROUP";

    } else if (
      entity.className === "Chat"
    ) {

      entityType = "GROUP";
    }

    // ==========================================
    // ✅ GET TELEGRAM ID
    // ==========================================

    let telegramId = "";

    if (
      entityType === "GROUP" ||
      entityType === "CHANNEL"
    ) {

      // ✅ IMPORTANT
      telegramId = `-100${entity.id.toString()}`;

    } else {

      telegramId =
        entity.id.toString();
    }

    // ==========================================
    // ✅ USERNAME
    // ==========================================

    const username =
      entity.username
        ? `@${entity.username}`
        : `@${telegram_client_name}`;

    // ==========================================
    // ✅ PHONE (ONLY USERS)
    // ==========================================

    let phone = null;

    if (
      entityType === "USER"
    ) {

      phone =
        entity.phone || null;

      if (
        phone &&
        !phone.startsWith("+")
      ) {
        phone = `+${phone}`;
      }
    }

    console.log("Entity Type:", entityType);
console.log("Entity:", entity);
console.log("Telegram ID:", telegramId);
console.log("Username:", username);
console.log("Phone:", phone);

    // ==========================================
    // ✅ SAVE TO DB
    // ==========================================

    const query = `
      INSERT INTO telegram_users (
        telegram_user_id,
        telegram_client_name,
        phone_number,
        user_id,
        entity_type
      )
      VALUES ($1, $2, $3, $4, $5)

      ON CONFLICT (
        telegram_user_id,
        user_id
      )

      DO UPDATE SET
        telegram_client_name =
          EXCLUDED.telegram_client_name,

        phone_number =
          EXCLUDED.phone_number,

        entity_type =
          EXCLUDED.entity_type

      RETURNING *;
    `;

    const result = await pool.query(
      query,
      [
        telegramId,
        username,
        phone,
        userId,
        entityType,
      ]
    );
    await createAuditLog({
  adminId: req.user?.id,
  adminName: req.user?.name || "RA",
  adminRole: req.user?.role || "RESEARCH_ANALYST",
  action: "PARTICIPANT_ADDED",
  module: "TELEGRAM",
  targetEntity: username,
  targetType: entityType,
  description: `${entityType} added or updated in Telegram participants`,
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: null,
  newValue: {
    participantId: result.rows[0].id,
    telegramUserId: telegramId,
    telegramClientName: username,
    entityType,
    phone,
  },
});

    return res.status(200).json({
      success: true,

      message:
        `${entityType} saved successfully`,

      data: result.rows[0],
    });

  } catch (err: any) {

    console.error(
      "SAVE TELEGRAM ENTITY ERROR:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        err.message ||
        "Failed to save entity",
    });
  }
};

/* =========================================================
   GET MY TELEGRAM PARTICIPANTS (GET /api/telegram/my-participants)
   ========================================================= */
export const getMyParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        telegram_user_id,
        telegram_client_name,
        phone_number,
        entity_type
      FROM telegram_users
      WHERE user_id = $1
      ORDER BY telegram_client_name ASC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,

      count: result.rows.length,

      data: result.rows,
    });

  } catch (err: any) {

    console.error(
      "GET MY PARTICIPANTS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        err.message ||
        "Failed to fetch participants",
    });
  }
};

/* =========================================================
   UPLOAD TELEGRAM PARTICIPANTS (POST /api/telegram/upload-excel)
   ========================================================= */
export const uploadExcelParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const loggedInUserId = req.user?.id;
    const role = req.user?.role;

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user_id = req.body.user_id;

if (!req.file) {
  return res.status(400).json({
    success: false,
    message: "Excel file is required",
  });
}

const workbook = XLSX.readFile(req.file.path);

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const participants = XLSX.utils.sheet_to_json<ExcelParticipant>(sheet);

if (!participants.length) {
  return res.status(400).json({
    success: false,
    message: "Excel is empty",
  });
}

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Participants array is required.",
      });
    }

    // ============================================
    // Decide whose Telegram session to use
    // ============================================

    let targetUserId = loggedInUserId;

    if (role === "ADMIN") {
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "RA ID is required.",
        });
      }

      targetUserId = user_id;
    }

    console.log("Logged In :", loggedInUserId);
    console.log("Target RA :", targetUserId);

    // ============================================
    // Get RA Telegram Session
    // ============================================

    const sessionResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id=$1
      `,
      [targetUserId]
    );

    const sessionString = sessionResult.rows[0]?.telegram_session;

    if (!sessionString) {
      return res.status(400).json({
        success: false,
        message:
          "Selected Research Analyst has not connected Telegram.",
      });
    }

    const client = await createClient(sessionString);

    const results: any[] = [];

    // ============================================
    // Process every Excel row
    // ============================================

    for (let i = 0; i < participants.length; i++) {
      const row = participants[i];

      try {
        console.log("Processing row", i + 1, row);

        let username =
          row.Username ||
          row.username ||
          row["Telegram Username"] ||
          "";

        let phone =
          row.Phone ||
          row.phone ||
          row["Phone Number"] ||
          "";

        let telegramId =
          row["User ID"] ||
          row.user_id ||
          row.telegram_user_id ||
          "";

        username = String(username).trim();
        phone = String(phone).trim();
        telegramId = String(telegramId).trim();

        if (username.startsWith("@")) {
          username = username.substring(1);
        }

        if (!username && !phone && !telegramId) {
          results.push({
            row: i + 2,
            status: "failed",
            error: "Username/Phone/User ID missing",
          });
          continue;
        }

        // Lookup preference:
        // username -> phone -> id

        let lookupValue = "";

        if (username) lookupValue = username;
        else if (phone) lookupValue = phone;
        else lookupValue = telegramId;

        console.log("Lookup :", lookupValue);

        let entity: any = null;

try {
    if (username) {
        entity = await client.getEntity(username);
    }
} catch {}

if (!entity) {
    try {
        if (phone) {
            entity = await client.getEntity(phone);
        }
    } catch {}
}

if (!entity) {
    try {
        if (telegramId) {
            entity = await client.getEntity(telegramId);
        }
    } catch {}
}

if (!entity) {
    results.push({
        row: i + 2,
        status: "failed",
        participant:
            username || phone || telegramId,
        error:
            "Telegram user not found.",
    });

    continue;
}

        let entityType = "USER";

        if (entity.className === "Channel") {
          entityType = entity.broadcast ? "CHANNEL" : "GROUP";
        }

        if (entity.className === "Chat") {
          entityType = "GROUP";
        }

        let finalTelegramId = "";

        if (
          entityType === "GROUP" ||
          entityType === "CHANNEL"
        ) {
          finalTelegramId = "-100" + entity.id;
        } else {
          finalTelegramId = entity.id.toString();
        }

        const finalUsername = entity.username
          ? "@" + entity.username
          : username
          ? "@" + username
          : "";

        let finalPhone = null;

        if (entityType === "USER") {
          finalPhone = entity.phone || phone || null;

          if (
            finalPhone &&
            !finalPhone.startsWith("+")
          ) {
            finalPhone = "+" + finalPhone;
          }
        }

        const db = await pool.query(
          `
          INSERT INTO telegram_users
          (
            telegram_user_id,
            telegram_client_name,
            phone_number,
            user_id,
            entity_type
          )

          VALUES($1,$2,$3,$4,$5)

          ON CONFLICT
          (
            telegram_user_id,
            user_id
          )

          DO UPDATE SET

          telegram_client_name=EXCLUDED.telegram_client_name,
          phone_number=EXCLUDED.phone_number,
          entity_type=EXCLUDED.entity_type

          RETURNING *;
          `,
          [
            finalTelegramId,
            finalUsername,
            finalPhone,
            targetUserId,
            entityType,
          ]
        );

        results.push({
          row: i + 2,
          status: "success",
          username: finalUsername,
          data: db.rows[0],
        });
      } catch (err: any) {
        console.error("ROW ERROR", err);

        results.push({
          row: i + 2,
          status: "failed",
          error: err.message,
        });
      }
    }

    const success = results.filter(
      (x) => x.status === "success"
    ).length;

    const failed = results.filter(
      (x) => x.status === "failed"
    ).length;

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "EXCEL_UPLOAD",
      module: "TELEGRAM",
      targetEntity: `${participants.length} Participants`,
      targetType: "EXCEL_IMPORT",
      description: "Excel upload completed",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      newValue: {
        total: participants.length,
        success,
        failed,
      },
    });

    return res.json({
      success: true,
      summary: {
        total: participants.length,
        success,
        failed,
      },
      results,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================================
   DOWNLOAD TELEGRAM TEMPLATE (GET /api/telegram/download-template)
   ========================================================= */
export const downloadTelegramTemplate = (
  req: Request,
  res: Response
) => {
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "Telegram_sheets.xlsx"
  );

  console.log("FILE PATH =", filePath);
  console.log("EXISTS =", fs.existsSync(filePath));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "Template not found",
    });
  }

  res.download(filePath, "Telegram_Template.xlsx");
};
