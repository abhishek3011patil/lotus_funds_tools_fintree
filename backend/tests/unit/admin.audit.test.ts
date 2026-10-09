import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("../../src/db", () => ({
  pool: {
    query: mocks.query,
    connect: vi.fn(),
  },
}));

vi.mock("../../src/utils/auditLogger", () => ({
  createAuditLog: mocks.audit,
}));

vi.mock("../../src/config/mailer", () => ({
  sendApprovalMail: vi.fn(),
}));

vi.mock("../../src/services/email", () => ({
  emailService: { send: vi.fn() },
}));

import { getDisclaimerHistoryByRA } from "../../src/controllers/admin.controller";

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

describe("admin audit coverage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("audits access to an RA's disclaimer history without copying its text", async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [
        {
          id: "history-1",
          email: "ra@example.test",
          disclaimer_text: "Sensitive disclaimer text",
        },
      ],
    });
    const res = response();

    await getDisclaimerHistoryByRA(
      {
        params: { userId: "ra-1" },
        user: {
          id: "admin-1",
          name: "Admin User",
          role: "ADMIN",
        },
        headers: { "user-agent": "vitest" },
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res
    );

    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        action: "VIEW_DISCLAIMER_HISTORY",
        targetEntity: "ra@example.test",
        newValue: { raUserId: "ra-1", versionCount: 1 },
      })
    );
    expect(mocks.audit.mock.calls[0][0]).not.toEqual(
      expect.objectContaining({ disclaimer_text: expect.anything() })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
