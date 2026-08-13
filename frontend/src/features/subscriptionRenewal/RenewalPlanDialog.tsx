import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useEffect, useState } from "react";
import { getRAPlans } from "../raRegistrationSubscription/api";
import type { RAPlan } from "../raRegistrationSubscription/types";

interface RenewalPlanDialogProps {
  open: boolean;
  processingPlanId: string | null;
  currentPlanName?: string | null;
  onClose: () => void;
  onChoose: (plan: RAPlan) => void;
}

const formatPrice = (plan: RAPlan) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: plan.pricePaise % 100 === 0 ? 0 : 2,
  }).format(plan.pricePaise / 100);

const RenewalPlanDialog = ({
  open,
  processingPlanId,
  currentPlanName,
  onClose,
  onChoose,
}: RenewalPlanDialogProps) => {
  const [plans, setPlans] = useState<RAPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void getRAPlans(controller.signal)
        .then(setPlans)
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setPlans([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load Research Analyst plans."
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, reloadCount]);

  return (
    <Dialog open={open} onClose={processingPlanId ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 800 }}>Renew subscription</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Choose one of the three Research Analyst tiers for your renewal.
        </Typography>

        <Tabs value="RA" aria-label="Subscription audiences" sx={{ mb: 3 }}>
          <Tab value="RA" label="Research Analyst" />
          <Tab value="BROKER" label="Broker" disabled />
          <Tab value="CLIENT" label="Client" disabled />
        </Tabs>

        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 7 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading RA tiers...</Typography>
          </Stack>
        )}

        {!loading && error && (
          <Stack spacing={2} alignItems="flex-start">
            <Alert severity="error">{error}</Alert>
            <Button variant="outlined" onClick={() => setReloadCount((value) => value + 1)}>
              Retry
            </Button>
          </Stack>
        )}

        {!loading && !error && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2.5,
            }}
          >
            {plans.map((plan) => {
              const isCurrent = plan.displayName === currentPlanName;
              const isProcessing = processingPlanId === plan.id;
              return (
                <Box
                  key={plan.id}
                  component="article"
                  sx={{
                    border: "1px solid",
                    borderColor: isCurrent ? "primary.main" : "divider",
                    borderRadius: 3,
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 330,
                  }}
                >
                  <Typography variant="h6" fontWeight={800}>{plan.displayName}</Typography>
                  <Typography variant="h4" color="primary.main" fontWeight={800} sx={{ mt: 1.5 }}>
                    {formatPrice(plan)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    for {plan.durationDays} days
                  </Typography>
                  {isCurrent && (
                    <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ mt: 0.75 }}>
                      Current tier
                    </Typography>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    {plan.features.filter((feature) => feature.enabled).slice(0, 4).map((feature) => (
                      <Stack key={feature.key} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 18, mt: "2px" }} />
                        <Typography variant="body2">{feature.displayName}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant={isCurrent ? "outlined" : "contained"}
                    fullWidth
                    disabled={processingPlanId !== null}
                    onClick={() => onChoose(plan)}
                    startIcon={isProcessing ? <CircularProgress size={17} color="inherit" /> : undefined}
                    sx={{ mt: 2.5, minHeight: 44, fontWeight: 750 }}
                  >
                    {isProcessing ? "Opening checkout..." : isCurrent ? "Renew current tier" : "Choose tier"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}

        {!loading && !error && plans.length === 0 && (
          <Alert severity="info">No Research Analyst plans are currently available.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processingPlanId !== null}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenewalPlanDialog;
