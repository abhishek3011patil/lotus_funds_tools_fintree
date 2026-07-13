import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1️⃣ Check user exists (auth middleware must run first)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2️⃣ Check role
if (!req.user?.role || !["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
}

    // 3️⃣ Allow request
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
