import axios from "axios";
import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

/* ─── TELEGRAM BOT TOKEN ─────────────────────────────────────────────────── */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/* ─── HELPERS ────────────────────────────────────────────────────────────── */

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function sendMessage(chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    });
    return response.data;
  } catch (error: any) {
    console.error(
      `❌ Telegram API Error for chatId ${chatId}:`,
      error?.response?.data || error?.message
    );
    throw error;
  }
}

async function sendMessageSplit(chatId: string | number, message: string) {
  const chunks = message.match(/(.|[\r\n]){1,4000}/g) || [message];
  for (const chunk of chunks) {
    await sendMessage(chatId, chunk);
    await delay(500);
  }
}

/* ─── PAYLOAD TYPE ───────────────────────────────────────────────────────── */

type RecommendationPayload = {
  ra_user_id?: number | string;
  action: string;
  symbol: string;
  callType: string;
  tradeType: string;
  entry: number | string;
  target: number | string;
  stopLoss: number | string;
  rationale: string;
  holding: string;
};

/* ─── MESSAGE FORMATTER ──────────────────────────────────────────────────── */

function formatRecommendationMessage(data: RecommendationPayload): string {
  return (
    `📊 *New Recommendation*\n\n` +
    `*Action:* ${data.action}\n` +
    `*Symbol:* ${data.symbol}\n` +
    `*Type:* ${data.callType}\n` +
    `*Trade:* ${data.tradeType}\n\n` +
    `*Entry:* ${data.entry}\n` +
    `*Target:* ${data.target}\n` +
    `*Stop Loss:* ${data.stopLoss}\n\n` +
    `*Rationale:* ${data.rationale}\n` +
    `*Holding:* ${data.holding}\n\n` +
    `#StockMarket #Trading`
  );
}

/* ─── DEBUG CONTROLLER ───────────────────────────────────────────────────── */
/*
 * GET /api/telegram/debug
 * Hit this in Postman/browser with your Bearer token to see:
 *   - What user ID your JWT decodes to
 *   - What subscribers are stored for that user
 *   - A sample of the telegram_users table
 * DELETE this route once everything is confirmed working.
 */
export const debugTelegram = async (req: AuthRequest, res: Response) => {
  const jwtUserId = req.user?.id ?? null;

  const subscriberRows = jwtUserId
    ? await pool.query(
      "SELECT * FROM telegram_users WHERE user_id = $1",
      [jwtUserId]
    )
    : { rows: [] };

  const allRows = await pool.query(
    "SELECT user_id, telegram_user_id FROM telegram_users LIMIT 10"
  );

  return res.json({
    jwt_decoded_user_id: jwtUserId,
    jwt_full_user_object: req.user,
    subscribers_for_this_user: subscriberRows.rows,
    sample_telegram_users_table: allRows.rows,
    instruction:
      "jwt_decoded_user_id must match a user_id in sample_telegram_users_table. If not — that is your bug.",
  });
};

/* ─── MAIN CONTROLLER ────────────────────────────────────────────────────── */

export const sendTelegram = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as RecommendationPayload;

    console.log("📥 Incoming Body:", JSON.stringify(data, null, 2));
    console.log("👤 req.user from JWT:", JSON.stringify(req.user, null, 2));

    /* ─────────────────────────────────────────────────────────────────────
     * KEY FIX — ra_user_id resolution
     *
     * The frontend was sending:
     *   ra_user_id: res.data?.id || res.data?.data?.ra_user_id
     *
     * res.data?.id is the ID of the NEWLY CREATED RECOMMENDATION ROW,
     * NOT the RA's user ID. That's why the telegram_users lookup returns
     * 0 rows — it's querying with the wrong ID entirely.
     *
     * Correct priority:
     *  1. req.user.id  → the authenticated RA's user ID from the JWT.
     *                    This is ALWAYS correct if authenticate() works.
     *  2. data.ra_user_id → body fallback (only if JWT has no user id).
     * ──────────────────────────────────────────────────────────────────── */
    const raUserId = req.user?.id ?? data?.ra_user_id;

    console.log("🔑 Resolved raUserId:", raUserId);

    /* Guard: BOT TOKEN */
    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: "TELEGRAM_BOT_TOKEN is missing in environment",
      });
    }

    /* Guard: ra_user_id */
    if (!raUserId) {
      return res.status(400).json({
        error: "ra_user_id could not be resolved. Check JWT and request body.",
        debug: {
          jwt_user: req.user ?? null,
          body_ra_user_id: data?.ra_user_id ?? null,
        },
      });
    }

    /* Guard: required fields */
    const requiredFields: (keyof RecommendationPayload)[] = [
      "action", "symbol", "callType", "tradeType",
      "entry", "target", "stopLoss", "rationale", "holding",
    ];
    const missingFields = requiredFields.filter(
      (f) => data[f] === undefined || data[f] === null || data[f] === ""
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        received: data,
      });
    }

    /* 1️⃣ FORMAT MESSAGE */
    const message = formatRecommendationMessage(data);

    /* 2️⃣ SAVE MESSAGE TO DB (non-fatal — don't let a log failure block send) */
    try {
      await pool.query(
        `INSERT INTO telegram_messages
          (ra_user_id, message_text, action, symbol, call_type, trade_type,
           entry_price, target_price, stop_loss, rationale, holding_period)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          raUserId,
          message,
          data.action,
          data.symbol,
          data.callType,
          data.tradeType,
          data.entry,
          data.target,
          data.stopLoss,
          data.rationale,
          data.holding,
        ]
      );
      console.log("✅ Message saved to DB");
    } catch (dbErr: any) {
      console.error("⚠️ DB insert failed (non-fatal, continuing):", dbErr?.message);
    }

    /* 3️⃣ GET TELEGRAM SUBSCRIBERS FOR THIS RA */
    const users = await pool.query(
      "SELECT telegram_user_id FROM telegram_users WHERE user_id = $1",
      [raUserId]
    );

    console.log(
      `👥 Subscribers for raUserId=${raUserId}: ${users.rows.length} found`,
      users.rows
    );

    const chatIds = users.rows
      .map((u: { telegram_user_id: string | number }) =>
        String(u.telegram_user_id).trim()
      )
      .filter(Boolean);

    if (chatIds.length === 0) {
      return res.status(404).json({
        error: "No Telegram subscribers found for this ra_user_id",
        debug: {
          raUserId,
          tip: "Call GET /api/telegram/debug with your Bearer token to diagnose.",
        },
      });
    }

    /* 4️⃣ SEND MESSAGE TO ALL SUBSCRIBERS */
    const failedChatIds: Array<string | number> = [];

    for (const id of chatIds) {
      try {
        await sendMessageSplit(id, message);
        console.log("✅ Sent to chatId:", id);
        await delay(500);
      } catch (err) {
        failedChatIds.push(id);
        console.error("❌ Failed for chatId:", id, err);
      }
    }

    if (failedChatIds.length === chatIds.length) {
      return res.status(502).json({
        error: "Telegram API rejected all recipients",
        failedChatIds,
      });
    }

    return res.json({
      success: true,
      message: "Telegram message sent",
      sentCount: chatIds.length - failedChatIds.length,
      failedCount: failedChatIds.length,
      failedChatIds,
    });

  } catch (err: any) {
    console.error("🔥 Server Error:", err);
    return res.status(500).json({
      error: "Failed to send telegram message",
      detail: err?.message,
    });
  }
};
