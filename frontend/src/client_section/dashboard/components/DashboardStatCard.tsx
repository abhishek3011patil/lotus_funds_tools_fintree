import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

interface DashboardStatCardProps {
  label: string;
  value: number;
  helper: string;
  icon: SvgIconComponent;
  color: string;
  background: string;
}

const DashboardStatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  color,
  background,
}: DashboardStatCardProps) => (
  <Box
    sx={{
      bgcolor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "16px",
      p: 2.25,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      minHeight: 132,
      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
    }}
  >
    <Box>
      <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#172033", fontSize: 30, fontWeight: 800, mt: 0.6 }}>
        {value}
      </Typography>
      <Typography sx={{ color: "#94A3B8", fontSize: 12, mt: 0.35 }}>
        {helper}
      </Typography>
    </Box>
    <Box sx={{ bgcolor: background, color, borderRadius: "12px", p: 1.1, display: "grid", placeItems: "center" }}>
      <Icon />
    </Box>
  </Box>
);

export default DashboardStatCard;
