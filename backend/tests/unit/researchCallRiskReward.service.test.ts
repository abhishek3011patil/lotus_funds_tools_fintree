import { describe, expect, it } from "vitest";
import { calculateResearchCallRiskReward } from "../../src/services/researchCallRiskReward.service";

describe("calculateResearchCallRiskReward", () => {
  it("calculates BUY reward divided by risk", () => {
    expect(calculateResearchCallRiskReward({
      action: "BUY", entryPrice: 100, targetPrice: 120, stopLoss: 90,
    })).toBe(2);
  });

  it("calculates SELL reward divided by risk", () => {
    expect(calculateResearchCallRiskReward({
      action: "SELL", entryPrice: 100, targetPrice: 80, stopLoss: 110,
    })).toBe(2);
  });

  it("uses the conservative edge of an entry range", () => {
    expect(calculateResearchCallRiskReward({
      action: "BUY", entryPriceLow: 98, entryPriceUpper: 102,
      targetPrice: 120, stopLoss: 90,
    })).toBe(1.5);
    expect(calculateResearchCallRiskReward({
      action: "SELL", entryPriceLow: 98, entryPriceUpper: 102,
      targetPrice: 80, stopLoss: 110,
    })).toBe(1.5);
  });

  it("returns null for invalid price direction", () => {
    expect(calculateResearchCallRiskReward({
      action: "BUY", entryPrice: 100, targetPrice: 95, stopLoss: 90,
    })).toBeNull();
  });
});
