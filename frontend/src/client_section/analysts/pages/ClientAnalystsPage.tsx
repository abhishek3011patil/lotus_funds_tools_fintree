import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Pagination,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AnalystCard from "../components/AnalystCard";
import BrokerCard from "../components/BrokerCard";
import MarketplaceProfileDialog from "../components/MarketplaceProfileDialog";
import AnalystSearch from "../components/AnalystSearch";
import {
  cancelAnalystSubscription,
  cancelBrokerSubscription,
  createAnalystOrder,
  createBrokerOrder,
  fetchClientAnalysts,
  fetchClientBrokers,
  verifyAnalystPayment,
  verifyBrokerPayment,
} from "../api";
import { openAnalystCheckout } from "../razorpay";
import type { ClientAnalyst, ClientBroker } from "../types";
import { ClientAnalystsSkeleton } from "../../components/ClientPageSkeletons";

const getErrorMessage = (error: unknown) => {
  const responseMessage = (
    error as { response?: { data?: { message?: string } } }
  )?.response?.data?.message;
  return responseMessage || (error instanceof Error ? error.message : "Something went wrong.");
};

const ClientAnalystsPage = () => {
  const [analysts, setAnalysts] = useState<ClientAnalyst[]>([]);
  const [brokers, setBrokers] = useState<ClientBroker[]>([]);
  const [marketplaceType, setMarketplaceType] = useState<"analysts" | "brokers">("analysts");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileSelection, setProfileSelection] = useState<{
    type: "analyst" | "broker"; id: string; name: string;
  } | null>(null);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === debouncedSearch) return;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      setPage(1);
      setDebouncedSearch(normalizedSearch);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();

    const request = marketplaceType === "analysts"
      ? fetchClientAnalysts(debouncedSearch, page, controller.signal)
      : fetchClientBrokers(debouncedSearch, page, controller.signal);

    request
      .then((result) => {
        if ("analysts" in result) setAnalysts(result.analysts);
        else setBrokers(result.brokers);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((requestError) => {
        if ((requestError as { code?: string }).code !== "ERR_CANCELED") {
          setError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, page, marketplaceType]);

  const handleSubscribe = async (analyst: ClientAnalyst) => {
    setSubscribingId(analyst.id);
    setError(null);
    try {
      const order = await createAnalystOrder(analyst.id);
      const payment = await openAnalystCheckout(order);
      await verifyAnalystPayment(payment);
      setAnalysts((current) =>
        current.map((item) =>
          item.id === analyst.id ? { ...item, isSubscribed: true } : item
        )
      );
      setNotice(`You are now subscribed to ${analyst.name}.`);
    } catch (subscribeError) {
      const message = getErrorMessage(subscribeError);
      if (message !== "Razorpay Checkout was closed.") setError(message);
    } finally {
      setSubscribingId(null);
    }
  };

  const handleBrokerSubscribe = async (broker: ClientBroker) => {
    setSubscribingId(broker.id); setError(null);
    try {
      const order = await createBrokerOrder(broker.id);
      const payment = await openAnalystCheckout(order);
      await verifyBrokerPayment(payment);
      setBrokers(current => current.map(item => item.id === broker.id ? { ...item, isSubscribed: true } : item));
      setNotice(`You are now subscribed to ${broker.name}.`);
    } catch (subscribeError) {
      const message = getErrorMessage(subscribeError);
      if (message !== "Razorpay Checkout was closed.") setError(message);
    } finally { setSubscribingId(null); }
  };

  const handleBrokerCancel = async (broker: ClientBroker) => {
    if (!window.confirm(`Cancel your subscription to ${broker.name}? You will immediately lose access to its analysts' calls.`)) return;
    setCancellingId(broker.id); setError(null);
    try {
      await cancelBrokerSubscription(broker.id);
      setBrokers(current => current.map(item => item.id === broker.id ? { ...item, isSubscribed: false, subscriptionExpiresAt: null } : item));
      setNotice(`Your subscription to ${broker.name} was cancelled.`);
    } catch (cancelError) { setError(getErrorMessage(cancelError)); }
    finally { setCancellingId(null); }
  };

  const handleCancel = async (analyst: ClientAnalyst) => {
    const confirmed = window.confirm(
      `Cancel your subscription to ${analyst.name}? You will immediately lose access to this analyst's calls.`
    );
    if (!confirmed) return;

    setCancellingId(analyst.id);
    setError(null);
    try {
      await cancelAnalystSubscription(analyst.id);
      setAnalysts((current) =>
        current.map((item) =>
          item.id === analyst.id
            ? { ...item, isSubscribed: false, subscriptionExpiresAt: null }
            : item
        )
      );
      setNotice(`Your subscription to ${analyst.name} was cancelled.`);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "flex-end" }}
        spacing={2.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{ color: "#172033", fontSize: { xs: 26, md: 32 }, fontWeight: 800 }}
          >
            Marketplace
          </Typography>
          <Typography sx={{ color: "#64748B", mt: 0.6 }}>
            Discover verified Research Analysts and brokers, then subscribe securely through Razorpay.
          </Typography>
        </Box>
        <Box sx={{ width: { xs: "100%", md: 560 } }}>
          <AnalystSearch value={search} onChange={setSearch} marketplaceType={marketplaceType} />
        </Box>
      </Stack>

      <ToggleButtonGroup
        exclusive
        value={marketplaceType}
        onChange={(_event, value: "analysts" | "brokers" | null) => {
          if (!value) return;
          setMarketplaceType(value); setPage(1); setLoading(true); setError(null);
        }}
        aria-label="Marketplace category"
        sx={{ mb: 3, bgcolor: "#FFF", "& .MuiToggleButton-root": { px: 3, py: 1, textTransform: "none", fontWeight: 750 } }}
      >
        <ToggleButton value="analysts">Research Analysts</ToggleButton>
        <ToggleButton value="brokers">Brokers</ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {!loading && (
        <Typography sx={{ color: "#64748B", fontSize: 13.5, mb: 1.75 }}>
          {total} verified {marketplaceType === "analysts" ? `analyst${total === 1 ? "" : "s"}` : `broker${total === 1 ? "" : "s"}`}
        </Typography>
      )}

      {loading ? (
        <ClientAnalystsSkeleton />
      ) : (marketplaceType === "analysts" ? analysts.length === 0 : brokers.length === 0) ? (
        <Box
          sx={{
            minHeight: 280,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            bgcolor: "#FFFFFF",
            border: "1px dashed #CBD5E1",
            borderRadius: "18px",
            px: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
              No {marketplaceType === "analysts" ? "analysts" : "brokers"} found
            </Typography>
            <Typography sx={{ color: "#64748B", mt: 0.5 }}>
              Try another name, category, market, or SEBI registration number.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2.25,
          }}
        >
          {marketplaceType === "analysts"
            ? analysts.map((analyst) => <AnalystCard key={analyst.id} analyst={analyst} subscribing={subscribingId === analyst.id} cancelling={cancellingId === analyst.id} onSubscribe={handleSubscribe} onCancel={handleCancel} onViewProfile={(item) => setProfileSelection({ type: "analyst", id: item.id, name: item.name })} />)
            : brokers.map((broker) => <BrokerCard key={broker.id} broker={broker} subscribing={subscribingId === broker.id} cancelling={cancellingId === broker.id} onSubscribe={handleBrokerSubscribe} onCancel={handleBrokerCancel} onViewProfile={(item) => setProfileSelection({ type: "broker", id: item.id, name: item.name })} />)}
        </Box>
      )}

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, nextPage) => {
              setLoading(true);
              setError(null);
              setPage(nextPage);
            }}
            color="primary"
          />
        </Stack>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        message={notice}
      />
      <MarketplaceProfileDialog selection={profileSelection} onClose={() => setProfileSelection(null)} />
    </Box>
  );
};

export default ClientAnalystsPage;
