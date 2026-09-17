import express from "express";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ post: vi.fn(), query: vi.fn(), connect: vi.fn(), release: vi.fn() }));
vi.mock("axios", () => ({ default: { post: mocks.post } }));
vi.mock("../../src/db", () => ({ pool: { query: mocks.query, connect: mocks.connect } }));
vi.mock("bcrypt", () => ({ default: { hash: vi.fn().mockResolvedValue("test-hash") } }));
vi.mock("../../src/utils/auditLogger", () => ({ createAuditLog: vi.fn() }));

import { issueClientAadhaarProof } from "../../src/utils/clientAadhaarProof";

const app = express();
app.use(express.json());
const identity = { aadhaar: "123456789012", email: "client@example.test", referenceId: "1234567" };
const registration = {
  firstName: "Test", lastName: "Client", email: identity.email, phoneNumber: "9000000000",
  password: "TestPassword123", confirmPassword: "TestPassword123",
  aadhaarNumber: identity.aadhaar, aadhaarReferenceId: identity.referenceId, aadhaarKycStatus: "VERIFIED",
};
const verification = () => ({
  purpose: "client_registration", email: identity.email, aadhaar_number: identity.aadhaar,
  reference_id: identity.referenceId, otp: "121212",
  challenge_token: issueClientAadhaarProof("challenge", identity),
});

beforeAll(async () => {
  process.env.AADHAAR_API_URL = "https://test-api.sandbox.co.in";
  process.env.AADHAAR_API_KEY = "test-key";
  process.env.AADHAAR_API_SECRET = "test-secret";
  const { default: routes } = await import("../../src/routes/aadhaarKyc.routes");
  const { registerClient } = await import("../../src/controllers/clientRegistration/clientRegistration.controller");
  app.use("/aadhaar", routes);
  app.post("/register", registerClient);
});

beforeEach(() => {
  vi.resetAllMocks();
  process.env.JWT_SECRET = "unit-test-secret-not-for-production";
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.connect.mockResolvedValue({ query: mocks.query, release: mocks.release });
  mocks.query.mockImplementation(async (sql: string) => sql.includes("INSERT INTO users")
    ? { rows: [{ id: "test-user", email: identity.email }], rowCount: 1 }
    : { rows: [], rowCount: 0 });
});
afterEach(() => vi.useRealTimers());

describe("client Aadhaar registration proof", () => {
  it("rejects the original fabricated VERIFIED/reference bypass before accessing the DB", async () => {
    const response = await request(app).post("/register").send(registration);
    expect(response.status).toBe(400);
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it.each(["tampered", "challenge", "email", "aadhaar", "reference", "expired"])(
    "rejects %s verification proof", async (kind) => {
      let token = issueClientAadhaarProof(kind === "challenge" ? "challenge" : "verified", identity);
      const body = { ...registration, aadhaarVerificationToken: token };
      if (kind === "tampered") body.aadhaarVerificationToken = token.slice(0, -5) + "abcde";
      if (kind === "email") body.email = "another@example.test";
      if (kind === "aadhaar") body.aadhaarNumber = "999999999999";
      if (kind === "reference") body.aadhaarReferenceId = "fake-reference";
      if (kind === "expired") {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(Date.now() + 31 * 60 * 1000);
      }
      const response = await request(app).post("/register").send(body);
      expect(response.status).toBe(400);
      expect(mocks.connect).not.toHaveBeenCalled();
    },
  );

  it("binds the challenge to the original Aadhaar, email and reference before contacting the provider", async () => {
    for (const change of [{ email: "another@example.test" }, { reference_id: "fake-reference" }, { challenge_token: "fake" }]) {
      const response = await request(app).post("/aadhaar/verify-otp").send({ ...verification(), ...change });
      expect(response.status).toBe(400);
    }
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("does not issue a proof when provider verification fails", async () => {
    mocks.post.mockResolvedValueOnce({ data: { data: { access_token: "provider-token" } } })
      .mockResolvedValueOnce({ data: { data: { status: "INVALID" } } });
    const response = await request(app).post("/aadhaar/verify-otp").send(verification());
    expect(response.status).toBe(400);
    expect(response.body.verification_token).toBeUndefined();
  });

  it("completes send, verify and registration using provider-issued proof", async () => {
    mocks.post.mockResolvedValueOnce({ data: { data: { access_token: "provider-token" } } })
      .mockResolvedValueOnce({ data: { data: { reference_id: identity.referenceId } } })
      .mockResolvedValueOnce({ data: { data: { access_token: "provider-token" } } })
      .mockResolvedValueOnce({ data: { data: { status: "VALID" } } });
    const sent = await request(app).post("/aadhaar/send-otp").send({
      purpose: "client_registration", email: identity.email, aadhaar_number: identity.aadhaar,
    });
    expect(sent.status).toBe(200);
    const verified = await request(app).post("/aadhaar/verify-otp").send({
      ...verification(), challenge_token: sent.body.challenge_token,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.verification_token).toEqual(expect.any(String));
    expect(mocks.query).not.toHaveBeenCalled();
    const registered = await request(app).post("/register").send({
      ...registration, aadhaarKycStatus: "fake-status-is-ignored", aadhaarVerificationToken: verified.body.verification_token,
    });
    expect(registered.status).toBe(201);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO client_profiles"), [
      "test-user", "Test", "Client", "9000000000", null, identity.aadhaar, "VERIFIED", identity.referenceId, expect.any(Date),
    ]);
  });

  it("does not issue client registration proof through the legacy RA flow", async () => {
    mocks.post.mockResolvedValueOnce({ data: { data: { access_token: "provider-token" } } })
      .mockResolvedValueOnce({ data: { data: { status: "VALID" } } });
    const response = await request(app).post("/aadhaar/verify-otp").send({
      aadhaar_number: identity.aadhaar, otp: "121212", reference_id: identity.referenceId,
    });
    expect(response.status).toBe(200);
    expect(response.body.verification_token).toBeUndefined();
  });
});
