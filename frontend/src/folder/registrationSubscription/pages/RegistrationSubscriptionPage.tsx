import {
  Alert,
  Box,
  Button,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import SubscriptionPlanCard from "../components/SubscriptionPlanCard";
import {
  getSubscriptionPlans,
  selectRegistrationPlan,
} from "../api";
import {
  getRegistrationSession,
  getRegistrationStartRoute,
  saveSelectedPlan,
} from "../session";
import type { SubscriptionPlan } from "../types";

const LoadingCards = () => (
  <Grid container spacing={3}>
    {[1, 2, 3].map((value) => (
      <Grid item xs={12} md={4} key={value}>
        <Skeleton
          variant="rounded"
          height={480}
          sx={{ borderRadius: 3 }}
        />
      </Grid>
    ))}
  </Grid>
);

const RegistrationSubscriptionPage = () => {
  const navigate = useNavigate();

  const session = useMemo(
    () => getRegistrationSession(),
    []
  );

  const [plans, setPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] =
    useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    null
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate(getRegistrationStartRoute(), {
        replace: true,
      });
    }
  }, [navigate, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const controller = new AbortController();

    const loadPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await getSubscriptionPlans(
            session.audienceType,
            controller.signal
          );

        if (response.plans.length !== 3) {
          throw new Error(
            `Expected 3 ${session.audienceType} plans but received ${response.plans.length}.`
          );
        }

        setPlans(response.plans);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load subscription plans."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();

    return () => controller.abort();
  }, [reloadKey, session]);

  const handleSelectPlan = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!session || processingPlanId) {
        return;
      }

      setProcessingPlanId(plan.id);
      setError(null);

      try {
        const response =
          await selectRegistrationPlan(
            session.applicationId,
            session.registrationToken,
            plan.id
          );

        saveSelectedPlan(
          response.selection.planId,
          response.selection.id
        );

        navigate("/register/checkout");
      } catch (selectionError) {
        setError(
          selectionError instanceof Error
            ? selectionError.message
            : "Unable to select the plan."
        );
      } finally {
        setProcessingPlanId(null);
      }
    },
    [navigate, processingPlanId, session]
  );

  if (!session) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack
          spacing={1.25}
          alignItems="center"
          textAlign="center"
          sx={{ mb: 4 }}
        >
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 800 }}
          >
            {session.audienceType} registration
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: {
                xs: "1.8rem",
                md: "2.5rem",
              },
            }}
          >
            Choose your subscription plan
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ maxWidth: 680 }}
          >
            Select one plan to continue to secure
            payment. The plan names, prices, features,
            and limits shown below come directly from
            the backend.
          </Typography>
        </Stack>

        {error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  setReloadKey((value) => value + 1)
                }
              >
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <LoadingCards />
        ) : (
          <Grid container spacing={3} alignItems="stretch">
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.id}>
                <SubscriptionPlanCard
                  plan={plan}
                  processing={
                    processingPlanId === plan.id
                  }
                  onSelect={handleSelectPlan}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default RegistrationSubscriptionPage;
