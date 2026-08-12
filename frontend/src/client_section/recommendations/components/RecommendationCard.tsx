import LockRoundedIcon from "@mui/icons-material/LockRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ClientRecommendationCall } from "../types";

interface RecommendationCardProps {
  call: ClientRecommendationCall;
  subscribing?: boolean;
  onOpen?: (call: ClientRecommendationCall) => void;
  onSubscribe?: (call: ClientRecommendationCall) => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const PriceMetric = ({
  label,
  value,
  color,
  locked,
}: {
  label: string;
  value: string | null;
  color: string;
  locked: boolean;
}) => (
  <Box>
    <Typography sx={{ color: "#64748B", fontSize: 11.5 }}>{label}</Typography>
    <Typography
      sx={{
        color,
        fontSize: 16,
        fontWeight: 800,
        mt: 0.25,
        filter: locked ? "blur(5px)" : "none",
        userSelect: locked ? "none" : "auto",
      }}
    >
      {locked ? "₹000.00" : value ? `₹${value}` : "—"}
    </Typography>
  </Box>
);

const RecommendationCard = ({
  call,
  subscribing = false,
  onOpen,
  onSubscribe,
}: RecommendationCardProps) => (
  <Box
    component="article"
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      bgcolor: "#FFFFFF",
      border: call.locked ? "1px solid #DCE6FF" : "1px solid #E2E8F0",
      borderRadius: "16px",
      p: 2.25,
      boxShadow: "0 7px 22px rgba(15, 23, 42, 0.06)",
    }}
  >
    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.8} flexWrap="wrap">
          <Typography sx={{ color: "#172033", fontSize: 18, fontWeight: 800 }}>
            {call.displayName || call.stockName}
          </Typography>
          <Chip
            size="small"
            label={call.recommendationType}
            sx={{
              height: 23,
              bgcolor:
                call.recommendationType?.toUpperCase() === "SELL"
                  ? "#FEE2E2"
                  : "#DCFCE7",
              color:
                call.recommendationType?.toUpperCase() === "SELL"
                  ? "#B91C1C"
                  : "#15803D",
              fontWeight: 800,
            }}
          />
        </Stack>
        <Typography sx={{ color: "#5271FF", fontSize: 13, mt: 0.5 }}>
          {call.raName}
          {call.raOrganization ? ` · ${call.raOrganization}` : ""}
        </Typography>
      </Box>
      <Chip
        size="small"
        label={call.status === "PUBLISHED" ? "Active" : "Closed"}
        sx={{
          height: 24,
          flexShrink: 0,
          bgcolor: call.status === "PUBLISHED" ? "#ECFDF5" : "#F1F5F9",
          color: call.status === "PUBLISHED" ? "#15803D" : "#475569",
          fontWeight: 700,
        }}
      />
    </Stack>

    <Stack direction="row" spacing={0.7} sx={{ mt: 1.6 }}>
      {[call.exchangeType, call.callType, call.holdingPeriod]
        .filter(Boolean)
        .slice(0, 3)
        .map((label) => (
          <Chip
            key={label}
            size="small"
            label={label}
            sx={{ bgcolor: "#F1F5F9", color: "#475569", maxWidth: 125 }}
          />
        ))}
    </Stack>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1,
        bgcolor: call.locked ? "#F8FAFF" : "#F8FAFC",
        borderRadius: "12px",
        p: 1.5,
        mt: 2,
        position: "relative",
      }}
    >
      <PriceMetric label="Entry" value={call.entryPrice} color="#172033" locked={call.locked} />
      <PriceMetric label="Target" value={call.targetPrice} color="#15803D" locked={call.locked} />
      <PriceMetric label="Stop loss" value={call.stopLoss} color="#DC2626" locked={call.locked} />
      {call.locked && (
        <LockRoundedIcon
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#5271FF",
            bgcolor: "#FFFFFF",
            borderRadius: "50%",
            p: 0.6,
            fontSize: 32,
            boxShadow: "0 3px 12px rgba(82, 113, 255, 0.22)",
          }}
        />
      )}
    </Box>

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1.5}
      sx={{ mt: "auto", pt: 2 }}
    >
      <Typography sx={{ color: "#64748B", fontSize: 12 }}>
        {formatDate(call.createdAt)}
      </Typography>
      {call.locked ? (
        <Button
          variant="contained"
          onClick={() => onSubscribe?.(call)}
          disabled={subscribing}
          startIcon={
            subscribing ? <CircularProgress size={15} color="inherit" /> : <LockRoundedIcon />
          }
          sx={{
            bgcolor: "#5271FF",
            borderRadius: "10px",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "#405EE6", boxShadow: "none" },
          }}
        >
          {subscribing ? "Opening…" : "Subscribe to unlock"}
        </Button>
      ) : (
        <Button
          onClick={() => onOpen?.(call)}
          endIcon={<TrendingUpRoundedIcon />}
          sx={{ color: "#5271FF", fontWeight: 700 }}
        >
          View call
        </Button>
      )}
    </Stack>
  </Box>
);

export default RecommendationCard;
