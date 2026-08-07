import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { SubscriptionStatusCard } from "../../subscription";
import SubscriptionCancellationDialog from "../../subscription/SubscriptionCancellationDialog";
import type {
  CurrentSubscriptionResponse,
  SubscriptionDetails,
} from "../../../types/subscription";
import api from "../../../utils/axio";
import { openRARegistrationCheckout } from "../../../features/raRegistrationSubscription/razorpay";
import {
  createRenewalOrder,
  closeRenewalOrder,
  verifyRenewalPayment,
} from "../../../features/subscriptionRenewal/api";
import {
  cancelSubscription,
} from "../../../features/subscriptionCancellation/api";

const RASubscriptionStatus = () => {
  const [subscription, setSubscription] =
    useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewalMessage, setRenewalMessage] =
    useState<string | null>(null);
  const [renewalError, setRenewalError] =
    useState<string | null>(null);
  const [cancellationOpen, setCancellationOpen] =
    useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] =
    useState<string | null>(null);
  const requestId = useRef(0);

  const loadSubscription = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<CurrentSubscriptionResponse>(
        "/subscriptions/me"
      );

      if (currentRequest !== requestId.current) return;

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load subscription status."
        );
      }

      setSubscription(response.data.subscription);
    } catch (requestError: unknown) {
      if (currentRequest !== requestId.current) return;

      const message = axios.isAxiosError<CurrentSubscriptionResponse>(
        requestError
      )
        ? requestError.response?.data?.message
        : requestError instanceof Error
          ? requestError.message
          : null;

      setError(message || "Unable to load subscription status.");
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubscription();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestId.current += 1;
    };
  }, [loadSubscription]);

  const renewSubscription = useCallback(async () => {
    if (renewing) return;

    setRenewing(true);
    setRenewalMessage(null);
    setRenewalError(null);

    try {
      const orderResponse = await createRenewalOrder();
      const payment = await openRARegistrationCheckout(
        orderResponse.data,
        async (razorpayOrderId) => {
          await closeRenewalOrder(
            orderResponse.data.order.localOrderId,
            razorpayOrderId
          );
        }
      );
      const verification = await verifyRenewalPayment(
        orderResponse.data.order.localOrderId,
        payment
      );

      setRenewalMessage(
        verification.data.message ||
          "Subscription renewed successfully."
      );
      await loadSubscription();
      window.dispatchEvent(
        new Event("subscription:updated")
      );
    } catch (renewalRequestError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(
        renewalRequestError
      )
        ? renewalRequestError.response?.data?.message
        : renewalRequestError instanceof Error
          ? renewalRequestError.message
          : null;

      setRenewalError(
        message || "Unable to renew the subscription."
      );
    } finally {
      setRenewing(false);
    }
  }, [loadSubscription, renewing]);

  const confirmCancellation = useCallback(
    async (reason: string, confirmation: string) => {
      if (cancelling) return;

      setCancelling(true);
      setCancellationError(null);
      setRenewalMessage(null);
      setRenewalError(null);

      try {
        const response = await cancelSubscription(
          reason,
          confirmation
        );
        setCancellationOpen(false);
        setRenewalMessage(
          response.data.message ||
            "Subscription cancelled successfully."
        );
        await loadSubscription();
        window.dispatchEvent(
          new Event("subscription:updated")
        );
      } catch (cancellationRequestError: unknown) {
        const message = axios.isAxiosError<{ message?: string }>(
          cancellationRequestError
        )
          ? cancellationRequestError.response?.data?.message
          : cancellationRequestError instanceof Error
            ? cancellationRequestError.message
            : null;

        setCancellationError(
          message || "Unable to cancel the subscription."
        );
      } finally {
        setCancelling(false);
      }
    },
    [cancelling, loadSubscription]
  );

  return (
    <>
      <SubscriptionStatusCard
        subscription={subscription}
        loading={loading}
        error={error}
        onRetry={loadSubscription}
        onRenew={renewSubscription}
        onCancel={() => {
          setCancellationError(null);
          setCancellationOpen(true);
        }}
        renewing={renewing}
        cancelling={cancelling}
        renewalMessage={renewalMessage}
        renewalError={renewalError}
        title="5. Subscription Status"
      />
      <SubscriptionCancellationDialog
        open={cancellationOpen}
        loading={cancelling}
        error={cancellationError}
        onClose={() => {
          setCancellationOpen(false);
          setCancellationError(null);
        }}
        onConfirm={confirmCancellation}
      />
    </>
  );
};

export default RASubscriptionStatus;
