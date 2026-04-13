import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;
const stringSession = new StringSession("");
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

  await client.start({
    phoneNumber: async () => await ask("📱 Enter phone: "),
    password: async () => await ask("🔐 Enter 2FA password: "),
    phoneCode: async () => await ask("📩 Enter OTP: "),
    onError: (err) => console.log(err),
  });

  console.log("✅ Telegram connected!");

  const session = client.session.save();
  console.log("🔑 SAVE THIS SESSION:");
  console.log(session);
};