import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { DashboardCall } from "../types";

interface RecentCallsPanelProps {
  calls: DashboardCall[];
  onViewAll: () => void;
}

const RecentCallsPanel = ({ calls, onViewAll }: RecentCallsPanelProps) => (
  <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "18px", p: { xs: 2, sm: 2.5 }, height: "100%" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Box>
        <Typography component="h2" sx={{ color: "#172033", fontSize: 19, fontWeight: 800 }}>
          Recent Calls
        </Typography>
        <Typography sx={{ color: "#64748B", fontSize: 12.5 }}>
          Latest unlocked calls from your analysts
        </Typography>
      </Box>
      <Button onClick={onViewAll} endIcon={<ArrowForwardRoundedIcon />} sx={{ color: "#5271FF", fontWeight: 700 }}>
        View all
      </Button>
    </Stack>

    {calls.length === 0 ? (
      <Box sx={{ py: 7, textAlign: "center", color: "#64748B" }}>
        No subscribed calls available yet.
      </Box>
    ) : (
      <Stack spacing={1.1}>
        {calls.map((call) => (
          <Box
            key={call.id}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr auto", md: "minmax(170px, 1.5fr) 1fr repeat(3, .7fr) auto" },
              gap: 1.3,
              alignItems: "center",
              bgcolor: "#F8FAFC",
              borderRadius: "12px",
              px: 1.6,
              py: 1.35,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: "#172033", fontWeight: 800, fontSize: 14 }}>
                {call.stockName}
              </Typography>
              <Typography noWrap sx={{ color: "#5271FF", fontSize: 12 }}>
                {call.raName}{call.raOrganization ? ` · ${call.raOrganization}` : ""}
              </Typography>
            </Box>
            <Chip
              label={call.recommendationType}
              size="small"
              sx={{
                justifySelf: "start",
                bgcolor: call.recommendationType === "SELL" ? "#FEE2E2" : "#DCFCE7",
                color: call.recommendationType === "SELL" ? "#B91C1C" : "#15803D",
                fontWeight: 800,
              }}
            />
            {[['Entry', call.entryPrice, '#172033'], ['Target', call.targetPrice, '#15803D'], ['SL', call.stopLoss, '#DC2626']].map(([label, value, color]) => (
              <Box key={label} sx={{ display: { xs: "none", md: "block" } }}>
                <Typography sx={{ color: "#94A3B8", fontSize: 10.5 }}>{label}</Typography>
                <Typography sx={{ color, fontSize: 13, fontWeight: 800 }}>{value ? `₹${value}` : "—"}</Typography>
              </Box>
            ))}
            <Chip
              size="small"
              label={call.status === "PUBLISHED" ? "Active" : "Closed"}
              sx={{ bgcolor: call.status === "PUBLISHED" ? "#ECFDF5" : "#E2E8F0", color: call.status === "PUBLISHED" ? "#15803D" : "#475569" }}
            />
          </Box>
        ))}
      </Stack>
    )}
  </Box>
);

export default RecentCallsPanel;
