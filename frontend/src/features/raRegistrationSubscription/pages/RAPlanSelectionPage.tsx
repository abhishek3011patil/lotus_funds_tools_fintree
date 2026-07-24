import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createRARegistrationPaymentOrder,
  getRAPlans,
  RegistrationApiError,
  selectRAPlan,
  verifyRARegistrationPayment,
} from "../api";
import RAPlanCard from "../components/RAPlanCard";
import RARegistrationFlowLayout from "../components/RARegistrationFlowLayout";
import RARegistrationSessionGuard from "../components/RARegistrationSessionGuard";
import {
  getRARegistrationSession,
  setRAPaymentStatus,
  setRASelectedPlanId,
} from "../session";
import {
  openRARegistrationCheckout,
  RazorpayCheckoutError,
} from "../razorpay";
import type {
  RAPlan,
  RARegistrationSession,
} from "../types";

interface Feedback {
  severity: "error" | "warning" | "info";
  message: string;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException &&
  error.name === "AbortError";

const getErrorMessage = (
  error: unknown,
  fallback: string
): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : fallback;

const RAPlanSelectionContent = ({
  session,
}: {
  session: RARegistrationSession;
}) => {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const actionControllerRef =
    useRef<AbortController | null>(null);
  const [plans, setPlans] = useState<RAPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planLoadError, setPlanLoadError] = useState<
    string | null
  >(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<
    string | null
  >(session.selectedPlanId ?? null);
  const [processingPlanId, setProcessingPlanId] =
    useState<string | null>(null);
  const [feedback, setFeedback] =
    useState<Feedback | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      actionControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (
      session.paymentStatus ===
      "PAID_PENDING_APPROVAL"
    ) {
      navigate("/registration/under-review", {
        replace: true,
      });
    }
  }, [navigate, session.paymentStatus]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoadingPlans(true);
    setPlanLoadError(null);

