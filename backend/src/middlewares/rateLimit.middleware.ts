import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import "../config/env";

// This middleware runs before route authentication. Only a verified JWT may
// select a user budget; forged/expired tokens must share the anonymous IP limit.
const identities = new WeakMap<Request, string | undefined>();
const verifiedUserId = (req: Request): string | undefined => {
  if (identities.has(req)) return identities.get(req);
  let id: string | undefined;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ") && process.env.JWT_SECRET) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      if (typeof payload !== "string" &&
          (typeof payload.id === "string" || typeof payload.id === "number")) {
        id = String(payload.id) || undefined;
      }
    } catch {
      // Route authentication still rejects invalid credentials.
    }
  }
  identities.set(req, id);
  return id;
};

export const isSessionCheck = (path: string) => /^\/me\/?$/i.test(path);

export const createApiRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  // Shared office/mobile IPs must not make signed-in users block each other.
  limit: (req) => verifiedUserId(req) ? 1500 : 300,
  keyGenerator: (req) => {
    const id = verifiedUserId(req);
    return id ? `user:${id}` : `ip:${ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown")}`;
  },
  skip: (req) =>
    // Frontend documents/assets and health probes are not API traffic.
    !/^\/(?:api|admin|notifications|uploads)(?:\/|$)/i.test(req.path) ||
    // The auth router has its own budget so dashboard traffic cannot lock
    // users out of login or OTP delivery. Session reads use the API budget.
    (/^\/api\/auth(?:\/|$)/i.test(req.path) &&
      !/^\/api\/auth\/me\/?$/i.test(req.path)) ||
    (req.method === "GET" && [
      "/api/telegram/status",
      "/notifications/unread-count",
      "/api/subscription-notifications/unread-count",
    ].includes(req.path.toLowerCase().replace(/\/$/, ""))),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
