import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchCalls.routes";
import authRoutes from "./routes/auth.routes";
import debugRoutes from "./routes/debug.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", researchRoutes);
app.use("/api", debugRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});

export default app;
