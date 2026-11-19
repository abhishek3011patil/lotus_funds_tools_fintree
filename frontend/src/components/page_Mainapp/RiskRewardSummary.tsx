import { Box, Typography } from "@mui/material";
import { formatRiskReward } from "../../utils/riskReward.utils";

type RiskRewardSummaryProps = {
  ratio: number | null;
  ready: boolean;
  perLot: { risk: number; reward: number } | null;
};

const formatRupees = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const RiskRewardSummary = ({ ratio, ready, perLot }: RiskRewardSummaryProps) => {
  const healthy = ratio !== null && ratio >= 1.5;
  const invalid = ready && ratio === null;
  const value = !ready
    ? "Enter prices"
    : invalid
      ? "Check values"
      : formatRiskReward(ratio);

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        mt: 0.5,
        p: 1,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: invalid ? "#FCA5A5" : ratio === null ? "#CBD5E1" : healthy ? "#86EFAC" : "#FCD34D",
        bgcolor: invalid ? "#FEF2F2" : ratio === null ? "#F8FAFC" : healthy ? "#F0FDF4" : "#FFFBEB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        minHeight: 54,
        boxSizing: "border-box",
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 750, fontSize: "0.73rem", color: "#172033", lineHeight: 1.25 }}>
          Live Risk : Reward
        </Typography>
        {perLot && (
          <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.25, fontSize: "0.68rem", lineHeight: 1.25 }}>
            1 lot: Risk {formatRupees(perLot.risk)} · Reward {formatRupees(perLot.reward)}
          </Typography>
        )}
      </Box>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: ready ? "0.9rem" : "0.72rem",
          color: invalid ? "#B91C1C" : ratio === null ? "#64748B" : healthy ? "#15803D" : "#B45309",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default RiskRewardSummary;
