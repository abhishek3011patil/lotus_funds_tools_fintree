export type RiskRewardInput = {
  action: "BUY" | "SELL";
  entry: string;
  entryLow: string;
  entryUpper: string;
  target: string;
  stopLoss: string;
  rangeEnabled: boolean;
};

const positiveNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const calculateCallRiskReward = (input: RiskRewardInput): number | null => {
  const target = positiveNumber(input.target);
  const stopLoss = positiveNumber(input.stopLoss);
  const exactEntry = positiveNumber(input.entry);
  const low = positiveNumber(input.entryLow);
  const upper = positiveNumber(input.entryUpper);
  const entry = input.rangeEnabled
    ? input.action === "BUY" ? upper ?? low : low ?? upper
    : exactEntry;

  if (!entry || !target || !stopLoss) return null;
  const risk = input.action === "BUY" ? entry - stopLoss : stopLoss - entry;
  const reward = input.action === "BUY" ? target - entry : entry - target;
  if (risk <= 0 || reward <= 0) return null;
  return Number((reward / risk).toFixed(4));
};

export const formatRiskReward = (ratio: number | null): string =>
  ratio === null ? "—" : `1 : ${ratio.toFixed(2)}`;
