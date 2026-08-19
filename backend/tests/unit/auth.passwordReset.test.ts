import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("../../src/db", () => ({
  pool: {
    query: mocks.query,
  },
}));

vi.mock("../../src/services/email", () => ({
  emailService: {
    send: mocks.sendEmail,
  },
}));

import { requestPasswordReset } from "../../src/controllers/auth.controller";

const makeResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = "https://example.test";
    delete process.env.PASSWORD_RESET_TOKEN_TTL_HOURS;
  });

  it("returns a neutral response when no active RA account exists", async () => {
    mocks.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const response = makeResponse();

    await requestPasswordReset(
      {
        body: { email: "unknown@example.test" },
      } as Request,
      response
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: expect.stringContaining("If an active Research Analyst account exists"),
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("stores a short-lived token and emails the reset link", async () => {
    mocks.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: "ra-1",
            name: "Test Analyst",
            email: "analyst@example.test",
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });
    mocks.sendEmail.mockResolvedValueOnce({
      sent: true,
      skipped: false,
    });
    const response = makeResponse();

    await requestPasswordReset(
      {
        body: { email: " Analyst@Example.Test " },
      } as Request,
      response
    );

    expect(mocks.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("role = $2"),
      ["analyst@example.test", "RESEARCH_ANALYST"]
    );
    expect(mocks.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SET reset_token = $1"),
      [expect.stringMatching(/^[a-f0-9]{64}$/), expect.any(Date), "ra-1"]
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      "PASSWORD_RESET_LINK",
      "analyst@example.test",
      expect.objectContaining({
        name: "Test Analyst",
        passwordResetUrl: expect.stringMatching(
          /^https:\/\/example\.test\/reset-password\?token=[a-f0-9]{64}$/
        ),
        expiresInHours: 1,
      })
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("requests a reset for an active Client account", async () => {
    mocks.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: "client-1",
            name: "Test Client",
            email: "client@example.test",
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });
    mocks.sendEmail.mockResolvedValueOnce({
      sent: true,
      skipped: false,
    });
    const response = makeResponse();

    await requestPasswordReset(
      {
        body: {
          email: "client@example.test",
          requestedRole: "CLIENT",
        },
      } as Request,
      response
    );

    expect(mocks.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("role = $2"),
      ["client@example.test", "CLIENT"]
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      "PASSWORD_RESET_LINK",
      "client@example.test",
      expect.objectContaining({ name: "Test Client" })
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: expect.stringContaining("active Client account"),
    });
  });
});
