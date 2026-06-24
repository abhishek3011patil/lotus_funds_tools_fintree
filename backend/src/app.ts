import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import researchRoutes from "./routes/researchCalls.routes";
import authRoutes from "./routes/auth.routes";
import brokerRoutes from "./routes/broker.routes";
import registrationRoutes from "./routes/registration.routes";
import adminRoutes from "./routes/admin.routes";
import telegramRoutes from "./routes/telegram.routes";
import auditRoutes from "./routes/audit.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(limiter);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://ng52ddcn-5173.inc1.devtunnels.ms"
].filter(Boolean) as string[];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api", researchRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/audit-logs", auditRoutes);

app.get("/check", (_req, res) => {
  res.send("APP WORKING");
});

export default app;