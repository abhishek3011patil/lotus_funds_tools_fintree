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
        mt: 1,
        p: 1.4,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: invalid ? "#FCA5A5" : ratio === null ? "#CBD5E1" : healthy ? "#86EFAC" : "#FCD34D",
        bgcolor: invalid ? "#FEF2F2" : ratio === null ? "#F8FAFC" : healthy ? "#F0FDF4" : "#FFFBEB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1.5,
        minHeight: 68,
        boxSizing: "border-box",
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#172033" }}>
          Live Risk : Reward
        </Typography>
        {perLot && (
          <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.4 }}>
            1 lot: Risk {formatRupees(perLot.risk)} · Reward {formatRupees(perLot.reward)}
          </Typography>
        )}
      </Box>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: ready ? "1rem" : "0.78rem",
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
