import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  compare: vi.fn(),
  sign: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("../../src/db", () => ({ pool: { query: mocks.query } }));
vi.mock("bcrypt", () => ({ default: { compare: mocks.compare } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: mocks.sign } }));
vi.mock("../../src/utils/auditLogger", () => ({ createAuditLog: mocks.audit }));
vi.mock("../../src/config/mailer", () => ({ sendOtpMail: vi.fn(), sendApprovalMail: vi.fn() }));
vi.mock("../../src/services/email", () => ({ emailService: { send: vi.fn() } }));

import { login } from "../../src/controllers/auth.controller";

const request = () => ({
  body: { loginId: "company-user", password: "test-password", requestedRole: "ADMIN" },
  headers: {},
  socket: { remoteAddress: "127.0.0.1" },
}) as Request;

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

describe("shared company login portal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.compare.mockResolvedValue(true);
    mocks.sign.mockReturnValue("test-token");
  });

  it.each(["ADMIN", "SUPERADMIN", "EMPLOYEE"])(
    "logs in a %s account with its stored role",
    async (role) => {
      mocks.query.mockResolvedValueOnce({ rows: [{
        id: "company-1", username: "company-user", password_hash: "hash", role,
      }] });
      const res = response();
      await login(request(), res);

      expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("FROM company_users"), ["company-user"]);
      expect(mocks.compare).toHaveBeenCalledWith("test-password", "hash");
      expect(mocks.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role }), process.env.JWT_SECRET, { expiresIn: "30d" },
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, role, token: "test-token" }));
      expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ adminRole: role }));
    },
  );

  it("rejects non-company roles without issuing a token", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ role: "CLIENT" }] });
    const res = response();
    await login(request(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password without issuing a token", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ role: "SUPERADMIN", password_hash: "hash" }] });
    mocks.compare.mockResolvedValueOnce(false);
    const res = response();
    await login(request(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
});
