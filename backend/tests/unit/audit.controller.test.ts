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

import {
  exportAuditLogs,
  getAuditLogs,
} from "../../src/controllers/audit.controller";

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

const request = (query: Record<string, string> = {}) =>
  ({
    query,
    user: {
      id: "admin-1",
      name: "Admin User",
      role: "SUPERADMIN",
    },
    headers: { "user-agent": "vitest" },
    socket: { remoteAddress: "127.0.0.1" },
  }) as any;

describe("audit log export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("supports both Super Admin role spellings and audits the export", async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [{ log_id: "log-1" }],
      rowCount: 1,
    });
    const res = response();

    await exportAuditLogs(request({ user: "superadmin" }), res);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "admin_role IN ('SUPERADMIN', 'SUPER_ADMIN')"
      ),
      []
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        action: "EXPORT_AUDIT_LOGS",
        module: "AUDIT",
        status: "SUCCESS",
        newValue: expect.objectContaining({ exportedCount: 1 }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("supports both Super Admin role spellings in the on-screen log list", async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [{ log_id: "log-1", total_count: "1" }],
      rowCount: 1,
    });
    const res = response();

    await getAuditLogs(request({ user: "superadmin" }), res);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "admin_role IN ('SUPERADMIN', 'SUPER_ADMIN')"
      ),
      [10, 0]
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("records a failed export", async () => {
    mocks.query.mockRejectedValueOnce(new Error("database unavailable"));
    const res = response();

    await exportAuditLogs(request(), res);

    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXPORT_AUDIT_LOGS",
        status: "FAILED",
        reason: "database unavailable",
      })
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
