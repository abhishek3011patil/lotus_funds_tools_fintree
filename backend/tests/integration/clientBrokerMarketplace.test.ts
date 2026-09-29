import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({ pool: { query: vi.fn(), connect: vi.fn() } }));

import { pool } from "../../src/db";
import {
  cancelBrokerSubscription,
  listClientBrokers,
} from "../../src/controllers/clientAnalystSubscriptions/clientBrokerSubscription.controller";
import { checkClientSubscription } from "../../src/middlewares/clientSubscription.middleware";
import {
  getClientAnalystProfile,
  getClientBrokerProfile,
} from "../../src/controllers/clientAnalystSubscriptions/clientMarketplaceProfile.controller";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { id: "client-one", role: "CLIENT", name: "Client" };
  next();
});
app.get("/brokers", listClientBrokers);
app.patch("/brokers/:brokerId/cancel", cancelBrokerSubscription);
app.get("/brokers/:brokerId/profile", getClientBrokerProfile);
app.get("/analysts/:raUserId/profile", getClientAnalystProfile);
app.get("/recommendations", checkClientSubscription, (req, res) =>
  res.json({ allowedRAIds: (req as any).allowedRAIds })
);

beforeEach(() => vi.resetAllMocks());

describe("client broker marketplace", () => {
  it("lists approved active brokers with subscription and research totals", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{
        id: "broker-one", legal_name: "Broker Legal", trade_name: "Broker Market",
        analyst_count: 2, recommendation_count: 8, live_call_count: 3,
        is_subscribed: true, exchanges: "NSE, BSE", segments: "Cash",
      }], rowCount: 1 } as any);

    const response = await request(app).get("/brokers").expect(200);
    expect(response.body.brokers[0]).toMatchObject({
      id: "broker-one", name: "Broker Market", analystCount: 2,
      recommendationCount: 8, liveCallCount: 3, isSubscribed: true,
    });
    expect(String(vi.mocked(pool.query).mock.calls[2][0])).toContain("broker_research_analysts");
  });

  it("cancels only the signed-in client's active broker subscription", async () => {
    const brokerId = "00000000-0000-4000-8000-000000000002";
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: "subscription" }], rowCount: 1 } as any);
    await request(app).patch(`/brokers/${brokerId}/cancel`).expect(200);
    const [sql, values] = vi.mocked(pool.query).mock.calls[0] as any;
    expect(values).toEqual(["client-one", brokerId]);
    expect(sql).toContain("client_user_id = $1 AND broker_id = $2");
  });

  it("combines direct RA and broker RA entitlements for the recommendations feed", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ ra_user_id: "ra-direct" }, { ra_user_id: "ra-via-broker" }] } as any);

    const response = await request(app).get("/recommendations").expect(200);
    expect(response.body.allowedRAIds).toEqual(["ra-direct", "ra-via-broker"]);
    const entitlementSql = String(vi.mocked(pool.query).mock.calls[2][0]);
    expect(entitlementSql).toContain("client_broker_subscriptions");
    expect(entitlementSql).toContain("broker_research_analysts");
  });

  it("returns an analyst's marketplace details with RA performance metrics", async () => {
    const raId = "00000000-0000-4000-8000-000000000003";
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: raId, name: "Research One", sebi_reg_no: "INH001", nism_reg_no: "NISM-RA-001" }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{
        id: "call-one", action: "BUY", entry_price: 100, target_price: 110,
        stop_loss: 95, exit_price: 112, created_at: new Date().toISOString(),
        closed_at: new Date().toISOString(), status: "CLOSED",
      }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [{ count: "0" }], rowCount: 1 } as any);

    const response = await request(app).get(`/analysts/${raId}/profile`).expect(200);
    expect(response.body.profile).toMatchObject({ type: "analyst", name: "Research One", nismCertificateNumber: "NISM-RA-001" });
    expect(response.body.performance).toMatchObject({ total: 1, accuracy: 100, strike: 100 });
  });

  it("aggregates broker performance from its active approved analysts", async () => {
    const brokerId = "00000000-0000-4000-8000-000000000004";
    const raId = "00000000-0000-4000-8000-000000000005";
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{
        id: brokerId, legal_name: "Broker Legal", trade_name: "Broker Market",
        ra_user_ids: [raId], analysts: [{ id: raId, name: "Research One" }],
      }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [{ count: "2" }], rowCount: 1 } as any);

    const response = await request(app).get(`/brokers/${brokerId}/profile?period=yearly`).expect(200);
    expect(response.body.profile).toMatchObject({ type: "broker", name: "Broker Market" });
    expect(response.body.profile.analysts).toHaveLength(1);
    expect(response.body.performance.active).toBe(2);
    expect(response.body.performancePeriod).toBe("yearly");
    expect(String(vi.mocked(pool.query).mock.calls[1][0])).toContain("ANY($1::uuid[])");
    expect((vi.mocked(pool.query).mock.calls[1][1] as any[])[1]).toBe(`${new Date().getUTCFullYear()}-01-01`);
  });
});
