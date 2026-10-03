import { describe, expect, it } from "vitest";
import { calculateCallRiskReward, formatRiskReward } from "./riskReward.utils";

describe("call risk/reward", () => {
  it("calculates and formats a BUY call", () => {
    const ratio = calculateCallRiskReward({
      action: "BUY", entry: "1400", entryLow: "", entryUpper: "",
      target: "1480", stopLoss: "1360", rangeEnabled: false,
    });
    expect(ratio).toBe(2);
    expect(formatRiskReward(ratio)).toBe("1 : 2.00");
  });

  it("returns no ratio until the price direction is valid", () => {
    expect(calculateCallRiskReward({
      action: "SELL", entry: "100", entryLow: "", entryUpper: "",
      target: "120", stopLoss: "110", rangeEnabled: false,
    })).toBeNull();
  });
});
