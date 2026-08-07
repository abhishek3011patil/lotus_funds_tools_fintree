import { describe, expect, it } from "vitest";
import {
  buildPersonalizedStudyOptions,
  getRecentStudies,
  getStudiesByValues,
} from "./UnderlyingStudy";

describe("underlying-study personalization helpers", () => {
  it("preserves server-provided order", () => {
    expect(
      getStudiesByValues(["macd", "rsi", "ema"]).map(
        (study) => study.value
      )
    ).toEqual(["macd", "rsi", "ema"]);
  });

  it("ignores unknown or stale values", () => {
    expect(
      getStudiesByValues(["unknown", "rsi"]).map(
        (study) => study.value
      )
    ).toEqual(["rsi"]);
  });

  it("keeps the compatibility helper ordered", () => {
    expect(
      getRecentStudies(["volume", "macd"]).map(
        (study) => study.value
      )
    ).toEqual(["volume", "macd"]);
  });

  it("limits personalized groups and removes cross-group duplicates", () => {
    const options = buildPersonalizedStudyOptions({
      frequentValues: [
        "rsi",
        "macd",
        "ema",
        "sma",
        "volume",
        "atr",
      ],
      recentValues: [
        "rsi",
        "atr",
        "obv",
        "cci",
        "dmi",
        "mfi",
        "psar",
      ],
    });

    const frequent = options.filter(
      (option) => option.group === "Frequently Used"
    );
    const recent = options.filter(
      (option) => option.group === "Recently Used"
    );

    expect(frequent).toHaveLength(5);
    expect(recent).toHaveLength(5);
    expect(recent.map((item) => item.value)).not.toContain(
      "rsi"
    );

    const rsiOccurrences = options.filter(
      (item) => item.value === "rsi"
    );
    expect(rsiOccurrences).toHaveLength(1);
  });
});
