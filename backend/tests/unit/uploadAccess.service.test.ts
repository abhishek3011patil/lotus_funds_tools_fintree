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
});
