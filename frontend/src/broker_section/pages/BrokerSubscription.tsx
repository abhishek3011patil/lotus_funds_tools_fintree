import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { SubscriptionStatusCard } from "../../components/subscription";
import SubscriptionCancellationDialog from "../../components/subscription/SubscriptionCancellationDialog";
import { cancelSubscription } from "../../features/subscriptionCancellation/api";
import { openRARegistrationCheckout } from "../../features/raRegistrationSubscription/razorpay";
import {
  closeRenewalOrder,
  createRenewalOrder,
  verifyRenewalPayment,
} from "../../features/subscriptionRenewal/api";
import RenewalPlanDialog, { type RenewalPlan } from "../../features/subscriptionRenewal/RenewalPlanDialog";
import type { SubscriptionDetails } from "../../types/subscription";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { getMyBrokerSubscription } from "../services/brokerAccount.service";

const BrokerSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const [renewalPlansOpen, setRenewalPlansOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      setSubscription((await getMyBrokerSubscription()).subscription);
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || "Unable to load subscription."
        : "Unable to load subscription.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authenticated subscription data when the page opens.
    void loadSubscription();
  }, [loadSubscription]);

  const confirmCancellation = useCallback(async (reason: string, confirmation: string) => {
    if (cancelling) return;
    setCancelling(true);
    setCancellationError(null);
    setMessage(null);
    try {
      const response = await cancelSubscription(reason, confirmation);
      setCancellationOpen(false);
      setMessage(response.data.message || "Subscription cancelled successfully.");
      await loadSubscription();
      window.dispatchEvent(new Event("subscription:updated"));
    } catch (requestError) {
      setCancellationError(
        axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message || "Unable to cancel the subscription."
          : "Unable to cancel the subscription."
      );
    } finally {
      setCancelling(false);
    }
  }, [cancelling, loadSubscription]);

  const renewSubscription = useCallback(async (plan: RenewalPlan) => {
    if (renewing) return;
    setRenewing(true);
    setProcessingPlanId(plan.id);
    setMessage(null);
    setRenewalError(null);
    try {
      const orderResponse = await createRenewalOrder(plan.id);
      const payment = await openRARegistrationCheckout(
        orderResponse.data,
        async (razorpayOrderId) => {
          await closeRenewalOrder(orderResponse.data.order.localOrderId, razorpayOrderId);
        }
      );
      const verification = await verifyRenewalPayment(
        orderResponse.data.order.localOrderId,
        payment
      );
      setMessage(verification.data.message || "Subscription renewed successfully.");
      setRenewalPlansOpen(false);
      await loadSubscription();
      window.dispatchEvent(new Event("subscription:updated"));
    } catch (requestError) {
      setRenewalError(
        axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message || "Unable to renew the subscription."
          : requestError instanceof Error
            ? requestError.message
            : "Unable to renew the subscription."
      );
    } finally {
      setRenewing(false);
      setProcessingPlanId(null);
    }
  }, [loadSubscription, renewing]);

  return <Box>
    <BrokerPageHeader title="Subscription" subtitle="Current Broker plan and included features." readOnly />
    {loading && <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}><CircularProgress /></Box>}
    {!loading && error && <Alert severity="error" action={<Button color="inherit" onClick={() => { setLoading(true); setError(null); void loadSubscription(); }}>Retry</Button>}>{error}</Alert>}
    {!loading && !error && <SubscriptionStatusCard
      subscription={subscription}
      title="Broker subscription status"
      onRenew={() => setRenewalPlansOpen(true)}
      onCancel={() => {
        setCancellationError(null);
        setCancellationOpen(true);
      }}
      cancelling={cancelling}
      renewing={renewing}
      renewalMessage={message}
      renewalError={renewalError}
    />}
    <RenewalPlanDialog
      open={renewalPlansOpen}
      audienceType="BROKER"
      processingPlanId={processingPlanId}
      currentPlanName={subscription?.planName}
      onClose={() => setRenewalPlansOpen(false)}
      onChoose={(plan) => void renewSubscription(plan)}
    />
    <SubscriptionCancellationDialog
      open={cancellationOpen}
      loading={cancelling}
      error={cancellationError}
      accountType="BROKER"
      onClose={() => {
        setCancellationOpen(false);
        setCancellationError(null);
      }}
      onConfirm={confirmCancellation}
    />
  </Box>;
};

export default BrokerSubscription;
