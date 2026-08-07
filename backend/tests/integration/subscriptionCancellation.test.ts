import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}));

vi.mock("../../src/services/subscriptionAccess.service", () => ({
  expireDueSubscriptions: vi.fn().mockResolvedValue(0),
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
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { pool } from "../../src/db";
import { emailService } from "../../src/services/email";
import { cancelMySubscription } from "../../src/controllers/subscriptionCancellation.controller";

const connectMock = vi.mocked(pool.connect);
const emailMock = vi.mocked(emailService.send);

const createResponse = () => {
  const response: any = {
    statusCode: 200,
    body: null,
  };
  response.status = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json = vi.fn((body: unknown) => {
    response.body = body;
    return response;
  });
  return response;
};

const activeSubscription = {
  id: "subscription-1",
  status: "ACTIVE",
  plan_name_snapshot: "RA Tier 2",
  expires_at: "2026-09-01T00:00:00.000Z",
  cancelled_at: null,
  cancellation_reason: null,
  name: "Test RA",
  email: "ra@example.test",
  user_status: "active",
  ra_status: "approved",
};

const request = (body: Record<string, unknown> = {}) =>
  ({
    user: {
      id: "user-1",
      role: "RESEARCH_ANALYST",
      name: "Test RA",
    },
    body: {
      confirmation: "CANCEL",
      reason: "Testing subscription cancellation",
      ...body,
    },
    headers: {},
    socket: {},
  }) as any;

describe("subscription cancellation", () => {
  beforeEach(() => {
    connectMock.mockReset();
    emailMock.mockClear();
  });

  it("requires authentication", async () => {
    const response = createResponse();

    await cancelMySubscription(
      { user: undefined, body: {} } as any,
      response
    );

    expect(response.statusCode).toBe(401);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("requires explicit CANCEL confirmation", async () => {
    const response = createResponse();

    await cancelMySubscription(
      request({ confirmation: "YES" }),
      response
    );

    expect(response.statusCode).toBe(400);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("cancels an active subscription without changing the account", async () => {
    const cancelledAt = "2026-08-07T12:00:00.000Z";
    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [activeSubscription] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "subscription-1",
              status: "CANCELLED",
              cancelled_at: cancelledAt,
              cancellation_reason:
                "Testing subscription cancellation",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    connectMock.mockResolvedValue(db as any);
    const response = createResponse();

    await cancelMySubscription(request(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body.subscription.status).toBe("CANCELLED");
    expect(response.body.emailSent).toBe(true);
    expect(emailMock).toHaveBeenCalledWith(
      "SUBSCRIPTION_CANCELLED",
      "ra@example.test",
      expect.objectContaining({
        planName: "RA Tier 2",
      })
    );
    expect(db.release).toHaveBeenCalledOnce();

    const updateQuery = db.query.mock.calls[3][0] as string;
    expect(updateQuery).toContain("status = 'CANCELLED'");
    expect(updateQuery).not.toContain("UPDATE users");
    expect(updateQuery).not.toContain("UPDATE ra_details");
  });

  it("blocks cancellation while a renewal payment is open", async () => {
    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [activeSubscription] })
        .mockResolvedValueOnce({ rows: [{ id: "order-1" }] })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    connectMock.mockResolvedValue(db as any);
    const response = createResponse();

    await cancelMySubscription(request(), response);

    expect(response.statusCode).toBe(409);
    expect(response.body.code).toBe(
      "RENEWAL_PAYMENT_IN_PROGRESS"
    );
    expect(emailMock).not.toHaveBeenCalled();
  });

  it("treats repeated cancellation as idempotent", async () => {
    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...activeSubscription,
              status: "CANCELLED",
              cancelled_at: "2026-08-07T12:00:00.000Z",
              cancellation_reason: "Already cancelled",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    connectMock.mockResolvedValue(db as any);
    const response = createResponse();

    await cancelMySubscription(request(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Subscription is already cancelled."
    );
    expect(emailMock).not.toHaveBeenCalled();
  });
});
