import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../../src/db";
import { distributeBrokerCallUpdate } from "../../src/services/brokerDelivery.service";

describe("broker follow-up delivery access", () => {
  beforeEach(() => vi.resetAllMocks());

  it("excludes brokers without an active platform subscription", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await distributeBrokerCallUpdate({
      researchCallId: "call-2",
      rootCallId: "call-1",
      eventType: "RESEARCH_CALL_ERRATA",
      message: "Correction",
    });

    expect(result.brokers).toBe(0);
    const sql = String(vi.mocked(pool.query).mock.calls[0][0]);
    expect(sql).toContain("platform_subscription.status = 'ACTIVE'");
    expect(sql).toContain("platform_plan.audience_type = 'BROKER'");
  });
});
