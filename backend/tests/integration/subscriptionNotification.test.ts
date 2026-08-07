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

import { pool } from "../../src/db";
import { emailService } from "../../src/services/email";
import { processDueSubscriptionNotifications } from "../../src/controllers/subscriptionNotification.controller";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);
const emailMock = vi.mocked(emailService.send);

describe("subscription expiry notifications", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
    emailMock.mockClear();
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
});
