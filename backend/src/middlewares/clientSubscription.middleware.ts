import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { pool } from "../db";

export const checkClientSubscription = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        if (req.user?.role !== "CLIENT") {
            return res.status(403).json({
                success: false,
                message: "Client access is required",
            });
        }

        await pool.query(
            `UPDATE client_ra_subscriptions
             SET status = 'EXPIRED', updated_at = NOW()
             WHERE client_user_id = $1
               AND status = 'ACTIVE'
               AND expires_at <= NOW()`,
            [req.user.id]
        );

        const subscriptions = await pool.query(
            `SELECT ra_user_id
             FROM client_ra_subscriptions
             WHERE client_user_id = $1
               AND status = 'ACTIVE'
               AND expires_at > NOW()`,
            [req.user.id]
        );

        req.allowedRAIds = subscriptions.rows.map((row) => row.ra_user_id);

        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Subscription validation failed",
        });
    }
};
