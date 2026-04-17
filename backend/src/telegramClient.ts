import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;
const savedSession = process.env.TELEGRAM_SESSION || "";

const stringSession = new StringSession(savedSession);

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

export const initTelegram = async () => {
  console.log("🔌 Initializing Telegram MTProto...");

  // ✅ If session exists → NO LOGIN
  if (savedSession) {
    await client.connect();
    console.log("✅ Connected using saved session");
    return;
  }

  // 🔐 First-time login only
  await client.start({
    phoneNumber: async () => await ask("📱 Enter phone (+91XXXXXXXXXX): "),
    password: async () => await ask("🔐 Enter 2FA password (if any): "),
    phoneCode: async () => await ask("📩 Enter OTP: "),
    onError: (err) => console.log(err),
  });

  console.log("✅ Telegram connected!");

  const session = client.session.save();

  console.log("🔑 COPY THIS SESSION AND SAVE IN .env:");
  console.log(`TELEGRAM_SESSION=${session}`);
};