    void getRAPlans(controller.signal)
      .then((result) => {
        if (!active || !mountedRef.current) {
          return;
        }

        setPlans(result);
        setLoadingPlans(false);
      })
      .catch((error: unknown) => {
        if (
          !active ||
          !mountedRef.current ||
          isAbortError(error)
        ) {
          return;
        }

        setPlans([]);
        setLoadingPlans(false);
        setPlanLoadError(
          getErrorMessage(
            error,
            "Unable to load Research Analyst plans."
          )
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadCount]);

  const retryPlanLoad = useCallback(() => {
    setReloadCount((value) => value + 1);
  }, []);

  const handleChoosePlan = useCallback(
    async (plan: RAPlan) => {
      if (processingRef.current) {
        return;
      }

      const latestSession = getRARegistrationSession();
      if (
        latestSession?.paymentStatus ===
        "PAID_PENDING_APPROVAL"
      ) {
        navigate("/registration/under-review", {
          replace: true,
        });
        return;
      }

      processingRef.current = true;
      const controller = new AbortController();
      actionControllerRef.current = controller;

      if (mountedRef.current) {
        setProcessingPlanId(plan.id);
        setFeedback(null);
      }

      try {
  const storedSession =
    getRARegistrationSession();

  const isRetryingSelectedPlan =
    storedSession?.selectedPlanId ===
    plan.id;

  if (!isRetryingSelectedPlan) {
    await selectRAPlan(
      session.applicationId,
      session.registrationToken,
      plan.id,
      controller.signal
    );

    setRASelectedPlanId(plan.id);

    if (mountedRef.current) {
      setSelectedPlanId(plan.id);
    }
  }

  let orderResponse;

  try {
    orderResponse =
      await createRARegistrationPaymentOrder(
        session.applicationId,
        session.registrationToken,
        controller.signal
      );
  } catch (error) {
    const latestStoredSession =
      getRARegistrationSession();

    if (
      latestStoredSession?.paymentStatus ===
      "PAID_PENDING_APPROVAL"
    ) {
      navigate(
        "/registration/under-review",
        {
          replace: true,
        }
      );
      return;
    }

    throw error;
  }

  const razorpayResult =
    await openRARegistrationCheckout(
      orderResponse
    );

  const verification =
    await verifyRARegistrationPayment(
      session.applicationId,
      session.registrationToken,
      razorpayResult,
      controller.signal
    );

  if (
    verification.registrationStatus !==
    "PAID_PENDING_APPROVAL"
  ) {
    throw new RegistrationApiError(
      "The payment was received, but the server did not confirm the registration status. Please contact support before paying again.",
      200,
      "INVALID_PAYMENT_VERIFICATION_RESPONSE",
      verification
    );
  }

  setRAPaymentStatus(
    "PAID_PENDING_APPROVAL"
  );

  navigate(
    "/registration/under-review",
    {
      replace: true,
    }
  );
}

      catch (error: unknown) {
        if (
          isAbortError(error) ||
          !mountedRef.current
        ) {
          return;
        }

        if (
          error instanceof RazorpayCheckoutError &&
          error.code === "MODAL_DISMISSED"
        ) {
          setFeedback({
            severity: "info",
            message: error.message,
          });
        } else if (
          error instanceof RazorpayCheckoutError &&
          error.code === "PAYMENT_FAILED"
        ) {
          setFeedback({
            severity: "error",
            message: error.message,
          });
        } else {
          setFeedback({
            severity:
              error instanceof RegistrationApiError &&
              error.status === 409
                ? "warning"
                : "error",
            message: getErrorMessage(
              error,
              "Unable to start or verify the payment. Please try again."
            ),
          });
        }
      } finally {
        if (actionControllerRef.current === controller) {
          actionControllerRef.current = null;
        }
        processingRef.current = false;

        if (mountedRef.current) {
          setProcessingPlanId(null);
        }
      }
    },
    [
      navigate,
      session.applicationId,
      session.registrationToken,
    ]
  );

  return (
    <RARegistrationFlowLayout
      title="Choose your Research Analyst plan"
      subtitle="Select a current annual plan, then complete secure payment. Your account remains inactive until Admin review and password setup."
      stepText="Step 2 of 3 · Subscription and payment"
    >
      <Stack spacing={3}>
        {feedback && (
          <Alert
            severity={feedback.severity}
            onClose={() => setFeedback(null)}
            aria-live="polite"
          >
            {feedback.message}
          </Alert>
        )}

        {loadingPlans && (
          <Stack
            alignItems="center"
            spacing={1.5}
            sx={{ py: 8 }}
            role="status"
            aria-live="polite"
          >
            <CircularProgress size={34} />
            <Typography color="text.secondary">
              Loading current Research Analyst plans…
            </Typography>
          </Stack>
        )}

        {!loadingPlans && planLoadError && (
          <Stack spacing={2} alignItems="flex-start">
            <Alert severity="error">
              {planLoadError}
            </Alert>
            <Button
              variant="contained"
              onClick={retryPlanLoad}
            >
              Retry loading plans
            </Button>
          </Stack>
        )}

        {!loadingPlans &&
          !planLoadError &&
          plans.length === 0 && (
            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="info">
                No current Research Analyst plans are
                available. Please try again later.
              </Alert>
              <Button
                variant="outlined"
                onClick={retryPlanLoad}
              >
                Check again
              </Button>
            </Stack>
          )}

        {!loadingPlans &&
          !planLoadError &&
          plans.length > 0 && (
            <>
              <Alert severity="info">
                Payment is verified by the server before your
                application moves to Admin review.
              </Alert>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    lg: `repeat(${Math.min(
                      plans.length,
                      3
                    )}, minmax(0, 1fr))`,
                  },
                  gap: 3,
                  alignItems: "stretch",
                }}
              >
                {plans.map((plan) => (
                  <RAPlanCard
                    key={plan.id}
                    plan={plan}
                    selected={selectedPlanId === plan.id}
                    loading={processingPlanId === plan.id}
                    disabled={processingPlanId !== null}
                    onChoose={() => {
                      void handleChoosePlan(plan);
                    }}
                  />
                ))}
              </Box>
            </>
          )}
      </Stack>
    </RARegistrationFlowLayout>
  );
};

const RAPlanSelectionPage = () => (
  <RARegistrationSessionGuard>
    {(session) => (
      <RAPlanSelectionContent session={session} />
    )}
  </RARegistrationSessionGuard>
);

export default RAPlanSelectionPage;
