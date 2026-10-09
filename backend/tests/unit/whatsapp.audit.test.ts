import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("../../src/db", () => ({
  pool: { query: mocks.query },
}));

vi.mock("../../src/utils/auditLogger", () => ({
  createAuditLog: mocks.audit,
}));

import { getWhatsAppParticipantsByRA } from "../../src/controllers/whatsapp.controller";

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

describe("WhatsApp audit actor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("preserves the admin identity when participant access is logged", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ id: "participant-1" }] });
    const res = response();

    await getWhatsAppParticipantsByRA(
      {
        params: { raId: "ra-1" },
        user: {
          id: "admin-1",
          name: "Admin User",
          role: "ADMIN",
        },
        headers: { "user-agent": "vitest" },
      } as any,
      res
    );

    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        adminName: "Admin User",
        adminRole: "ADMIN",
        action: "VIEW_PARTICIPANTS",
        module: "WHATSAPP",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
