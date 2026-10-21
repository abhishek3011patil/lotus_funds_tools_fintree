import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({ pool: { query: vi.fn() } }));

import { pool } from "../../src/db";
import { canAccessUploadedFile } from "../../src/services/uploadAccess.service";

beforeEach(() => vi.resetAllMocks());

describe("upload access", () => {
  it("allows media returned by the broker call boundary", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ allowed: true }] } as never);

    await expect(canAccessUploadedFile({
      filename: "research-chart.png",
      userId: "broker-user",
      role: "BROKER",
    })).resolves.toBe(true);

    const [sql, values] = vi.mocked(pool.query).mock.calls[0] as [string, unknown[]];
    expect(values).toEqual(["research-chart.png", "broker-user", "BROKER"]);
    expect(sql).toContain("broker.user_id = $2");
    expect(sql).toContain("link.status = 'ACTIVE'");
    expect(sql).toContain("broker_user.is_active = true");
    expect(sql).toContain("rc.status IN ('PUBLISHED', 'CLOSED')");
    expect(sql).toContain("rc.is_latest IS TRUE");
    expect(sql).toContain("jsonb_array_elements");
  });

  it("denies files outside the signed-in user's permitted records", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ allowed: false }] } as never);

    await expect(canAccessUploadedFile({
      filename: "private.pdf",
      userId: "unrelated-user",
      role: "BROKER",
    })).resolves.toBe(false);
  });

  it("checks subscription, audience, and published call before allowing client media", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ allowed: true }] } as never);

    await expect(canAccessUploadedFile({
      filename: "client-chart.png",
      userId: "client-user",
      role: "CLIENT",
    })).resolves.toBe(true);

    const [sql, values] = vi.mocked(pool.query).mock.calls[0] as [string, unknown[]];
    expect(values).toEqual(["client-chart.png", "client-user", "CLIENT"]);
    expect(sql).toContain("rc.status IN ('PUBLISHED', 'CLOSED')");
    expect(sql).toContain("COALESCE(rc.is_latest, true) = true");
    expect(sql).toContain("rc.audience_recipient_snapshot @> jsonb_build_array");
    expect(sql).toContain("subscription.client_user_id = $2");
    expect(sql).toContain("subscription.expires_at > NOW()");
    expect(sql).toContain("subscription.ra_user_id = rc.ra_user_id");
    expect(sql).toContain("ra.user_id = rc.ra_user_id");
    expect(sql).toContain("broker_platform_subscription.status = 'ACTIVE'");
    expect(sql).toContain("link.status = 'ACTIVE'");
  });
});
