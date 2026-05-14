import React from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StarIcon from "@mui/icons-material/Star";

export interface PlanFeature {
  text: string;
  subText?: string;
  isHighlight?: boolean;
}

export interface PlanBenefit {
  text: string;
  subText?: string;
}

export interface PlanCardProps {
  planName: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyOriginalPrice?: string;
  annualOriginalPrice?: string;
  monthlySubText?: string;
  annualSubText?: string;
  isAnnual: boolean;
  ctaText: string;
  ctaTextColor?: string;
  ctaColor?: string;
  ctaBorderColor?: string;
  highlighted?: boolean;
  featuredBenefits: PlanFeature[];
  additionalBenefits: PlanBenefit[];
  onGetStarted?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  planName,
  description,
  monthlyPrice,
  annualPrice,
  monthlyOriginalPrice,
  annualOriginalPrice,
  monthlySubText,
  annualSubText,
  isAnnual,
  ctaText,
  ctaColor = "#1a73e8",
  ctaTextColor = "#fff",
  ctaBorderColor,
  highlighted = false,
  featuredBenefits,
  additionalBenefits,
  onGetStarted,
}) => {
  const currentPrice = isAnnual ? annualPrice : monthlyPrice;
  const originalPrice = isAnnual ? annualOriginalPrice : monthlyOriginalPrice;
  const subText = isAnnual ? annualSubText : monthlySubText;

  return (
    <Box
      sx={{
        border: highlighted ? "2px solid #1a73e8" : "1px solid #dadce0",
        borderRadius: "16px",
        p: { xs: 2.5, md: 3.5 },
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: { md: 1 },
        minWidth: 0,
        bgcolor: "#fff",
        transition: "box-shadow 0.3s ease, transform 0.25s ease",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          transform: "translateY(-4px)",
        },
        "&::before": highlighted
          ? {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #1a73e8, #4285f4, #1a73e8)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite linear",
            "@keyframes shimmer": {
              "0%": { backgroundPosition: "200% 0" },
              "100%": { backgroundPosition: "-200% 0" },
            },
          }
          : {},
      }}
    >
      {/* Plan Name */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "#202124",
          mb: 1,
        }}
      >
        {planName}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: "#5f6368",
          mb: 2.5,
          lineHeight: 1.5,
          minHeight: 42,
          fontSize: "0.85rem",
        }}
      >
        {description}
      </Typography>

      {/* Price Section */}
      <Box sx={{ mb: 1, minHeight: 60 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          {originalPrice && (
            <Typography
              component="span"
              sx={{
                textDecoration: "line-through",
                color: "#9aa0a6",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              {originalPrice}
            </Typography>
          )}
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: "1.75rem",
              color: "#202124",
              letterSpacing: "-0.5px",
            }}
          >
            {currentPrice}
          </Typography>
        </Box>
        {subText && (
          <Typography
            variant="caption"
            sx={{
              color: "#5f6368",
              display: "block",
              mt: 0.5,
              fontSize: "0.75rem",
            }}
          >
            {subText}
          </Typography>
        )}
      </Box>

      {/* CTA Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={onGetStarted}
        sx={{
          bgcolor: ctaColor,
          color: ctaTextColor,
          border: ctaBorderColor ? `1px solid ${ctaBorderColor}` : "none",
          borderRadius: "24px",
          py: 1.2,
          fontWeight: 600,
          fontSize: "0.9rem",
          textTransform: "none",
          mb: 3,
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: ctaColor,
            filter: "brightness(1.1)",
            boxShadow: "0 4px 12px rgba(26,115,232,0.3)",
          },
        }}
      >
        {ctaText}
      </Button>

      {/* Featured Benefits */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          fontSize: "0.8rem",
          color: "#202124",
          mb: 1.5,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Featured Fintree benefits
      </Typography>

      <Box sx={{ mb: 2 }}>
        {featuredBenefits.map((benefit, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 1.5,
              alignItems: "flex-start",
            }}
          >
            {benefit.isHighlight ? (
              <StarIcon
                sx={{ fontSize: 18, color: "#1a73e8", mt: 0.2, flexShrink: 0 }}
              />
            ) : (
              <CheckCircleOutlineIcon
                sx={{ fontSize: 18, color: "#1a73e8", mt: 0.2, flexShrink: 0 }}
              />
            )}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#202124",
                  fontSize: "0.82rem",
                  lineHeight: 1.4,
                }}
              >
                {benefit.text}
              </Typography>
              {benefit.subText && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#5f6368",
                    display: "block",
                    lineHeight: 1.4,
                    mt: 0.3,
                    fontSize: "0.75rem",
                  }}
                >
                  {benefit.subText}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 2, borderColor: "#e8eaed" }} />

      {/* Additional Benefits */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          fontSize: "0.8rem",
          color: "#202124",
          mb: 1.5,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Also included in this plan
      </Typography>

      <Box>
        {additionalBenefits.map((benefit, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 1.5,
              alignItems: "flex-start",
            }}
          >
            <CheckCircleOutlineIcon
              sx={{ fontSize: 16, color: "#5f6368", mt: 0.2, flexShrink: 0 }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#202124",
                  fontSize: "0.82rem",
                  lineHeight: 1.4,
                }}
              >
                {benefit.text}
              </Typography>
              {benefit.subText && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#5f6368",
                    display: "block",
                    lineHeight: 1.4,
                    mt: 0.3,
                    fontSize: "0.75rem",
                  }}
                >
                  {benefit.subText}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PlanCard;
