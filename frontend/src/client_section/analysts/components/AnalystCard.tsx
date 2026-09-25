import { useEffect, useState } from "react";
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
const [imageUrl, setImageUrl] = useState<string>();

useEffect(() => {
  let objectUrl: string | undefined;

  const loadImage = async () => {
    if (!analyst.profileImage) {
      setImageUrl(undefined);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const imagePath = analyst.profileImage.startsWith("http")
        ? analyst.profileImage
        : `${getApiOrigin()}${
            analyst.profileImage.startsWith("/") ? "" : "/"
          }${analyst.profileImage}`;

      const response = await fetch(imagePath, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Failed to load analyst profile image:",
          response.status
        );
        setImageUrl(undefined);
        return;
      }

      const blob = await response.blob();

      objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    } catch (error) {
      console.error("Profile image loading error:", error);
      setImageUrl(undefined);
    }
  };

  loadImage();

  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [analyst.profileImage]);

  return (
    <Box
      component="article"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "24px",
        border: "1px solid #EAEFF5",
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
        p: { xs: 2.5, sm: 3 },
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      {/* Header: Avatar + Name + SEBI Badge + Org */}
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
  src={imageUrl}
  alt={analyst.name}
  sx={{
    width: 68,
    height: 68,
    bgcolor: "#5B73FF",
    fontSize: 26,
    fontWeight: 800,
    boxShadow: "0 6px 16px rgba(91, 115, 255, 0.3)",
  }}
>
  {analyst.name.charAt(0).toUpperCase()}
</Avatar>

        <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: 19,
                color: "#1E293B",
                lineHeight: 1.2,
              }}
            >
              {analyst.name}
            </Typography>
            <VerifiedRoundedIcon sx={{ color: "#4F8CFF", fontSize: 20 }} />
          </Stack>

          {analyst.sebiRegistrationNumber ? (
            <Chip
              label={`SEBI: ${analyst.sebiRegistrationNumber}`}
              size="small"
              sx={{
                mt: 0.75,
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                fontWeight: 700,
                fontSize: 11.5,
                height: 24,
                borderRadius: "6px",
                border: "1px solid #E0E7FF",
              }}
            />
          ) : (
            <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.5 }}>
              SEBI details available on request
            </Typography>
          )}

          {analyst.organization && (
            <Typography
              sx={{
                color: "#94A3B8",
                fontSize: 13,
                mt: 0.75,
                fontWeight: 500,
              }}
            >
              {analyst.organization}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Short Bio */}
      <Typography
        sx={{
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.55,
          mt: 2.5,
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

      {/* Expertise & Market Chips */}
      <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
        {analyst.expertise && (
          <Chip
            label={analyst.expertise}
            size="small"
            sx={{
              bgcolor: "#EEF2FF",
              color: "#4F46E5",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: "8px",
              height: 26,
              px: 0.5,
            }}
          />
        )}
        {analyst.markets && (
          <Chip
            label={analyst.markets}
            size="small"
            sx={{
              bgcolor: "#DCFCE7",
              color: "#16A34A",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: "8px",
              height: 26,
              px: 0.5,
            }}
          />
        )}
      </Stack>

      {/* Stats Container (Added mb: 2.5 for clean separation from line) */}
      <Box
        sx={{
          mt: 2.5,
          mb: 2.5,
          py: 2,
          px: 1,
          bgcolor: "#F8FAFC",
          borderRadius: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.2fr",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box sx={{ borderRight: "1px solid #E2E8F0" }}>
          <Typography
            sx={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}
          >
            {analyst.recommendationCount}
          </Typography>
          <Typography
            sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 600, mt: 0.25 }}
          >
            Recommendations
          </Typography>
        </Box>

        <Box sx={{ borderRight: "1px solid #E2E8F0" }}>
          <Typography
            sx={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}
          >
            {analyst.liveCallCount}
          </Typography>
          <Typography
            sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 600, mt: 0.25 }}
          >
            Live Calls
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{ fontSize: 22, fontWeight: 800, color: "#4F46E5" }}
          >
            {analyst.liveCallCount} Active
          </Typography>
          <Typography
            sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 600, mt: 0.25 }}
          >
            Live Signals
          </Typography>
        </Box>
      </Box>

      {/* Footer: Price + Plan + Button */}
      <Box
        sx={{
          mt: "auto",
          pt: 2.5,
          borderTop: "1px dashed #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            {formatPrice(analyst.pricePaise, analyst.currency)}
          </Typography>
          <Typography
            sx={{
              color: "#64748B",
              fontSize: 12,
              fontWeight: 700,
              mt: 0.5,
            }}
          >
            /{analyst.durationDays} Days Plan
          </Typography>
        </Box>

        <Button
          variant={analyst.isSubscribed ? "outlined" : "contained"}
          disabled={subscribing || cancelling}
          onClick={() =>
            analyst.isSubscribed ? onCancel(analyst) : onSubscribe(analyst)
          }
          sx={{
            minWidth: 110,
            height: 42,
            borderRadius: "12px",
            px: 2.5,
            textTransform: "none",
            fontWeight: 800,
            fontSize: 14,
            boxShadow: analyst.isSubscribed
              ? "none"
              : "0 4px 12px rgba(82, 113, 255, 0.25)",
            color: analyst.isSubscribed ? "#991B1B" : "#FFFFFF",
            borderColor: analyst.isSubscribed ? "#FECDD3" : "transparent",
            bgcolor: analyst.isSubscribed ? "#FFF1F2" : "#5B73FF",
            "&:hover": {
              bgcolor: analyst.isSubscribed ? "#FFE4E6" : "#4A62EE",
              borderColor: analyst.isSubscribed ? "#FDA4AF" : "transparent",
            },
            "&.Mui-disabled": {
              color: analyst.isSubscribed ? "#991B1B" : "#FFFFFF",
              borderColor: analyst.isSubscribed ? "#FECDD3" : "transparent",
              bgcolor: analyst.isSubscribed ? "#FFF1F2" : "#5B73FF",
              opacity: 0.85,
            },
          }}
        >
          {subscribing || cancelling ? (
            <CircularProgress
              size={20}
              sx={{ color: analyst.isSubscribed ? "#991B1B" : "#FFFFFF" }}
            />
          ) : analyst.isSubscribed ? (
            "Cancel"
          ) : (
            "Subscribe"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default AnalystCard;