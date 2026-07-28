import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { SubscriptionStatusCard } from "../../subscription";
import type {
  CurrentSubscriptionResponse,
  SubscriptionDetails,
} from "../../../types/subscription";
import api from "../../../utils/axio";

const RASubscriptionStatus = () => {
  const [subscription, setSubscription] =
    useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <SubscriptionStatusCard
      subscription={subscription}
      loading={loading}
      error={error}
      onRetry={loadSubscription}
      title="5. Subscription Status"
    />
  );
};

export default RASubscriptionStatus;
