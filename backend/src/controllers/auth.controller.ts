import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db";

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email & password required" });
        }

        const result = await pool.query(
            "SELECT id, password_hash, role FROM users WHERE email = $1 AND status = 'ACTIVE'",
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ DEFINE user properly
        const user = result.rows[0];

        // ✅ bcrypt check (FINAL, CORRECT)
        const isMatch = await bcrypt.compare(password.trim(), user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ create JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET!,
            { expiresIn: "24h" }
        );

        return res.json({ token });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
