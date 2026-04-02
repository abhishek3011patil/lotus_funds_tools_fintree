import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchCalls.routes";
import authRoutes from "./routes/auth.routes";
//import debugRoutes from "./routes/debug.routes";
import brokerRoutes from "./routes/broker.routes";
import registrationRoutes from "./routes/registration.routes";
<<<<<<< HEAD
import telegramRoutes from "./routes/telegram.routes";
import adminRoutes from "./routes/admin.routes";
import path from "path";
=======
>>>>>>> telegram-changes

// import adminRoutes from "./routes/admin.routes";
import path from "path";
import telegramRoutes from "./routes/telegram.routes";
import { initTelegram } from "./telegramClient";

const app = express();

const allowedOrigins = [
  "https://ng52ddcn-5173.inc1.devtunnels.ms",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));




app.use(express.json());

<<<<<<< HEAD
console.log("🔥 Admin route import:", adminRoutes);
=======
// console.log("🔥 Admin route import:", adminRoutes);
>>>>>>> telegram-changes

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
//app.use("/api", authRoutes);
app.use("/api", researchRoutes);
//app.use("/api", debugRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api/registration", registrationRoutes);
// app.use("/api", telegramRoutes);
// app.use("/api/telegram", telegramRoutes);
app.use("/api", telegramRoutes);
<<<<<<< HEAD
app.use("/admin", adminRoutes);
=======
app.use("/api/telegram", telegramRoutes);

// app.use("/admin", adminRoutes);
app.use("/api/telegram", telegramRoutes);
>>>>>>> telegram-changes

// app.get("/api/health", (_req, res) => {
//   res.json({ status: "OK" });
// });


const PORT = process.env.PORT || 5000;

async function startServer() {
  await initTelegram();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();

export default app;
