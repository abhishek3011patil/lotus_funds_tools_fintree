import { beforeEach, describe, expect, it, vi } from "vitest";

const razorpayMocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  fetchPayment: vi.fn(),
}));

vi.mock("razorpay", () => ({
  default: class RazorpayMock {
    orders = { create: razorpayMocks.createOrder };
    payments = { fetch: razorpayMocks.fetchPayment };
  },
}));

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

vi.mock("../../src/services/subscriptionAccess.service", () => ({
  expireDueSubscriptions: vi.fn().mockResolvedValue(0),
}));

import { pool } from "../../src/db";
import {
  createSubscriptionRenewalOrder,
  verifySubscriptionRenewalPayment,
} from "../../src/controllers/subscriptionRenewal.controller";
import { getMySubscriptionAccess } from "../../src/controllers/subscriptionAccess.controller";

const connectMock = vi.mocked(pool.connect);
const queryMock = vi.mocked(pool.query);

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

describe("subscription renewal", () => {
  beforeEach(() => {
    connectMock.mockReset();
    queryMock.mockReset();
    razorpayMocks.createOrder.mockReset();
    razorpayMocks.fetchPayment.mockReset();
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "renewal-secret";
  });

  it("requires an authenticated user", async () => {
    const response = createResponse();

    await createSubscriptionRenewalOrder(
      { user: undefined } as any,
      response
    );

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("does not allow renewal before the renewal window", async () => {
    const db = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "subscription-1",
              status: "ACTIVE",
              expires_at: new Date(
                Date.now() + 90 * 86_400_000
              ).toISOString(),
              plan_id: "plan-1",
              audience_type: "RA",
              email: "ra@example.com",
              user_status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    connectMock.mockResolvedValue(db as any);
    const response = createResponse();

    await createSubscriptionRenewalOrder(
      {
        user: {
          id: "user-1",
          role: "RESEARCH_ANALYST",
        },
      } as any,
      response
    );

    expect(response.statusCode).toBe(409);
    expect(response.body.code).toBe(
      "RENEWAL_NOT_YET_AVAILABLE"
    );
    expect(razorpayMocks.createOrder).not.toHaveBeenCalled();
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("rejects a forged payment signature", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "order-1",
          user_id: "user-1",
          provider_order_id: "order_provider_1",
          amount_paise: 10000,
          currency: "INR",
          status: "CREATED",
        },
      ],
    } as any);
    const response = createResponse();

    await verifySubscriptionRenewalPayment(
      {
        user: {
          id: "user-1",
          role: "RESEARCH_ANALYST",
        },
        body: {
          localOrderId: "order-1",
          razorpayOrderId: "order_provider_1",
          razorpayPaymentId: "payment-1",
          razorpaySignature: "deadbeef",
        },
      } as any,
      response
    );

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Invalid Razorpay signature."
    );
    expect(razorpayMocks.fetchPayment).not.toHaveBeenCalled();
  });

  it("allows a cancelled subscription to renew immediately", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "subscription-1",
            status: "CANCELLED",
            starts_at: "2026-07-01T00:00:00.000Z",
            expires_at: "2027-07-01T00:00:00.000Z",
            cancelled_at: "2026-08-07T00:00:00.000Z",
            cancellation_reason: "Testing cancellation",
            plan_id: "plan-1",
            plan_code_snapshot: "RA_TIER_2",
            plan_name_snapshot: "RA Tier 2",
            tier_code_snapshot: "TIER_2",
            price_paise_snapshot: 200,
            duration_days_snapshot: 365,
            plan_version_snapshot: 1,
            audience_type: "RA",
            amount_paid_paise: 200,
            currency: "INR",
          },
        ],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    const response = createResponse();

    await getMySubscriptionAccess(
      {
        user: {
          id: "user-1",
          role: "RESEARCH_ANALYST",
        },
      } as any,
      response
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.subscription.status).toBe("CANCELLED");
    expect(response.body.subscription.canRenew).toBe(true);
    expect(response.body.nextStep).toBe("RENEW_SUBSCRIPTION");
  });
});
