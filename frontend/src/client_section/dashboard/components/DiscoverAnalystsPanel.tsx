import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { DashboardAnalyst } from "../types";

interface DiscoverAnalystsPanelProps {
  analysts: DashboardAnalyst[];
  onBrowse: () => void;
}

const apiOrigin = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const DiscoverAnalystsPanel = ({ analysts, onBrowse }: DiscoverAnalystsPanelProps) => (
  <Box sx={{ bgcolor: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "18px", p: { xs: 2, sm: 2.5 } }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Box>
        <Typography component="h2" sx={{ color: "#172033", fontSize: 19, fontWeight: 800 }}>
          Discover Analysts
        </Typography>
        <Typography sx={{ color: "#64748B", fontSize: 12.5 }}>
          Add more perspectives to your research feed
        </Typography>
      </Box>
      <Button onClick={onBrowse} endIcon={<ArrowForwardRoundedIcon />} sx={{ color: "#5271FF", fontWeight: 700 }}>
        Browse all
      </Button>
    </Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
      {analysts.map((analyst) => (
        <Box key={analyst.id} sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", p: 1.75 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar
              src={analyst.profileImage ? `${apiOrigin}${analyst.profileImage}` : undefined}
              alt={analyst.name}
              sx={{ bgcolor: "#5271FF", fontWeight: 800 }}
            >
              {analyst.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: "#172033", fontWeight: 800 }}>{analyst.name}</Typography>
              <Typography noWrap sx={{ color: "#5271FF", fontSize: 11.5 }}>
                {analyst.sebiRegistrationNumber ? `SEBI: ${analyst.sebiRegistrationNumber}` : analyst.organization || "Verified RA"}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.6} sx={{ mt: 1.5, minHeight: 25 }}>
            {analyst.expertise && <Chip size="small" label={analyst.expertise} sx={{ bgcolor: "#EEF2FF", color: "#4054B2", maxWidth: 135 }} />}
            {analyst.markets && <Chip size="small" label={analyst.markets} sx={{ bgcolor: "#ECFDF5", color: "#15803D", maxWidth: 90 }} />}
          </Stack>
          <Button fullWidth onClick={onBrowse} variant="outlined" sx={{ mt: 1.6, borderColor: "#C7D2FE", color: "#5271FF", fontWeight: 700 }}>
            View analyst
          </Button>
        </Box>
      ))}
    </Box>
  </Box>
);

export default DiscoverAnalystsPanel;
