import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createRegistrationPaymentOrder,
  getSubscriptionPlanById,
  verifyRegistrationPayment,
} from "../api";
import {
  getRegistrationSession,
  getSelectedPlanId,
  savePaymentOrder,
} from "../session";
import {
  openRazorpayCheckout,
  RazorpayCheckoutError,
} from "../razorpay";
import type { SubscriptionPlan } from "../types";

const formatPrice = (
  amountRupees: number,
  currency: string
): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountRupees);

const RegistrationCheckoutPage = () => {
  const navigate = useNavigate();

  const session = useMemo(
    () => getRegistrationSession(),
    []
  );
  const selectedPlanId = useMemo(
    () => getSelectedPlanId(),
    []
  );

  const [plan, setPlan] =
    useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!session || !selectedPlanId) {
      navigate("/register/subscription", {
        replace: true,
      });
      return;
    }

    const controller = new AbortController();

    const loadPlan = async () => {
      try {
        const response =
          await getSubscriptionPlanById(
            selectedPlanId,
            controller.signal
          );
        setPlan(response.plan);
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
            : "Unable to load checkout."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPlan();

    return () => controller.abort();
  }, [navigate, selectedPlanId, session]);

  const handlePayment = async () => {
    if (!session || !plan || paying) {
      return;
    }

    if (plan.price.amountPaise <= 0) {
      setError(
        "This plan does not have a payable price configured."
      );
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const order =
        await createRegistrationPaymentOrder(
          session.applicationId,
          session.registrationToken
        );

      savePaymentOrder(
        order.order.localOrderId,
        order.order.razorpayOrderId
      );

      const payment =
        await openRazorpayCheckout(order);

      /*
       * This endpoint is the next backend task.
       * Do not redirect to success before signature verification.
       */
      await verifyRegistrationPayment(
        session.applicationId,
        session.registrationToken,
        payment
      );

      navigate("/register/payment-success", {
        replace: true,
      });
    } catch (paymentError) {
      if (
        paymentError instanceof
          RazorpayCheckoutError &&
        paymentError.kind === "DISMISSED"
      ) {
        setError(
          "Payment was not completed. You can try again."
        );
        return;
      }

      if (
        paymentError instanceof
          RazorpayCheckoutError &&
        paymentError.kind === "PAYMENT_FAILED"
      ) {
        navigate("/register/payment-failed", {
          state: {
            message: paymentError.message,
          },
        });
        return;
      }

      /*
       * A payment may have succeeded at Razorpay while backend
       * verification is temporarily unavailable. Treat it as
       * pending, never as confirmed success.
       */
      navigate("/register/payment-pending", {
        state: {
          message:
            paymentError instanceof Error
              ? paymentError.message
              : "Payment verification is pending.",
        },
      });
    } finally {
      setPaying(false);
    }
  };

  if (!session || !selectedPlanId) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        px: 2,
        py: { xs: 4, md: 7 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          maxWidth: 680,
          mx: "auto",
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            navigate("/register/subscription")
          }
          sx={{
            textTransform: "none",
            mb: 3,
          }}
        >
          Change plan
        </Button>

        <Typography
          variant="h4"
          sx={{ fontWeight: 800 }}
        >
          Secure checkout
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Review the server-provided plan details
          before opening Razorpay.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {loading ? (
          <Stack spacing={2}>
            <Skeleton width="55%" height={38} />
            <Skeleton width="35%" height={52} />
            <Skeleton height={80} />
          </Stack>
        ) : plan ? (
          <Stack spacing={2.5}>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800 }}
              >
                {plan.displayName}
              </Typography>
              <Typography color="text.secondary">
                {plan.shortDescription}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800 }}
              >
                {formatPrice(
                  plan.price.amountRupees,
                  plan.price.currency
                )}
              </Typography>
              <Typography color="text.secondary">
                {plan.billingPeriod
                  .toLowerCase()
                  .replace("_", " ")}
              </Typography>
            </Box>

            <Alert severity="info">
              Payment does not activate the account
              immediately. After successful verification,
              the registration goes to Admin approval.
              Password setup is allowed only after approval.
            </Alert>

            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Button
              variant="contained"
              size="large"
              disabled={
                paying ||
                plan.price.amountPaise <= 0
              }
              startIcon={
                paying ? (
                  <CircularProgress
                    color="inherit"
                    size={18}
                  />
                ) : (
                  <LockOutlinedIcon />
                )
              }
              onClick={handlePayment}
              sx={{ textTransform: "none", py: 1.4 }}
            >
              {paying
                ? "Processing..."
                : "Pay securely with Razorpay"}
            </Button>

            <Typography
              variant="caption"
              textAlign="center"
              color="text.secondary"
            >
              The payment amount is read from the
              backend plan-selection snapshot. It is
              not calculated from displayed text.
            </Typography>
          </Stack>
        ) : (
          <Alert severity="error">
            The selected plan could not be loaded.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default RegistrationCheckoutPage;
