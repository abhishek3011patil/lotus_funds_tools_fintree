import React, { useState, useEffect } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, Chip } from "@mui/material";
import PlanCard, { PlanFeature, PlanBenefit } from "./PlanCard";
import PaymentMethod from "./payment/PaymentMethod";
import { useSearchParams, useNavigate } from "react-router-dom";

interface PlanConfig {
  planName: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyOriginalPrice?: string;
  annualOriginalPrice?: string;
  monthlySubText?: string;
  annualSubText?: string;
  ctaText: string;
  ctaColor?: string;
  ctaTextColor?: string;
  ctaBorderColor?: string;
  highlighted?: boolean;
  featuredBenefits: PlanFeature[];
  additionalBenefits: PlanBenefit[];
}

const plans: PlanConfig[] = [
  {
    planName: "Free of Charge",
    description:
      "Get started with essential tools and features to explore Fintree's capabilities at no cost.",
    monthlyPrice: "₹0/mo",
    annualPrice: "₹0/yr",
    ctaText: "Get Started Free",
    ctaColor: "white",
    ctaTextColor: "black",
    ctaBorderColor: "black",

    highlighted: true,

    featuredBenefits: [
      {
        text: "Access to Fintree Basic",
        subText: "Get access to basic financial tools and analysis features",
        isHighlight: true,
      },
      {
        text: "Basic portfolio tracking",
        subText: "Track up to 5 portfolios with standard analytics",
      },
      {
        text: "Community support",
        subText: "Get help from the Fintree community forums",
      },
    ],
    additionalBenefits: [
      {
        text: "Market overview",
        subText: "Access to basic market data and trends",
      },
      {
        text: "Email notifications",
        subText: "Get daily market summary emails",
      },
      {
        text: "200 monthly API credits",
        subText: "API credits for accessing Fintree data services",
      },
      {
        text: "Standard reports",
        subText: "Generate up to 5 reports per month",
      },
      {
        text: "Storage",
        subText: "500 MB total storage for reports and data",
      },
    ],
  },
  {
    planName: "Fintree Plus",
    description:
      "Get more access to new and powerful features to boost your productivity and financial creativity.",
    monthlyPrice: "₹199/mo",
    annualPrice: "₹1,990/yr",
    // monthlyOriginalPrice: "₹399",
    annualOriginalPrice: "₹4,788",
    monthlySubText: "for 6 months, ₹399/mo after",
    annualSubText: "Save 58% compared to monthly pricing",
    ctaText: "Get Fintree Plus",
    ctaColor: "#1a73e8",
    ctaTextColor: "#fff",
    featuredBenefits: [
      {
        text: "More access to Fintree 3 Pro",
        subText:
          "Get more access to our most intelligent financial model Fintree 3 Pro",
        isHighlight: true,
      },
      {
        text: "More access to premium features",
        subText:
          "Get enhanced access to advanced analytics, real-time alerts, and deep research tools",
        isHighlight: true,
      },
      {
        text: "Priority portfolio analysis",
        subText: "Track unlimited portfolios with AI-powered insights",
      },
    ],
    additionalBenefits: [
      {
        text: "Advanced analytics",
        subText: "AI-powered financial analysis and forecasting tools",
      },
      {
        text: "Real-time alerts",
        subText: "Instant notifications for market movements and portfolio changes",
      },
      {
        text: "1,000 monthly API credits",
        subText:
          "API credits to increase access to next-level Fintree features",
      },
      {
        text: "Fintree Search",
        subText: "Higher access to the Fintree 3 Pro model and more",
      },
      {
        text: "Fintree Insights",
        subText:
          "More access to our research partner with audio and video overviews",
      },
      {
        text: "Fintree in Email, Docs & more",
        subText: "Access Fintree directly in your workflow apps",
      },
      {
        text: "Storage",
        subText: "5 TB total storage for reports, data, and backups",
      },
    ],
  },
  {
    planName: "Fintree Pro",
    description:
      "Unlock the highest levels of access to the best of Fintree and exclusive premium features.",
    monthlyPrice: "₹24,500/mo",
    annualPrice: "₹2,45,000/yr",
    annualSubText: "Save 17% compared to monthly pricing",
    ctaText: "Get Fintree Pro",
    ctaColor: "#1a73e8",
    featuredBenefits: [
      {
        text: "Highest access to Fintree 3 Pro",
        subText:
          "Get the highest access to our most intelligent model Fintree 3 Pro",
        isHighlight: true,
      },
      {
        text: "Highest limits to premium features",
        subText:
          "Get the highest limits to advanced analytics, real-time alerts, Fintree Pro, and deep research",
        isHighlight: true,
      },
      {
        text: "Earliest access to new innovations",
        subText:
          "Unlock access to exclusive beta features and Fintree Agent",
        isHighlight: true,
      },
    ],
    additionalBenefits: [
      {
        text: "Enterprise analytics",
        subText: "Highest limits to AI-powered financial analysis tools",
      },
      {
        text: "Real-time streaming",
        subText: "Live market data streaming with zero latency",
      },
      {
        text: "25,000 monthly API credits",
        subText:
          "API credits to unlock maximum access to all Fintree features",
      },
      {
        text: "Fintree Search",
        subText: "Get the highest access to the Fintree 3 Pro model and more",
      },
      {
        text: "Fintree Insights",
        subText:
          "Highest access to our research partner with audio and video overviews",
      },
      {
        text: "Fintree in Email, Docs, Vids & more",
        subText: "Highest access to Fintree directly in your workflow apps",
      },
      {
        text: "Fintree Premium individual plan",
        subText: "Fintree ad-free, offline, in the background",
      },
      {
        text: "Fintree Developer Programme premium",
        subText:
          "Build, learn and grow faster as a developer with the highest limits",
      },
      {
        text: "Fintree Studio",
        subText:
          "Get the highest limits to prototype, experiment, and build with our Fintree 3.1 Pro models",
      },
      {
        text: "Storage",
        subText: "30 TB total storage for reports, data, and backups",
      },
    ],
  },
];

const SubscriptionPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ planName: string; price: string } | null>(null);
  
  // 1. Properly initialize search params and token state
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 2. Capture token from URL on mount
    const t = searchParams.get("token");
    setToken(t);
    
    if (!t) {
      console.warn("No token found in URL. Please use the link from your email.");
    }
  }, [searchParams]);

  const handleGetStarted = (planName: string, price: string) => {
    // 3. Logic for the FREE PLAN
    if (planName === "Free of Charge" || price.includes("₹0")) {
      handleFreePlanActivation();
      return;
    }

    // 4. Logic for PAID PLANS
    setSelectedPlan({ planName, price });
    setPaymentOpen(true);
  };

  const handleFreePlanActivation = async () => {
    if (!token) {
      alert("Invalid session. Please open the link from your email.");
      return;
    }

    try {
      // Use absolute path to port 5000 for local testing
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/activate-free-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resetToken: token,
          planName: "Free" 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS: Move to set-password
        window.location.href = `/set-password?token=${token}`;
      } else {
        alert(data.message || "Failed to activate free plan");
      }
    } catch (error) {
      console.error("Free plan activation error:", error);
      alert("Network error. Please check if your backend is running on port 5000.");
    }
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedPlan(null);
  };

  const handleBillingChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: "monthly" | "annual" | null
  ) => {
    if (newValue !== null) {
      setBillingCycle(newValue);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
      }}
    >
      {/* Header Section */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#202124",
            mb: 1.5,
            fontSize: { xs: "1.5rem", md: "2rem" },
          }}
        >
          Get more out of Fintree
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#5f6368",
            maxWidth: 650,
            mx: "auto",
            lineHeight: 1.6,
            fontSize: "0.85rem",
          }}
        >
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Deserunt quo perspiciatis repellendus maiores cumque minus expedita quas provident earum accusamus rerum voluptate accusantium est recusandae, excepturi inventore illo voluptates eum.
        </Typography>
      </Box>

      {/* Billing Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 5,
        }}
      >
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingChange}
          sx={{
            bgcolor: "#fff",
            borderRadius: "28px",
            border: "1px solid #dadce0",
            overflow: "hidden",
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "28px !important",
              px: 3.5,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#5f6368",
              transition: "all 0.25s ease",
              "&.Mui-selected": {
                bgcolor: "#1a73e8",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#1557b0",
                },
              },
              "&:hover": {
                bgcolor: "rgba(26,115,232,0.08)",
              },
            },
          }}
        >
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="annual">
            Annual
            <Chip
              label="Save $$"
              size="small"
              sx={{
                ml: 1,
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor:
                  billingCycle === "annual"
                    ? "rgba(255,255,255,0.25)"
                    : "#e8f5e9",
                color: billingCycle === "annual" ? "#fff" : "#2e7d32",
              }}
            />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Plans Grid */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: { xs: "center", md: "stretch" },
          justifyContent: "center",
          maxWidth: { xs: 600, md: 1200 },
          mx: "auto",
        }}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.planName}
            {...plan}
            isAnnual={billingCycle === "annual"}
            onGetStarted={() => handleGetStarted(
              plan.planName,
              billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice
            )}
          />
        ))}
      </Box>

      {/* Payment Method Dialog */}
      <PaymentMethod
        open={paymentOpen}
        onClose={handlePaymentClose}
        planName={selectedPlan?.planName || ""}
        planPrice={selectedPlan?.price || ""}
        resetToken={token} 
      />

      {/* Footer */}
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="caption" sx={{ color: "#9aa0a6", fontSize: "0.75rem" }}>
          Certain benefits are only available for eligible accounts. Learn
          more about{" "}
          <Typography
            component="span"
            variant="caption"
            sx={{
              color: "#1a73e8",
              cursor: "pointer",
              fontSize: "0.75rem",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Fintree benefits
          </Typography>
          .
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#1a73e8",
            mt: 1.5,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.85rem",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          See all plans
        </Typography>
      </Box>
    </Box>
  );
};

export default SubscriptionPage;
