import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchCalls.routes";
import authRoutes from "./routes/auth.routes";
//import debugRoutes from "./routes/debug.routes";
import brokerRoutes from "./routes/broker.routes";
import registrationRoutes from "./routes/registration.routes";
import path from "path"; 


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

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", authRoutes);
app.use("/api", researchRoutes);
//app.use("/api", debugRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/registration", registrationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});



export default app;
