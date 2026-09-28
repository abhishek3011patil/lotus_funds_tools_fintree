import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiRateLimiter } from "../../src/middlewares/rateLimit.middleware";

const secret = "rate-limit-regression-test-secret";
let app: express.Express;
const token = (id: string) => jwt.sign({ id, role: "RESEARCH_ANALYST" }, secret);

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", secret);
  app = express();
  app.set("trust proxy", 1);
  app.use(createApiRateLimiter());
  app.use((_req, res) => res.sendStatus(200));
});
afterEach(() => vi.unstubAllEnvs());

describe("production API rate limits", () => {
  it("keeps frontend files, health checks and polling outside the API budget", async () => {
    for (let i = 0; i < 300; i++) {
      await request(app).get("/api/history").expect(200);
    }
    const blocked = await request(app).get("/api/history").expect(429);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    for (const path of ["/", "/login", "/assets/app.js", "/favicon.ico", "/check",
      "/API/TELEGRAM/STATUS/", "/notifications/unread-count",
      "/api/subscription-notifications/unread-count/"]) {
      const response = await request(app).get(path).expect(200);
      expect(response.headers["ratelimit-limit"]).toBeUndefined();
    }
    // Backend paths cannot bypass protection by looking like static files.
    await request(app).get("/api/report.js").expect(429);
    await request(app).get("/admin/users").expect(429);
    await request(app).get("/uploads/private.pdf").expect(429);
  });

  it("gives each verified user an independent, bounded allowance across token refreshes", async () => {
    const alice = token("alice");
    for (let i = 0; i < 1500; i++) {
      await request(app).get("/api/history").auth(alice, { type: "bearer" }).expect(200);
    }
    const refreshed = jwt.sign({ id: "alice", refresh: true }, secret);
    await request(app).get("/api/history").auth(refreshed, { type: "bearer" }).expect(429);
    await request(app).get("/api/history").auth(token("bob"), { type: "bearer" }).expect(200);
    await request(app).get("/api/history").expect(200);
    await request(app).post("/api/auth/login").expect(200);
  }, 15000);

  it("does not give forged or expired tokens their own budgets", async () => {
    for (let i = 0; i < 300; i++) {
      await request(app).get("/api/history").expect(200);
    }
    for (const invalid of ["invalid", jwt.sign({ id: "forged" }, "wrong-secret"),
      jwt.sign({ id: "expired" }, secret, { expiresIn: -1 }), jwt.sign({ role: "ADMIN" }, secret)]) {
      await request(app).get("/api/history").auth(invalid, { type: "bearer" }).expect(429);
    }
    await request(app).get("/api/history").auth(token("valid"), { type: "bearer" }).expect(200);
  });

  it("separates clients behind Caddy and groups IPv6 addresses by subnet", async () => {
    const first = await request(app).get("/api/history").set("X-Forwarded-For", "203.0.113.1");
    const second = await request(app).get("/api/history").set("X-Forwarded-For", "203.0.113.2");
    expect(first.headers["ratelimit-remaining"]).toBe("299");
    expect(second.headers["ratelimit-remaining"]).toBe("299");
    await request(app).get("/api/history").set("X-Forwarded-For", "2001:db8::1");
    const sameSubnet = await request(app).get("/api/history").set("X-Forwarded-For", "2001:db8::2");
    expect(sameSubnet.headers["ratelimit-remaining"]).toBe("298");
  });
});
