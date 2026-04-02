import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import readline from "readline";

/**
 * Create readline interface
 */
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

/**
 * Load env variables
 */
const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = process.env.TELEGRAM_SESSION || "";

/**
 * Validate env
 */
if (!apiId || !apiHash) {
  throw new Error("❌ TELEGRAM_API_ID or TELEGRAM_API_HASH missing");
}

/**
 * Create session
 */
const stringSession = new StringSession(sessionString);

/**
 * Create client
 */
export const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

/**
 * Initialize Telegram
 */
export async function initTelegram() {
  try {
    console.log("🔌 Initializing Telegram MTProto...");

    await client.start({
      phoneNumber: async () => await ask("📱 Enter phone (+91...): "),
      password: async () => await ask("🔐 Enter 2FA password (if any): "),
      phoneCode: async () => await ask("📩 Enter OTP: "),
      onError: (err) => console.log("Telegram Error:", err),
    });

    console.log("✅ Telegram connected!");

    const session = client.session.save();

    if (!sessionString) {
      console.log("\n⚠️ SAVE THIS SESSION IN .env:\n");
      console.log(session);
      console.log(`\nTELEGRAM_SESSION=${session}\n`);
    } else {
      console.log("♻️ Using existing session");
    }
  } catch (error: any) {
    console.error("❌ Telegram init failed:", error.message);
    throw error;
  }
}