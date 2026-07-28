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
    <Stack spacing={2}>
      <Typography variant="h6">{title}</Typography>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Detail label="Plan name">
          {subscription.planName || "Not available"}
        </Detail>
        <Detail label="Subscription status">
          <Chip
            label={status.label}
            color={status.color}
            size="small"
          />
        </Detail>
        <Detail label="Start date">
          {formatSubscriptionDate(subscription.startsAt)}
        </Detail>
        <Detail label="Expiry date">
          {formatSubscriptionDate(subscription.expiresAt)}
        </Detail>
        <Detail label="Days remaining">
          {normalizeDaysRemaining(subscription.daysRemaining)}
        </Detail>
        <Detail label="Amount paid">
          {formatSubscriptionAmount(
            subscription.amountPaid,
            subscription.currency
          )}
        </Detail>
      </Grid>
    </Stack>
  );
};

export default SubscriptionStatusCard;
