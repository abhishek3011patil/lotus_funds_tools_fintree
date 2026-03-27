// bot.ts
import TelegramBot from "node-telegram-bot-api";
import { pool } from "./db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN missing in .env");
  process.exit(1);
}

/* ─── SINGLETON BOT INSTANCE (IMPORTANT) ───────────────────── */

// ✅ Prevent multiple instances (fixes 409 error)
const globalAny = global as any;

if (!globalAny.telegramBot) {
  globalAny.telegramBot = new TelegramBot(BOT_TOKEN);
  globalAny.telegramBot.startPolling();
  console.log("🤖 Telegram bot started...");
}

const bot: TelegramBot = globalAny.telegramBot;

/* ─── HELPERS ─────────────────────────────────────────────── */

// Send a single message safely
async function sendMessage(chatId: number | string, text: string) {
  try {
    const res = await bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
    });
    console.log(`✅ Message sent to ${chatId}`);
    return res;
  } catch (err: any) {
    console.warn(
      `⚠️ Failed to send message to ${chatId}: ${
        err.response?.body?.description || err.message
      }`
    );
    return null;
  }
}

// Split long messages into chunks (Telegram limit ~4096 chars)
async function sendMessageSplit(chatId: number | string, message: string) {
  const chunks = message.match(/(.|[\r\n]){1,4000}/g) || [message];

  for (const chunk of chunks) {
    await sendMessage(chatId, chunk);
    await new Promise((res) => setTimeout(res, 500)); // rate limit
  }
}

/* ─── /start HANDLER ───────────────────────────────────────── */

// Save user when they click /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const userName =
    msg.from?.username ||
    `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim();

  try {
    const existing = await pool.query(
      "SELECT * FROM telegram_users WHERE telegram_user_id = $1",
      [chatId]
    );

    if (existing.rowCount === 0) {
      await pool.query(
        "INSERT INTO telegram_users (telegram_user_id, telegram_client_name) VALUES ($1, $2)",
        [chatId, userName]
      );
      console.log(`✅ New Telegram user saved: ${chatId} (${userName})`);
    } else {
      console.log(`ℹ️ Telegram user already exists: ${chatId} (${userName})`);
    }

    await bot.sendMessage(
      chatId,
      `👋 Hello ${userName}! You will now receive stock recommendations.`
    );
  } catch (err) {
    console.error("🔥 Failed to save Telegram user:", err);
  }
});

// Optional: log all messages
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  console.log(`📩 Received message from ${chatId}: ${msg.text}`);
});

/* ─── TYPES ────────────────────────────────────────── */

export type RecommendationPayload = {
  ra_user_id?: number | string;
  action: string;
  symbol: string;
  callType: string;
  tradeType: string;

  entry: number | string;
  entryLow?: number | string;
  entryUpper?: number | string;

  target: number | string;
  target2?: number | string;
  target3?: number | string;

  stopLoss: number | string;
  stopLoss2?: number | string;
  stopLoss3?: number | string;

  rationale: string;
  holding: string;
};

/* ─── EXPORTS ───────────────────────────────────────── */

export { bot, sendMessageSplit };