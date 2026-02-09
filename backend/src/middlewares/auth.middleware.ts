import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "../config/env";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        // 1️⃣ No header
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        // 2️⃣ Wrong format
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid authorization format" });
        }

        // 3️⃣ Extract token safely
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }

        // 4️⃣ Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as {
            userId: string;
            role: string;
        };

        // 5️⃣ Attach user to request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        console.error("JWT AUTH ERROR:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};
