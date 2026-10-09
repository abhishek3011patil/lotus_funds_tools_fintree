import { describe, expect, it, vi } from "vitest";
import {
  clearRecommendationDraft,
  getRecommendationDraftStorageKey,
  loadRecommendationDraft,
  saveRecommendationDraft,
} from "./recommendationDraft.utils";

describe("recommendation draft storage", () => {
  it("scopes drafts to the signed-in RA", () => {
    expect(getRecommendationDraftStorageKey("ra one")).not.toBe(
      getRecommendationDraftStorageKey("ra two")
    );
  });

  it("round-trips a valid draft", () => {
    let stored: string | null = null;
    const storage = {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    };

    saveRecommendationDraft(storage, "draft", {
      form: { entry: "123" },
      stockInput: "RELIANCE",
      isErrataMode: false,
      errataSourceId: null,
      audienceMode: "GROUPS",
      selectedAudienceGroupIds: ["group-1"],
    });

    expect(loadRecommendationDraft<{ entry: string }>(storage, "draft")).toMatchObject({
      version: 1,
      form: { entry: "123" },
      stockInput: "RELIANCE",
      audienceMode: "GROUPS",
      selectedAudienceGroupIds: ["group-1"],
    });
  });

  it("ignores malformed drafts and tolerates unavailable storage", () => {
    expect(
      loadRecommendationDraft({ getItem: () => "not-json" }, "draft")
    ).toBeNull();

    expect(() =>
      saveRecommendationDraft(
        { setItem: () => { throw new Error("blocked"); } },
        "draft",
        {
          form: {},
          stockInput: "",
          isErrataMode: false,
          errataSourceId: null,
          audienceMode: "ALL_CONNECTED",
          selectedAudienceGroupIds: [],
        }
      )
    ).not.toThrow();

    const removeItem = vi.fn();
    clearRecommendationDraft({ removeItem }, "draft");
    expect(removeItem).toHaveBeenCalledWith("draft");
  });
});
