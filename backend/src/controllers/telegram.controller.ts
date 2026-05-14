import { Request, Response } from "express";
//import { client } from "../telegramClient";
import { pool } from "../db";
import {AuthRequest} from "../middlewares/auth.middleware";
import { createClient } from "../utils/telegramClientFactory";
import { otpStore } from "../utils/telegramStore";
import { Api } from "telegram";
import { createAuditLog } from "../utils/auditLogger";

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


export const saveTelegramUser = async (
  req: AuthRequest,
  res: Response
) => {
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

    const sessionString =
      sessionResult.rows[0]?.telegram_session;

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

export const sendMessageToRAClients = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const raId = req.user!.id;

    const { message: frontendMessage } =
      req.body;

    // ✅ Validate message
    if (!frontendMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // ==================================================
    // ✅ GET TELEGRAM SESSION
    // ==================================================

    const sessionResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id = $1
      `,
      [raId]
    );

    const sessionString =
      sessionResult.rows[0]?.telegram_session;

    if (!sessionString) {
      return res.status(400).json({
        success: false,
        message: "Telegram not connected",
      });
    }

    // ✅ Create Telegram client
    const client = await createClient(
      sessionString
    );

    // ==================================================
    // ✅ GET RA DETAILS
    // ==================================================

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

    // ✅ Full Name
    const fullName = [
      ra.salutation,
      ra.first_name,
      ra.middle_name,
      ra.surname,
    ]
      .filter(Boolean)
      .join(" ");

    // ==================================================
    // ✅ FINAL MESSAGE
    // ==================================================

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

    // ==================================================
    // ✅ FETCH USERS + GROUPS + CHANNELS
    // ==================================================

    const users = await pool.query(
      `
      SELECT
        telegram_user_id,
        telegram_client_name,
        entity_type
      FROM telegram_users
      WHERE user_id = $1
      `,
      [raId]
    );

    if (users.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No Telegram participants found",
      });
    }

    // ==================================================
    // ✅ SEND MESSAGES
    // ==================================================

    let successCount = 0;

    let failCount = 0;

    const failedEntities: any[] = [];

    for (const u of users.rows) {

      try {

        console.log(
          `📨 Sending to ${u.entity_type}:`,
          u.telegram_client_name ||
            u.telegram_user_id
        );

        // ✅ Resolve entity
        const entity =
          await client.getEntity(
            u.telegram_user_id
          );

        // ✅ Send message
        await client.sendMessage(entity, {
          message: finalMessage,
        });

        console.log(
          `✅ Sent to ${u.entity_type}:`,
          u.telegram_client_name
        );

        successCount++;

        // ✅ Delay to avoid flood wait
        await sleep(2000);

      } catch (err: any) {

        console.error(
          `❌ Failed for ${u.entity_type}:`,
          u.telegram_client_name,
          err.message
        );

        // ==========================================
        // ✅ FLOOD WAIT HANDLING
        // ==========================================

        if (
          err.errorMessage?.includes(
            "FLOOD_WAIT"
          )
        ) {

          const seconds = parseInt(
            err.errorMessage
              .split("_")
              .pop()
          );

          console.log(
            `⏳ Flood wait ${seconds}s`
          );

          await sleep(seconds * 1000);

          try {

            const retryEntity =
              await client.getEntity(
                u.telegram_user_id
              );

            await client.sendMessage(
              retryEntity,
              {
                message: finalMessage,
              }
            );

            console.log(
              `✅ Retry success:`,
              u.telegram_client_name
            );

            successCount++;

          } catch (retryErr: any) {

            console.log(
              `❌ Retry failed:`,
              retryErr.message
            );

            failCount++;

            failedEntities.push({
              entity:
                u.telegram_client_name ||
                u.telegram_user_id,

              type: u.entity_type,

              reason:
                retryErr.message,
            });
          }

        } else {

          failCount++;

          failedEntities.push({
            entity:
              u.telegram_client_name ||
              u.telegram_user_id,

            type: u.entity_type,

            reason: err.message,
          });
        }
      }
    }

    // ==================================================
    // ✅ FINAL RESPONSE
    // ==================================================

    return res.json({
      success: true,

      message:
        "Messages processed successfully",

      stats: {
        total: users.rows.length,

        sent: successCount,

        failed: failCount,
      },

      failedEntities,
    });

  } catch (err: any) {

    console.error(
      "SEND MESSAGE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        err.message ||
        "Internal server error",
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