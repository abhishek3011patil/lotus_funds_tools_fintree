import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import type { SubscriptionDetails } from "../../types/subscription";
import SubscriptionStatusSkeleton from "./SubscriptionStatusSkeleton";
import {
  formatSubscriptionAmount,
  formatSubscriptionDate,
  getSubscriptionStatusPresentation,
  normalizeDaysRemaining,
} from "./subscriptionStatus.utils";

export type SubscriptionStatusCardProps = {
  subscription: SubscriptionDetails | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRenew?: () => void;
  onCancel?: () => void;
  renewing?: boolean;
  cancelling?: boolean;
  renewalMessage?: string | null;
  renewalError?: string | null;
  title?: string;
};

type DetailProps = {
  label: string;
  children: React.ReactNode;
};

const Detail = ({ label, children }: DetailProps) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Box>
      <Typography variant="body2" color="text.secondary" mb={0.5}>
        {label}
      </Typography>
      <Typography component="div" variant="body1" fontWeight={500}>
        {children}
      </Typography>
    </Box>
  </Grid>
);

const SubscriptionStatusCard = ({
  subscription,
  loading = false,
  error = null,
  onRetry,
  onRenew,
  onCancel,
  renewing = false,
  cancelling = false,
  renewalMessage = null,
  renewalError = null,
  title = "Subscription Status",
}: SubscriptionStatusCardProps) => {
  if (loading) return <SubscriptionStatusSkeleton />;

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6">{title}</Typography>
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      </Stack>
    );
  }

  if (!subscription) {
    return (
      <Stack spacing={1}>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">
          No subscription found
        </Typography>
      </Stack>
    );
  }

const status = getSubscriptionStatusPresentation(subscription.status);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Title & Status Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "17px", sm: "19px" },
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>

        <Chip
          label={status.label}
          color={status.color}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "12px",
            px: 1,
            height: "26px",
            borderRadius: "6px",
          }}
        />
      </Box>

      {/* Grid of Clean Metric Cards */}
      <Grid container spacing={2}>
        {/* Card 1: Active Plan */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: "4px solid #2563eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              Current Plan
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              {subscription.planName || "Not available"}
            </Typography>
          </Box>
        </Grid>

        {/* Card 2: Amount Paid */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              Amount Paid
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              {formatSubscriptionAmount(subscription.amountPaid, subscription.currency)}
            </Typography>
          </Box>
        </Grid>

        {/* Card 3: Days Remaining (Simple Text Only) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              Days Remaining
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#16a34a" }}>
              {normalizeDaysRemaining(subscription.daysRemaining)} Days
            </Typography>
          </Box>
        </Grid>

        {/* Card 4: Start Date */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              Start Date
            </Typography>
            <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#334155" }}>
              {formatSubscriptionDate(subscription.startsAt)}
            </Typography>
          </Box>
        </Grid>

        {/* Card 5: Expiry Date */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              Expiry Date
            </Typography>
            <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#334155" }}>
              {formatSubscriptionDate(subscription.expiresAt)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {(renewalMessage || renewalError) && (
        <Alert
          severity={renewalError ? "error" : "success"}
          sx={{ mt: 2 }}
        >
          {renewalError || renewalMessage}
        </Alert>
      )}

      {["ACTIVE", "EXPIRED", "CANCELLED"].includes(
        subscription.status.toUpperCase()
      ) && (onRenew || onCancel) && (
        <Box
          sx={{
            mt: 2.5,
            display: "flex",
            alignItems: { xs: "stretch", sm: "flex-end" },
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          {!subscription.canRenew &&
            subscription.renewalAvailableAt && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign={{ xs: "left", sm: "right" }}
              >
                Renewal will be available from{" "}
                {formatSubscriptionDate(
                  subscription.renewalAvailableAt
                )}.
              </Typography>
            )}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="flex-end"
          >
            {subscription.canCancel && onCancel && (
              <Button
                color="error"
                variant="outlined"
                onClick={onCancel}
                disabled={renewing || cancelling}
              >
                Cancel subscription
              </Button>
            )}
            {onRenew && (
              <Button
                variant="contained"
                onClick={onRenew}
                disabled={
                  renewing ||
                  cancelling ||
                  !subscription.canRenew
                }
              >
                {renewing
                  ? "Processing renewal..."
                  : "Renew subscription"}
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default SubscriptionStatusCard;
