import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const checkClientSubscription = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        // Future:
        // Find which RA(s) client subscribed.
        // Save in req.allowedRAIds

        req.allowedRAIds = null;

        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Subscription validation failed",
        });
    }
};