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
import api from "../../utils/axio";

export type RenewalAudience = "RA" | "BROKER";
export type RenewalPlan = {
  id: string;
  displayName: string;
  pricePaise: number;
  currency: string;
  durationDays: number;
  features: Array<{ key: string; displayName: string; enabled: boolean }>;
};

type JsonRecord = Record<string, unknown>;

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeRenewalPlan = (value: unknown): RenewalPlan | null => {
  if (!isJsonRecord(value)) return null;
  const price = isJsonRecord(value.price) ? value.price : {};
  const id = String(value.id || "").trim();
  if (!id) return null;

  const features = Array.isArray(value.features)
    ? value.features.flatMap((feature): RenewalPlan["features"] => {
        if (!isJsonRecord(feature)) return [];
        const key = String(feature.key || "").trim();
        return [{
          key,
          displayName: String(feature.name || feature.displayName || key || "Feature"),
          enabled: feature.enabled !== false,
        }];
      })
    : [];

  return {
    id,
    displayName: String(value.displayName || value.planCode || "Subscription plan"),
    pricePaise: Number(price.amountPaise ?? value.pricePaise ?? 0),
    currency: String(price.currency || value.currency || "INR"),
    durationDays: Number(value.durationDays || 0),
    features,
  };
};

interface RenewalPlanDialogProps {
  open: boolean;
  processingPlanId: string | null;
  currentPlanName?: string | null;
  audienceType?: RenewalAudience;
  onClose: () => void;
  onChoose: (plan: RenewalPlan) => void;
}

const formatPrice = (plan: RenewalPlan) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: plan.pricePaise % 100 === 0 ? 0 : 2,
  }).format(plan.pricePaise / 100);

const RenewalPlanDialog = ({
  open,
  processingPlanId,
  currentPlanName,
  audienceType = "RA",
  onClose,
  onChoose,
}: RenewalPlanDialogProps) => {
  const [plans, setPlans] = useState<RenewalPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void api.get<{ plans?: unknown[] }>("/subscription-plans", {
        params: { audienceType },
        signal: controller.signal,
      })
        .then(({ data }) => setPlans(
          (data.plans || [])
            .map(normalizeRenewalPlan)
            .filter((plan): plan is RenewalPlan => plan !== null)
        ))
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setPlans([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : `Unable to load ${audienceType === "BROKER" ? "Broker" : "Research Analyst"} plans.`
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
  }, [audienceType, open, reloadCount]);

  return (
    <Dialog open={open} onClose={processingPlanId ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 800 }}>Renew subscription</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Choose an available {audienceType === "BROKER" ? "Broker" : "Research Analyst"} tier for your renewal.
        </Typography>

        <Tabs value={audienceType} aria-label="Subscription audiences" sx={{ mb: 3 }}>
          <Tab value="RA" label="Research Analyst" disabled={audienceType !== "RA"} />
          <Tab value="BROKER" label="Broker" disabled={audienceType !== "BROKER"} />
          <Tab value="CLIENT" label="Client" disabled />
        </Tabs>

        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 7 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading {audienceType === "BROKER" ? "Broker" : "RA"} tiers...</Typography>
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
          <Alert severity="info">No {audienceType === "BROKER" ? "Broker" : "Research Analyst"} plans are currently available.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processingPlanId !== null}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenewalPlanDialog;
