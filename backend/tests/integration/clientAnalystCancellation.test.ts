import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../../src/db";
import { cancelAnalystSubscription } from "../../src/controllers/clientAnalystSubscriptions/clientAnalystSubscription.controller";

const queryMock = vi.mocked(pool.query);
const clientId = "11111111-1111-4111-8111-111111111111";
const raId = "22222222-2222-4222-8222-222222222222";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.patch("/analysts/:raUserId/cancel", (req, _res, next) => {
    (req as any).user = { id: clientId, role: "CLIENT" };
    next();
  }, cancelAnalystSubscription);
  return app;
};

describe("client analyst subscription cancellation", () => {
  beforeEach(() => queryMock.mockReset());

  it("cancels only the current client's active analyst subscription", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: "subscription-1", status: "CANCELLED" }],
    } as any);

    const response = await request(createApp()).patch(
      `/analysts/${raId}/cancel`
    );

    expect(response.status).toBe(200);
    expect(response.body.subscription.status).toBe("CANCELLED");
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("status = 'CANCELLED'"),
      [clientId, raId]
    );
  });

  it("does not cancel a missing, expired, or already-cancelled subscription", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as any);

    const response = await request(createApp()).patch(
      `/analysts/${raId}/cancel`
    );

    expect(response.status).toBe(409);
  });

  it("rejects an invalid analyst ID before querying", async () => {
    const response = await request(createApp()).patch(
      "/analysts/not-a-uuid/cancel"
    );

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
