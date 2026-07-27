import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

vi.mock("../../src/services/subscriptionAccess.service", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/subscriptionAccess.service")
  >("../../src/services/subscriptionAccess.service");

  return {
    ...actual,
    expireDueSubscriptions: vi.fn().mockResolvedValue(0),
  };
});

import { pool } from "../../src/db";
import {
  requireActiveSubscription,
  requireSubscriptionFeature,
  reserveSubscriptionEventLimit,
} from "../../src/middlewares/subscriptionAccess.middleware";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);

const createApp = ({
  authenticated = true,
  role = "RA",
}: {
  authenticated?: boolean;
  role?: string;
} = {}) => {
  const app = express();

  app.post(
    "/protected",
    (req, _res, next) => {
      if (authenticated) {
        (req as any).user = {
          id: "user-1",
          role,
        };
      }
      next();
    },
    requireActiveSubscription,
    requireSubscriptionFeature("RA_RESEARCH_CALLS"),
    (_req, res) => {
      res.status(201).json({ success: true });
    }
  );

  return app;
};

const activeSubscription = {
  id: "subscription-1",
  user_id: "user-1",
  plan_id: "plan-1",
  status: "ACTIVE",
  starts_at: "2026-07-01T00:00:00.000Z",
  expires_at: "2026-08-01T00:00:00.000Z",
  plan_code_snapshot: "RA_TEST",
  plan_name_snapshot: "RA Test Plan",
  tier_code_snapshot: "TEST",
  audience_type: "RA",
};

const createLimitApp = () => {
  const app = express();

  app.post(
    "/limited",
    (req, _res, next) => {
      (req as any).subscription = {
        id: "subscription-1",
        userId: "user-1",
        planId: "plan-1",
        status: "ACTIVE",
        audienceType: "RA",
        planCode: "RA_TEST",
        planName: "RA Test Plan",
        tierCode: "TEST",
        startsAt: "2026-07-01T00:00:00.000Z",
        expiresAt: "2026-08-01T00:00:00.000Z",
        featureValues: {},
      };
      next();
    },
    reserveSubscriptionEventLimit({
      limitKey: "RA_RESEARCH_CALLS_PER_MONTH",
    }),
    (_req, res) => {
      res.status(201).json({ success: true });
    }
  );

  return app;
};

describe("subscription access middleware", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(
      createApp({ authenticated: false })
    ).post("/protected");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects a role that cannot own a subscription", async () => {
    const response = await request(
      createApp({ role: "ADMIN" })
    ).post("/protected");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "SUBSCRIPTION_ROLE_NOT_SUPPORTED"
    );
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects a user without an active subscription", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const response = await request(createApp()).post("/protected");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "ACTIVE_SUBSCRIPTION_REQUIRED"
    );
    expect(response.body.nextStep).toBe("PURCHASE_SUBSCRIPTION");
  });

  it("returns the renewal response for an expired subscription", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            status: "EXPIRED",
            starts_at: "2026-06-01T00:00:00.000Z",
            expires_at: "2026-07-01T00:00:00.000Z",
            plan_name_snapshot: "Expired Plan",
            tier_code_snapshot: "BASIC",
          },
        ],
      } as any);

    const response = await request(createApp()).post("/protected");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Your subscription has expired."
    );
    expect(response.body.nextStep).toBe("RENEW_SUBSCRIPTION");
  });

  it("rejects a plan that does not include research calls", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [activeSubscription] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const response = await request(createApp()).post("/protected");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "SUBSCRIPTION_FEATURE_NOT_INCLUDED"
    );
    expect(response.body.featureKey).toBe("RA_RESEARCH_CALLS");
  });

  it("allows an active RA plan with research-call access", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [activeSubscription] } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            feature_key: "RA_RESEARCH_CALLS",
            value_type: "BOOLEAN",
            is_enabled: true,
            numeric_value: null,
            text_value: null,
          },
        ],
      } as any);

    const response = await request(createApp()).post("/protected");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
  });

  it("allows an unlimited research-call plan", async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "subscription-1",
            starts_at: "2026-07-01T00:00:00.000Z",
            expires_at: "2026-08-01T00:00:00.000Z",
            display_name: "Monthly research calls",
            limit_value: null,
            is_unlimited: true,
            enforcement_mode: "EVENT_COUNT",
            reset_period: "MONTH",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    connectMock.mockResolvedValue({
      query: clientQuery,
      release: vi.fn(),
    } as any);

    const response = await request(createLimitApp()).post("/limited");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
  });

  it("rejects a request after the monthly limit is reached", async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "subscription-1",
            starts_at: "2026-07-01T00:00:00.000Z",
            expires_at: "2026-08-01T00:00:00.000Z",
            display_name: "Monthly research calls",
            limit_value: 25,
            is_unlimited: false,
            enforcement_mode: "EVENT_COUNT",
            reset_period: "MONTH",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ used: "25" }] })
      .mockResolvedValueOnce({ rows: [] });

    connectMock.mockResolvedValue({
      query: clientQuery,
      release: vi.fn(),
    } as any);

    const response = await request(createLimitApp()).post("/limited");

    expect(response.status).toBe(429);
    expect(response.body.code).toBe("SUBSCRIPTION_LIMIT_REACHED");
    expect(response.body.limit).toMatchObject({
      maximum: 25,
      used: 25,
      remaining: 0,
    });
  });
});
