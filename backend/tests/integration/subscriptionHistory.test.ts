import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../../src/db";
import { getMySubscriptionHistory } from "../../src/controllers/subscriptionHistory.controller";

const queryMock = vi.mocked(pool.query);

const createResponse = () => {
  const response: any = { statusCode: 200, body: null };
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

describe("subscription history", () => {
  beforeEach(() => queryMock.mockReset());

  it("requires authentication", async () => {
    const response = createResponse();
    await getMySubscriptionHistory(
      { user: undefined } as any,
      response
    );
    expect(response.statusCode).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns safe payment and lifecycle history", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            provider: "RAZORPAY",
            provider_order_id: "order_provider_1",
            provider_payment_id: "pay_1",
            status: "PAID",
            transaction_status: "CAPTURED",
            amount_paise: 200,
            currency: "INR",
            purpose: "SUBSCRIPTION_RENEWAL",
            plan_name: "RA Tier 2",
            paid_at: "2026-08-07T00:00:00.000Z",
            transaction_created_at: null,
            created_at: "2026-08-07T00:00:00.000Z",
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: "event-1",
            subscription_id: "subscription-1",
            event_type: "SUBSCRIPTION_RENEWED",
            previous_status: "EXPIRED",
            new_status: "ACTIVE",
            reason: "Renewed",
            metadata: {},
            created_at: "2026-08-07T00:00:00.000Z",
          },
        ],
      } as any);
    const response = createResponse();

    await getMySubscriptionHistory(
      { user: { id: "user-1", role: "RA" } } as any,
      response
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.payments[0]).toEqual(
      expect.objectContaining({
        providerPaymentId: "pay_1",
        amount: 2,
        status: "CAPTURED",
      })
    );
    expect(response.body.events[0].type).toBe(
      "SUBSCRIPTION_RENEWED"
    );
  });
});
