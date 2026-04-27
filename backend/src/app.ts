import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchCalls.routes";
import authRoutes from "./routes/auth.routes";
// import debugRoutes from "./routes/debug.routes";
import brokerRoutes from "./routes/broker.routes";
import registrationRoutes from "./routes/registration.routes";

import adminRoutes from "./routes/admin.routes";
import path from "path";
import telegramRoutes from "./routes/telegram.routes";
// import { initTelegram } from "./telegramClient";
//import { initTelegram } from "./telegramClient";

const app = express();
console.log("🔥 APP FILE LOADED");

const allowedOrigins = [
  "https://ng52ddcn-5173.inc1.devtunnels.ms",
  "http://localhost:5173"
];
app.use((req, res, next) => {
  console.log("🔥 REQUEST HIT:", req.method, req.url);
  next();
});

console.log("🔥 CHANGE PASSWORD ROUTE SHOULD EXIST");

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], // ✅ ADD THIS
}));




app.use(express.json());

// console.log("🔥 Admin route import:", adminRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);

//app.use("/api", authRoutes);
app.use("/api", researchRoutes);
//app.use("/api/research", researchRoutes); 
// app.use("/api", debugRoutes);
//app.use("/api", debugRoutes);

app.use("/api/broker", brokerRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
console.log("🔥 MOUNTING registrationRoutes");
app.use("/api/registration", registrationRoutes);
// app.use("/api", telegramRoutes);
app.use("/api/telegram", telegramRoutes);
//app.use("/api", telegramRoutes);
//app.use("/api/telegram", telegramRoutes);

// app.use("/admin", adminRoutes);
//app.use("/api", telegramRoutes);
app.use("/admin", adminRoutes);
// app.use("/api/telegram", telegramRoutes);

// app.get("/api/health", (_req, res) => {
//   res.json({ status: "OK" });
// });
console.log("🔥 AUTH ROUTE MOUNTED");


// const PORT = process.env.PORT || 5000;

async function startServer() {
  // await initTelegram();
  //await initTelegram();

  //   app.listen(PORT, () => {
  //     console.log(`🚀 Server running on port ${PORT}`);
  //   });
}

// async function startServer() {
//   await initTelegram();
// await initTelegram();
// }

// startServer();
app.get("/check", (req, res) => {
  res.send("APP WORKING");
});

export default app;
