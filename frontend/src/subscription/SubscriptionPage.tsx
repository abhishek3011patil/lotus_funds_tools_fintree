import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import PlanCard, { PlanFeature, PlanBenefit } from "./PlanCard";
import PaymentMethod from "./payment/PaymentMethod";
import { useSearchParams, useNavigate } from "react-router-dom";

// Types
export type UserRoleTab = "RA" | "BROKER" | "CLIENT";

export interface PlanConfig {
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

// Refined, Professional Copy per User Role
const rolePlans: Record<UserRoleTab, PlanConfig[]> = {
  RA: [
    {
      planName: "RA Starter",
      description: "Essential toolkit for independent analysts to publish and manage research recommendations.",
      monthlyPrice: "₹1,499/mo",
      annualPrice: "₹14,990/yr",
      ctaText: "Get Started",
      ctaColor: "white",
      ctaTextColor: "black",
      ctaBorderColor: "black",
      highlighted: false,
      featuredBenefits: [
        { text: "Dedicated RA Dashboard", isHighlight: true },
        { text: "Publish & manage research calls" },
        { text: "Draft management & Errata logs" },
        { text: "In-app broadcast alerts" },
      ],
      additionalBenefits: [
        { text: "SEBI Compliance & Profile Setup" },
        { text: "Basic performance analytics" },
        { text: "Standard email support" },
        { text: "Limits: 100 Subs | 50 Calls/mo | 1 Broker | 1 Seat" },
      ],
    },
    {
      planName: "RA Professional",
      description: "Automated distribution channels and advanced analytics for growing research practices.",
      monthlyPrice: "₹3,999/mo",
      annualPrice: "₹39,990/yr",
      ctaText: "Upgrade to Professional",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: true,
      featuredBenefits: [
        { text: "Everything in Starter", isHighlight: true },
        { text: "Automated WhatsApp & Telegram delivery", isHighlight: true },
        { text: "Advanced analytics & exportable reports" },
        { text: "Subscriber CRM & bulk CSV import" },
      ],
      additionalBenefits: [
        { text: "Publish detailed market reports" },
        { text: "Priority customer support" },
        { text: "Limits: 1,000 Subs | 250 Calls/mo | 5 Brokers | 3 Seats" },
      ],
    },
    {
      planName: "RA Elite",
      description: "Enterprise infrastructure with unlimited call volume, direct APIs, and team controls.",
      monthlyPrice: "₹8,999/mo",
      annualPrice: "₹89,990/yr",
      ctaText: "Get Elite Access",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: false,
      featuredBenefits: [
        { text: "Everything in Professional", isHighlight: true },
        { text: "Unlimited research calls & brokers", isHighlight: true },
        { text: "REST API & Webhook access" },
        { text: "Role-based team permissions" },
      ],
      additionalBenefits: [
        { text: "Real-time delivery monitoring" },
        { text: "Dedicated account manager" },
        { text: "Limits: 5,000+ Subs | Unlimited Calls | 10+ Seats" },
      ],
    },
  ],
  BROKER: [
    {
      planName: "Broker Basic",
      description: "Core client management interface designed for emerging broking firms.",
      monthlyPrice: "₹2,499/mo",
      annualPrice: "₹24,990/yr",
      ctaText: "Get Started",
      ctaColor: "white",
      ctaTextColor: "black",
      ctaBorderColor: "black",
      highlighted: false,
      featuredBenefits: [
        { text: "Broker Operations Hub", isHighlight: true },
        { text: "1 Analyst connection" },
        { text: "Client portfolio management" },
        { text: "Research feed & announcements" },
      ],
      additionalBenefits: [
        { text: "Standard technical support" },
        { text: "Limits: 1 RA | 100 Clients | 1 Admin Seat" },
      ],
    },
    {
      planName: "Broker Professional",
      description: "White-labeled portal featuring multi-analyst integration and instant messaging.",
      monthlyPrice: "₹6,999/mo",
      annualPrice: "₹69,990/yr",
      ctaText: "Upgrade to Professional",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: true,
      featuredBenefits: [
        { text: "Everything in Basic", isHighlight: true },
        { text: "Multi-RA connection engine", isHighlight: true },
        { text: "WhatsApp & Telegram client distribution" },
        { text: "Custom white-label portal" },
      ],
      additionalBenefits: [
        { text: "Business analytics & custom reports" },
        { text: "Limits: 10 RAs | 2,000 Clients | 5 Admin Seats" },
      ],
    },
    {
      planName: "Broker Enterprise",
      description: "Complete API suite engineered for multi-branch, institutional brokerages.",
      monthlyPrice: "₹18,999/mo",
      annualPrice: "₹1,89,990/yr",
      ctaText: "Contact Enterprise",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: false,
      featuredBenefits: [
        { text: "Everything in Professional", isHighlight: true },
        { text: "Full API suite & custom branding", isHighlight: true },
        { text: "Institutional analytics suite" },
        { text: "Multi-branch hierarchy management" },
      ],
      additionalBenefits: [
        { text: "24/7 Dedicated Account Manager & SLA" },
        { text: "Limits: Custom tailored volume" },
      ],
    },
  ],
  CLIENT: [
    {
      planName: "Client Basic",
      description: "Free access to explore research feeds and essential market updates.",
      monthlyPrice: "₹0/mo",
      annualPrice: "₹0/yr",
      ctaText: "Get Started Free",
      ctaColor: "white",
      ctaTextColor: "black",
      ctaBorderColor: "black",
      highlighted: false,
      featuredBenefits: [
        { text: "Personal Investor Dashboard", isHighlight: true },
        { text: "Follow 1 Research Analyst" },
        { text: "Real-time research feed stream" },
      ],
      additionalBenefits: [
        { text: "In-app notifications" },
        { text: "Educational market library" },
        { text: "Limits: 1 RA | 30-day history" },
      ],
    },
    {
      planName: "Client Premium",
      description: "Follow multiple analysts and receive real-time premium trade alerts.",
      monthlyPrice: "₹299/mo",
      annualPrice: "₹2,990/yr",
      ctaText: "Get Premium",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: true,
      featuredBenefits: [
        { text: "Everything in Basic", isHighlight: true },
        { text: "Follow multiple Analysts", isHighlight: true },
        { text: "Access premium research calls" },
      ],
      additionalBenefits: [
        { text: "Instant email & broadcast alerts" },
        { text: "Full research report archive" },
        { text: "Limits: Up to 5 RAs | Unlimited history" },
      ],
    },
    {
      planName: "Client Elite",
      description: "Complete investor toolkit with priority alerts, comparison tools, and top-tier support.",
      monthlyPrice: "₹799/mo",
      annualPrice: "₹7,990/yr",
      ctaText: "Get Elite Access",
      ctaColor: "#1a73e8",
      ctaTextColor: "#fff",
      highlighted: false,
      featuredBenefits: [
        { text: "Everything in Premium", isHighlight: true },
        { text: "High-priority trade alerts", isHighlight: true },
        { text: "Analyst Performance Comparison Matrix" },
        { text: "Unlimited custom watchlists" },
      ],
      additionalBenefits: [
        { text: "Exclusive macro & sector reports" },
        { text: "Priority support" },
        { text: "Limits: 15+ RAs | Unlimited Watchlists" },
      ],
    },
  ],
};

const SubscriptionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRoleTab>("RA");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ planName: string; price: string } | null>(null);

  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get("token");
    setToken(t);

    if (!t) {
      console.warn("No token found in URL. Please use the link from your email.");
    }
  }, [searchParams]);

  const handleGetStarted = (planName: string, price: string) => {
    if (planName.toLowerCase().includes("free") || price.includes("₹0")) {
      handleFreePlanActivation();
      return;
    }

    setSelectedPlan({ planName, price });
    setPaymentOpen(true);
  };

  const handleFreePlanActivation = async () => {
    if (!token) {
      alert("Invalid session. Please open the link from your email.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/activate-free-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resetToken: token,
            planName: "Free",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
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

  const currentPlans = rolePlans[selectedRole];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3, md: 4 },
        boxSizing: "border-box",
        overflowX: "hidden",
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
            fontSize: { xs: "1.4rem", sm: "1.75rem", md: "2rem" },
          }}
        >
          Get more out of Tarkashh
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#5f6368",
            maxWidth: 650,
            mx: "auto",
            lineHeight: 1.6,
            fontSize: { xs: "0.8rem", sm: "0.85rem" },
            px: 1,
          }}
        >
          Choose a tailored subscription plan built specifically for your role. Enhance your capabilities with robust financial analysis, real-time alerts, and seamless integrations.
        </Typography>
      </Box>

      {/* Custom Rounded Pill Tab Switcher */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 4,
          px: 1,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#ffffff",
            border: "1px solid #dadce0",
            borderRadius: "50px",
            p: "4px",
            boxShadow: "0px 1px 3px rgba(0,0,0,0.05)",
            maxWidth: "100%",
          }}
        >
          {(["RA", "BROKER", "CLIENT"] as UserRoleTab[]).map((role) => {
            const isSelected = selectedRole === role;
            return (
              <Box
                key={role}
                onClick={() => setSelectedRole(role)}
                sx={{
                  px: { xs: 2.5, sm: 4 },
                  py: 1,
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  letterSpacing: "0.04em",
                  color: isSelected ? "#ffffff" : "#3c4043",
                  bgcolor: isSelected ? "#1a73e8" : "transparent",
                  transition: "all 0.2s ease-in-out",
                  userSelect: "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  minWidth: { xs: 65, sm: 95 },
                  "&:hover": {
                    color: isSelected ? "#ffffff" : "#1a73e8",
                  },
                }}
              >
                {role}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Responsive Plans Container */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2.5, md: 3 },
          alignItems: "stretch",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {currentPlans.map((plan) => (
          <Box
            key={plan.planName}
            sx={{
              width: { xs: "100%", md: "calc(33.333% - 16px)" },
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <PlanCard
              {...plan}
              isAnnual={false}
              onGetStarted={() =>
                handleGetStarted(plan.planName, plan.monthlyPrice)
              }
            />
          </Box>
        ))}
      </Box>

      {/* Payment Method Modal */}
      <PaymentMethod
        open={paymentOpen}
        onClose={handlePaymentClose}
        planName={selectedPlan?.planName || ""}
        planPrice={selectedPlan?.price || ""}
        resetToken={token}
      />

      {/* Footer Details */}
      <Box sx={{ textAlign: "center", mt: 5, px: 2 }}>
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
            Tarkashh benefits
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