import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const secret = "app-rate-limit-wiring-test-secret";

beforeAll(() => {
  vi.stubEnv("JWT_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
});

afterAll(() => vi.unstubAllEnvs());

describe("application rate-limit wiring", () => {
  it("does not spend API capacity on health checks or frontend routes", async () => {
    const { default: app } = await import("../../src/app");

    for (const path of ["/check", "/", "/login", "/assets/app.js"]) {
      const response = await request(app).get(path);
      expect(response.headers["ratelimit-limit"]).toBeUndefined();
    }
  });

  it("mounts the verified-user API allowance in the real application", async () => {
    const { default: app } = await import("../../src/app");
    const token = jwt.sign({ id: "wiring-test-user" }, secret);
    const response = await request(app)
      .get("/api/route-that-does-not-exist")
      .auth(token, { type: "bearer" })
      .expect(404);

    expect(response.headers["ratelimit-limit"]).toBe("1500");
    expect(response.headers["ratelimit-remaining"]).toBe("1499");
  });
});
