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
import multer from "multer";
import whatsappRoutes from "./routes/whatsapp.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();

app.set("trust proxy", 1);


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
app.use("/notifications", notificationRoutes);

app.get("/check", (_req, res) => {
  res.send("APP WORKING");
});



app.use("/api/whatsapp", whatsappRoutes);



app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("UPLOAD ERROR:", err);

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
  return res.status(400).json({
    success: false,
    message: `Unexpected file field: ${err.field}`,
  });
}

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size must be less than 5 MB.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message?.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong while uploading files.",
  });
});

export default app;