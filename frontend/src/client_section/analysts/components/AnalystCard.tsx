import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ClientAnalyst } from "../types";

interface AnalystCardProps {
  analyst: ClientAnalyst;
  subscribing: boolean;
  cancelling: boolean;
  onSubscribe: (analyst: ClientAnalyst) => void;
  onCancel: (analyst: ClientAnalyst) => void;
}

const getApiOrigin = () =>
  String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const formatPrice = (amountPaise: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);

const AnalystCard = ({
  analyst,
  subscribing,
  cancelling,
  onSubscribe,
  onCancel,
}: AnalystCardProps) => {
  const imageUrl = analyst.profileImage
    ? `${getApiOrigin()}${analyst.profileImage}`
    : undefined;

  return (
    <Box
      component="article"
      sx={{
        height: "100%",
        minHeight: 292,
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        color: "#172033",
        p: { xs: 2.25, sm: 2.5 },
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.07)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "#C7D2FE",
          boxShadow: "0 14px 32px rgba(82, 113, 255, 0.13)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          src={imageUrl}
          alt={analyst.name}
          sx={{ width: 62, height: 62, bgcolor: "#5271FF", fontWeight: 800 }}
        >
          {analyst.name.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, lineHeight: 1.25 }}
            >
              {analyst.name}
            </Typography>
            <VerifiedRoundedIcon sx={{ color: "#4F8CFF", fontSize: 17 }} />
          </Stack>
          <Typography sx={{ color: "#5271FF", fontSize: 13.5, mt: 0.35 }}>
            {analyst.sebiRegistrationNumber
              ? `SEBI: ${analyst.sebiRegistrationNumber}`
              : "SEBI details available on request"}
          </Typography>
          {analyst.organization && (
            <Typography sx={{ color: "#64748B", fontSize: 12.5, mt: 0.25 }}>
              {analyst.organization}
            </Typography>
          )}
        </Box>

        <Button
          variant={analyst.isSubscribed ? "outlined" : "contained"}
          color={analyst.isSubscribed ? "error" : "primary"}
          disabled={subscribing || cancelling}
          onClick={() =>
            analyst.isSubscribed ? onCancel(analyst) : onSubscribe(analyst)
          }
          sx={{
            minWidth: 100,
            height: 42,
            borderRadius: "11px",
            px: 2,
            flexShrink: 0,
            textTransform: "none",
            fontWeight: 800,
            color: analyst.isSubscribed ? "#B91C1C" : "#FFFFFF",
            borderColor: analyst.isSubscribed ? "#FCA5A5" : "transparent",
            bgcolor: analyst.isSubscribed ? "#FEF2F2" : "#5271FF",
            "&:hover": {
              bgcolor: analyst.isSubscribed ? "#FEE2E2" : "#405EE6",
            },
            "&.Mui-disabled": {
              color: analyst.isSubscribed ? "#B91C1C" : "#FFFFFF",
              borderColor: analyst.isSubscribed ? "#FCA5A5" : "transparent",
              bgcolor: analyst.isSubscribed ? "#FEF2F2" : "#5271FF",
              opacity: 0.85,
            },
          }}
        >
          {subscribing || cancelling ? (
            <CircularProgress
              size={20}
              sx={{ color: analyst.isSubscribed ? "#B91C1C" : "#FFFFFF" }}
            />
          ) : analyst.isSubscribed ? (
            "Cancel"
          ) : (
            "Subscribe"
          )}
        </Button>
      </Stack>

      <Typography
        sx={{
          color: "#64748B",
          fontSize: 14,
          lineHeight: 1.55,
          mt: 2,
          minHeight: 44,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {analyst.shortBio ||
          `${analyst.name} publishes research and market recommendations on Tarkashh.`}
      </Typography>

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, minHeight: 28 }}>
        {analyst.expertise && (
          <Chip
            label={analyst.expertise}
            size="small"
            sx={{ bgcolor: "#EEF2FF", color: "#4054B2", maxWidth: 150 }}
          />
        )}
        {analyst.markets && (
          <Chip
            label={analyst.markets}
            size="small"
            sx={{ bgcolor: "#ECFDF5", color: "#15803D", maxWidth: 120 }}
          />
        )}
      </Stack>

      <Box
        sx={{
          mt: "auto",
          pt: 2,
          borderTop: "1px solid #EEF2F7",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.25fr",
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 21, fontWeight: 800 }}>
            {String(analyst.recommendationCount).padStart(2, "0")}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 12 }}>
            Recommendations
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 21, fontWeight: 800 }}>
            {String(analyst.liveCallCount).padStart(2, "0")}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 12 }}>
            Live calls
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 21, fontWeight: 800 }}>
            {formatPrice(analyst.pricePaise, analyst.currency)}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 12 }}>
            {analyst.durationDays} days
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalystCard;
