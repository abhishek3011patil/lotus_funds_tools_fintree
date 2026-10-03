import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { SubscriptionStatusCard } from "../../components/subscription";
import type { SubscriptionDetails } from "../../types/subscription";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { getMyBrokerSubscription } from "../services/brokerAccount.service";

const BrokerSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return <Box>
    <BrokerPageHeader title="Subscription" subtitle="Current Broker plan and included features." readOnly />
    {loading && <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}><CircularProgress /></Box>}
    {!loading && error && <Alert severity="error" action={<Button color="inherit" onClick={() => { setLoading(true); setError(null); void loadSubscription(); }}>Retry</Button>}>{error}</Alert>}
    {!loading && !error && <SubscriptionStatusCard subscription={subscription} title="Broker subscription status" />}
  </Box>;
};

export default BrokerSubscription;
