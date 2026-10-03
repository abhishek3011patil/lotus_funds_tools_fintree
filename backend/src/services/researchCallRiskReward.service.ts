export type RiskRewardInput = {
  action: unknown;
  entryPrice?: unknown;
  entryPriceLow?: unknown;
  entryPriceUpper?: unknown;
  targetPrice: unknown;
  stopLoss: unknown;
};

const positiveNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const calculateResearchCallRiskReward = ({
  action,
  entryPrice,
  entryPriceLow,
  entryPriceUpper,
  targetPrice,
  stopLoss,
}: RiskRewardInput): number | null => {
  const normalizedAction = String(action || "").trim().toUpperCase();
  const target = positiveNumber(targetPrice);
  const stop = positiveNumber(stopLoss);
  const exactEntry = positiveNumber(entryPrice);
  const low = positiveNumber(entryPriceLow);
  const upper = positiveNumber(entryPriceUpper);

  if (!target || !stop || !["BUY", "SELL"].includes(normalizedAction)) {
    return null;
  }

  // For ranges, use the conservative edge: upper for BUY and lower for SELL.
  const entry = exactEntry ?? (normalizedAction === "BUY" ? upper ?? low : low ?? upper);
  if (!entry) return null;

  const risk = normalizedAction === "BUY" ? entry - stop : stop - entry;
  const reward = normalizedAction === "BUY" ? target - entry : entry - target;

  if (risk <= 0 || reward <= 0) return null;
  return Number((reward / risk).toFixed(4));
};
