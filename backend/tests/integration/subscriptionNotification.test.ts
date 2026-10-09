import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

vi.mock("../../src/services/email", () => ({
  emailService: {
    send: vi.fn().mockResolvedValue({
      sent: true,
      skipped: false,
    }),
  },
}));

vi.mock("../../src/utils/auditLogger", () => ({
  createAuditLog: vi.fn(),
}));

import { pool } from "../../src/db";
import { emailService } from "../../src/services/email";
import {
  processDueSubscriptionNotifications,
  runSubscriptionNotificationPass,
} from "../../src/controllers/subscriptionNotification.controller";
import { createAuditLog } from "../../src/utils/auditLogger";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);
const emailMock = vi.mocked(emailService.send);
const auditMock = vi.mocked(createAuditLog);

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as any;
};

describe("subscription expiry notifications", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
    emailMock.mockClear();
    auditMock.mockReset();
  });

  it("sends and records the nearest expiry reminder once", async () => {
    const expiresAt = new Date(
      Date.now() + 6 * 86_400_000
    ).toISOString();
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "subscription-1",
            expires_at: expiresAt,
            name: "Test RA",
            email: "ra@example.test",
          },
        ],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: "notification-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    connectMock.mockResolvedValue(db as any);

    const result =
      await processDueSubscriptionNotifications();

    expect(result.remindersAttempted).toBe(1);
    expect(emailMock).toHaveBeenCalledWith(
      "SUBSCRIPTION_EXPIRY_REMINDER",
      "ra@example.test",
      expect.objectContaining({ name: "Test RA" })
    );
    expect(
      db.query.mock.calls.some((call) =>
        Array.isArray(call[1]) &&
        call[1].includes(
          "SUBSCRIPTION_EXPIRY_REMINDER_7_DAY"
        )
      )
    ).toBe(true);
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("audits a manually triggered notification pass", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    const res = response();

    await runSubscriptionNotificationPass(
      {
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

    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        action: "SUBSCRIPTION_NOTIFICATION_PASS_RUN",
        status: "SUCCESS",
        newValue: {
          remindersAttempted: 0,
          expiryNotificationsAttempted: 0,
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("audits a failed manually triggered notification pass", async () => {
    queryMock.mockRejectedValueOnce(new Error("database unavailable"));
    const res = response();

    await runSubscriptionNotificationPass(
      {
        user: {
          id: "admin-1",
          name: "Admin User",
          role: "ADMIN",
        },
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res
    );

    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "SUBSCRIPTION_NOTIFICATION_PASS_RUN",
        status: "FAILED",
        reason: "database unavailable",
      })
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
