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

const app = express();
console.log("🔥 APP FILE LOADED");

const allowedOrigins = [
  "https://44hwwl5q-5173.inc1.devtunnels.ms",
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

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
//app.use("/api", authRoutes);
app.use("/api", researchRoutes);
app.use("/api/research", researchRoutes); 
<<<<<<< HEAD
// app.use("/api", debugRoutes);
=======
>>>>>>> 1285576a4393b6bed69469e7698b210d89eddf57
//app.use("/api", debugRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
console.log("🔥 MOUNTING registrationRoutes");
app.use("/api/registration", registrationRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/admin", adminRoutes);
// app.get("/api/health", (_req, res) => {
//   res.json({ status: "OK" });
// });
console.log("🔥 AUTH ROUTE MOUNTED");

async function startServer() {}

app.get("/check", (req, res) => {
  res.send("APP WORKING");
});

export default app;