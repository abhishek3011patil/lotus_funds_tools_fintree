
import "./config/env";



import app from "./app";

import { initTelegram } from "./telegramClient";
import { start } from "repl";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    //await initTelegram(); // 🔥 MUST WAIT

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server start error:", err);
  }
};

startServer();
