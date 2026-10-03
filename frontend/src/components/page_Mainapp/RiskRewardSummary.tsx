import { Box, Typography } from "@mui/material";
import { formatRiskReward } from "../../utils/riskReward.utils";

const RiskRewardSummary = ({ ratio }: { ratio: number | null }) => {
  const healthy = ratio !== null && ratio >= 1.5;
  return (
    <Box
      role="status"
      sx={{
        mt: 1,
        p: 1.4,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: ratio === null ? "#CBD5E1" : healthy ? "#86EFAC" : "#FCD34D",
        bgcolor: ratio === null ? "#F8FAFC" : healthy ? "#F0FDF4" : "#FFFBEB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 0.5,
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#172033" }}>
          Risk : Reward
        </Typography>
        <Typography sx={{ fontSize: "0.68rem", color: "#64748B" }}>
          Based on Target 1 and the primary stop loss. Entry ranges use the conservative edge.
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: ratio === null ? "#64748B" : healthy ? "#15803D" : "#B45309" }}>
        {formatRiskReward(ratio)}
      </Typography>
    </Box>
  );
};

export default RiskRewardSummary;
