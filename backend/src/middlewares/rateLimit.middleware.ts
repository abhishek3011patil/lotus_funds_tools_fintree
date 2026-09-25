import rateLimit from "express-rate-limit";

export const createApiRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: (req) =>
    // The auth router has its own budget so dashboard traffic cannot lock
    // users out of login, OTP delivery, or the session check after login.
    /^\/api\/auth(?:\/|$)/i.test(req.path) ||
    (req.method === "GET" && [
      "/api/telegram/status",
      "/notifications/unread-count",
      "/api/subscription-notifications/unread-count",
    ].includes(req.path)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
