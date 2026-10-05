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

  it("recalculates when the analyst tunes entry, target, or stop loss", () => {
    const prices = {
      action: "BUY" as const,
      entry: "100",
      entryLow: "",
      entryUpper: "",
      target: "120",
      stopLoss: "90",
      rangeEnabled: false,
    };

    expect(formatRiskReward(calculateCallRiskReward(prices))).toBe("1 : 2.00");
    expect(formatRiskReward(calculateCallRiskReward({ ...prices, target: "130" }))).toBe("1 : 3.00");
    expect(formatRiskReward(calculateCallRiskReward({ ...prices, stopLoss: "95" }))).toBe("1 : 4.00");
    expect(formatRiskReward(calculateCallRiskReward({ ...prices, entry: "105" }))).toBe("1 : 1.00");
    expect(formatRiskReward(calculateCallRiskReward({
      ...prices,
      rangeEnabled: true,
      entryLow: "98",
      entryUpper: "102",
    }))).toBe("1 : 1.50");
  });
});
