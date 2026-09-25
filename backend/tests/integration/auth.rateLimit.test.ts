import express, { type Request, type Response } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiRateLimiter } from "../../src/middlewares/rateLimit.middleware";

// Exercise the real routing and rate-limit middleware without sending OTPs
// or accessing accounts. Controller authentication behavior has separate tests.
vi.mock("../../src/controllers/auth.controller", () => {
  const ok = (_req: Request, res: Response) => res.json({ success: true });
  return {
    login: (req: Request, res: Response) => req.body.fail
      ? res.status(401).json({ message: "Invalid credentials" })
      : res.json({ requireOtp: true }),
    logout: ok, getMe: ok, sendOtp: ok, verifyOtp: ok,
    changeAdminPassword: ok, sendLoginOtp: ok, requestPasswordReset: ok,
  };
});
vi.mock("../../src/controllers/passwordSetup.controller", () => ({
  completePasswordSetup: (_req: Request, res: Response) => res.sendStatus(200),
  validatePasswordSetupToken: (_req: Request, res: Response) => res.sendStatus(200),
}));
vi.mock("../../src/middlewares/auth.middleware", () => ({
  authenticate: (_req: Request, _res: Response, next: () => void) => next(),
}));
vi.mock("../../src/middlewares/admin.middleware", () => ({
  requireAdmin: (_req: Request, _res: Response, next: () => void) => next(),
}));

let app: express.Express;
beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, "log").mockImplementation(() => {});
  const { default: authRoutes } = await import("../../src/routes/auth.routes");
  app = express();
  app.use(createApiRateLimiter());
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.get("/api/history", (_req, res) => res.sendStatus(200));
  app.get("/api/auth-extra", (_req, res) => res.sendStatus(200));
});

describe("independent authentication request limits", () => {
  it("keeps login, OTP and session checks available after the API budget is exhausted", async () => {
    for (let i = 0; i < 300; i++) {
      await request(app).get("/api/history").expect(200);
    }
    await request(app).get("/api/history").expect(429);
    // Similar names must not accidentally bypass the API limit.
    await request(app).get("/api/auth-extra").expect(429);
    await request(app).post("/api/auth/login").send({}).expect(200);
    await request(app).post("/api/auth/send-otp").send({}).expect(200);
    await request(app).get("/api/auth/me").expect(200);
    // Match Express's case-insensitive and trailing-slash route handling.
    await request(app).post("/API/AUTH/LOGIN/").send({}).expect(200);
  });

  it("limits failed logins and returns Retry-After without counting successful OTP challenges", async () => {
    for (let i = 0; i < 35; i++) {
      await request(app).post("/api/auth/login").send({}).expect(200);
    }
    for (let i = 0; i < 30; i++) {
      await request(app).post("/api/auth/login").send({ fail: true }).expect(401);
    }
    const blocked = await request(app).post("/api/auth/login").send({ fail: true }).expect(429);
    expect(blocked.body.message).toContain("failed login attempts");
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    await request(app).post("/api/auth/request-password-reset").send({}).expect(200);
    await request(app).get("/api/history").expect(200);
  });

  it("still limits authentication traffic and preserves password reset protection", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/request-password-reset").send({}).expect(200);
    }
    await request(app).post("/api/auth/request-password-reset").send({}).expect(429);
    for (let i = 0; i < 294; i++) {
      await request(app).get("/api/auth/test-auth").expect(200);
    }
    const blocked = await request(app).get("/api/auth/test-auth").expect(429);
    expect(blocked.body.message).toContain("authentication requests");
    await request(app).get("/api/history").expect(200);
  });
});
