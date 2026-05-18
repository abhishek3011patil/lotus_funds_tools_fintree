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
import auditRoutes from "./routes/audit.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.set("trust proxy", true);
console.log("🔥 APP FILE LOADED");

const allowedOrigins = [
  "https://8x946q4k-5173.inc1.devtunnels.ms",
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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
//app.use("/api", authRoutes);
app.use("/api", researchRoutes);
app.use("/api/research", researchRoutes); 
//app.use("/api", debugRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
console.log("🔥 MOUNTING registrationRoutes");
app.use("/api/registration", registrationRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/admin", adminRoutes);
app.use('/api/payments', paymentRoutes);
// app.get("/api/health", (_req, res) => {
//   res.json({ status: "OK" });
// });
console.log("🔥 AUTH ROUTE MOUNTED");

async function startServer() {}

app.get("/check", (req, res) => {
  res.send("APP WORKING");
});


app.use("/api/audit-logs", auditRoutes);

export default app;