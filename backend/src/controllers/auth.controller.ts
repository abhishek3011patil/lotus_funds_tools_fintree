import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware";

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        let user;
        let source = "users";

        // 1️⃣ Check company_users first (ADMIN / EMPLOYEE)
        let result = await pool.query(
            `SELECT id, username, password_hash, role, status
             FROM company_users
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length > 0) {
            user = result.rows[0];
            source = "company_users";
        } else {
            // 2️⃣ Check RA users table
            result = await pool.query(
                `SELECT id, username, password_hash, role, status
                 FROM users
                 WHERE username = $1`,
                [username]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: "Invalid username or password" });
            }

            user = result.rows[0];
        }

        // 3️⃣ Check if user active
        if (user.status?.toLowerCase() !== "active") {
            return res.status(403).json({ message: "Account is inactive" });
        }

        // 4️⃣ Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Normalize role
      const normalizedRole = user.role;

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: normalizedRole,
                source
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1d" }
        );

        return res.json({
        message: "Login successful",
        token,
        role: normalizedRole,
        username: user.username
    });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({
        id: req.user.id,
        role: req.user.role
    });
};
