import { Router } from "express";
import bcrypt from "bcrypt";

const router = Router();

router.get("/debug/hash", async (_req, res) => {
    const hash = await bcrypt.hash("password123", 10);
    res.json({ hash });
});

export default router;
