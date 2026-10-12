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

        await pool.query(
            `UPDATE client_broker_subscriptions
             SET status = 'EXPIRED', updated_at = NOW()
             WHERE client_user_id = $1
               AND status = 'ACTIVE'
               AND expires_at <= NOW()`,
            [req.user.id]
        );

        const subscriptions = await pool.query(
            `SELECT DISTINCT entitlement.ra_user_id
             FROM (
               SELECT ra_user_id
               FROM client_ra_subscriptions
               WHERE client_user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
               UNION
               SELECT ra.user_id AS ra_user_id
               FROM client_broker_subscriptions subscription
               JOIN broker_details broker
                 ON broker.id = subscription.broker_id
               JOIN subscriptions broker_platform_subscription
                 ON broker_platform_subscription.user_id = broker.user_id
                AND broker_platform_subscription.status = 'ACTIVE'
                AND broker_platform_subscription.starts_at <= NOW()
                AND broker_platform_subscription.expires_at > NOW()
               JOIN subscription_plans broker_plan
                 ON broker_plan.id = broker_platform_subscription.plan_id
                AND broker_plan.audience_type = 'BROKER'
               JOIN broker_research_analysts link
                 ON link.broker_id = subscription.broker_id AND link.status = 'ACTIVE'
               JOIN ra_details ra ON ra.id = link.ra_id
               WHERE subscription.client_user_id = $1
                 AND subscription.status = 'ACTIVE'
                 AND subscription.expires_at > NOW()
             ) entitlement`,
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
