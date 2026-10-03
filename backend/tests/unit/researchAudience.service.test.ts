import { describe, expect, it, vi } from "vitest";
import { parseAudienceSelection, resolveResearchAudience } from "../../src/services/researchAudience.service";

const groupA = "00000000-0000-4000-8000-000000000001";
const clientA = "00000000-0000-4000-8000-000000000002";
const brokerA = "00000000-0000-4000-8000-000000000003";

describe("research audience", () => {
  it("defaults to every connected recipient", () => {
    expect(parseAudienceSelection({})).toEqual({ mode: "ALL_CONNECTED", groupIds: [] });
  });

  it("normalizes and deduplicates selected groups", () => {
    expect(parseAudienceSelection({ audience_mode: "groups", audience_group_ids: JSON.stringify([groupA, groupA, "bad"]) }))
      .toEqual({ mode: "GROUPS", groupIds: [groupA] });
  });

  it("resolves a mixed group into immutable client and broker recipients", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: groupA, name: "Priority" }] })
      .mockResolvedValueOnce({ rows: [{ id: clientA, name: "Client One" }] })
      .mockResolvedValueOnce({ rows: [{ id: brokerA, name: "Broker One" }] });
    const result = await resolveResearchAudience({
      raUserId: "ra-user",
      mode: "GROUPS",
      groupIds: [groupA],
      db: { query } as never,
    });
    expect(result.selectedGroups).toEqual([{ id: groupA, name: "Priority" }]);
    expect(result.recipients).toEqual([
      { type: "CLIENT", id: clientA, name: "Client One" },
      { type: "BROKER", id: brokerA, name: "Broker One" },
    ]);
  });

  it("rejects missing or empty selected groups", async () => {
    await expect(resolveResearchAudience({ raUserId: "ra-user", mode: "GROUPS", groupIds: [], db: { query: vi.fn() } as never }))
      .rejects.toThrow("Select at least one audience group");
  });
});
