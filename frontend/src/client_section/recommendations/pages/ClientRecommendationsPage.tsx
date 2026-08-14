import { useEffect, useState } from "react";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import SubscriptionsRoundedIcon from "@mui/icons-material/SubscriptionsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createAnalystOrder, verifyAnalystPayment } from "../../analysts/api";
import { openAnalystCheckout } from "../../analysts/razorpay";
import RecommendationCard from "../components/RecommendationCard";
import RecommendationDetailsDialog from "../components/RecommendationDetailsDialog";
import { fetchRecommendationsFeed } from "../api";
import type {
  ClientRecommendationCall,
  FeedPage,
  RecommendationStatus,
} from "../types";

const emptyPage: FeedPage = {
  items: [],
  pagination: { page: 1, limit: 6, total: 0, totalPages: 0, hasMore: false },
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || (error instanceof Error ? error.message : "Something went wrong.");

const ClientRecommendationsPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RecommendationStatus>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [raId, setRaId] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [exchange, setExchange] = useState("ALL");
  const [analysts, setAnalysts] = useState<Array<{ id: string; name: string; organization: string | null }>>([]);
  const [subscribed, setSubscribed] = useState<FeedPage>(emptyPage);
  const [discover, setDiscover] = useState<FeedPage>(emptyPage);
  const [selectedCall, setSelectedCall] = useState<ClientRecommendationCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState<"subscribed" | "discover" | null>(null);
  const [subscribingRaId, setSubscribingRaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === debouncedSearch) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setDebouncedSearch(normalizedSearch);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendationsFeed(
      1,
      1,
      status,
      { search: debouncedSearch, raId, action, exchange },
      controller.signal
    )
      .then((result) => {
        setSubscribed(result.subscribed);
        setDiscover(result.discover);
        setAnalysts(result.filters.analysts);
        if (
          raId !== "ALL" &&
          !result.filters.analysts.some((analyst) => analyst.id === raId)
        ) {
          setRaId("ALL");
        }
      })
      .catch((requestError) => {
        if ((requestError as { code?: string }).code !== "ERR_CANCELED") {
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, debouncedSearch, raId, action, exchange]);

  const loadMore = async (section: "subscribed" | "discover") => {
    setLoadingSection(section);
    setError(null);
    try {
      const nextSubscribedPage =
        section === "subscribed"
          ? subscribed.pagination.page + 1
          : subscribed.pagination.page;
      const nextDiscoverPage =
        section === "discover"
          ? discover.pagination.page + 1
          : discover.pagination.page;
      const result = await fetchRecommendationsFeed(
        nextSubscribedPage,
        nextDiscoverPage,
        status,
        { search: debouncedSearch, raId, action, exchange }
      );

      if (section === "subscribed") {
        setSubscribed((current) => ({
          items: [...current.items, ...result.subscribed.items],
          pagination: result.subscribed.pagination,
        }));
      } else {
        setDiscover((current) => ({
          items: [...current.items, ...result.discover.items],
          pagination: result.discover.pagination,
        }));
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoadingSection(null);
    }
  };

  const subscribeToAnalyst = async (call: ClientRecommendationCall) => {
    setSubscribingRaId(call.raId);
    setError(null);
    try {
      const order = await createAnalystOrder(call.raId);
      const payment = await openAnalystCheckout(order);
      await verifyAnalystPayment(payment);
      setLoading(true);
      const result = await fetchRecommendationsFeed(1, 1, status, {
        search: debouncedSearch,
        raId,
        action,
        exchange,
      });
      setSubscribed(result.subscribed);
      setDiscover(result.discover);
      setAnalysts(result.filters.analysts);
      setLoading(false);
    } catch (subscribeError) {
      const message = errorMessage(subscribeError);
      if (message !== "Razorpay Checkout was closed.") setError(message);
    } finally {
      setLoading(false);
      setSubscribingRaId(null);
    }
  };

  const resetFilters = () => {
    setLoading(true);
    setSearch("");
    setDebouncedSearch("");
    setRaId("ALL");
    setAction("ALL");
    setExchange("ALL");
    setStatus("ALL");
  };

  const hasFilters =
    Boolean(search) ||
    raId !== "ALL" ||
    action !== "ALL" ||
    exchange !== "ALL" ||
    status !== "ALL";

  const changeStatus = (
    _event: React.MouseEvent<HTMLElement>,
    value: RecommendationStatus | null
  ) => {
    if (!value || value === status) return;
    setLoading(true);
    setError(null);
    setStatus(value);
  };

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography component="h1" sx={{ color: "#172033", fontSize: { xs: 26, md: 32 }, fontWeight: 800 }}>
            Recommendations
          </Typography>
          <Typography sx={{ color: "#64748B", mt: 0.5 }}>
            Recent research calls from verified analysts, organized by your access.
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          value={status}
          onChange={changeStatus}
          size="small"
          sx={{
            bgcolor: "#FFFFFF",
            "& .MuiToggleButton-root": { px: 2, textTransform: "none", fontWeight: 700 },
            "& .Mui-selected": { color: "#405EE6 !important", bgcolor: "#EEF2FF !important" },
          }}
        >
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="PUBLISHED">Active</ToggleButton>
          <ToggleButton value="CLOSED">Closed</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(260px, 2fr) 1fr 1fr",
            lg: "minmax(320px, 2fr) 1fr 1fr 1fr auto",
          },
          gap: 1.5,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search stock, company or analyst"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "#64748B" }} />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search recommendations" },
          }}
        />

        <FormControl size="small">
          <InputLabel id="analyst-filter-label">Analyst</InputLabel>
          <Select
            labelId="analyst-filter-label"
            label="Analyst"
            value={raId}
            onChange={(event) => {
              setLoading(true);
              setRaId(event.target.value);
            }}
          >
            <MenuItem value="ALL">All analysts</MenuItem>
            {analysts.map((analyst) => (
              <MenuItem key={analyst.id} value={analyst.id}>
                {analyst.name}{analyst.organization ? ` · ${analyst.organization}` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="action-filter-label">Action</InputLabel>
          <Select
            labelId="action-filter-label"
            label="Action"
            value={action}
            onChange={(event) => {
              setLoading(true);
              setAction(event.target.value);
            }}
          >
            <MenuItem value="ALL">All actions</MenuItem>
            <MenuItem value="BUY">Buy</MenuItem>
            <MenuItem value="SELL">Sell</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="exchange-filter-label">Exchange</InputLabel>
          <Select
            labelId="exchange-filter-label"
            label="Exchange"
            value={exchange}
            onChange={(event) => {
              setLoading(true);
              setExchange(event.target.value);
            }}
          >
            <MenuItem value="ALL">All exchanges</MenuItem>
            <MenuItem value="NSE">NSE</MenuItem>
            <MenuItem value="BSE">BSE</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={resetFilters}
          disabled={!hasFilters}
          startIcon={<FilterAltOffRoundedIcon />}
          sx={{ color: "#5271FF", whiteSpace: "nowrap", fontWeight: 700 }}
        >
          Clear
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
          <CircularProgress sx={{ color: "#5271FF" }} />
        </Box>
      ) : (
        <Stack spacing={4.5}>
          <Box component="section">
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
              <SubscriptionsRoundedIcon sx={{ color: "#5271FF" }} />
              <Typography component="h2" sx={{ color: "#172033", fontSize: 21, fontWeight: 800 }}>
                My Subscriptions
              </Typography>
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>
                ({subscribed.pagination.total})
              </Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontSize: 13.5, mb: 2 }}>
              Complete entry, target, stop-loss and analyst notes from RAs you follow.
            </Typography>

            {subscribed.items.length === 0 ? (
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #C7D2FE",
                  borderRadius: "16px",
                  p: { xs: 3, sm: 4 },
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "#172033", fontWeight: 800, fontSize: 17 }}>
                  No subscribed calls yet
                </Typography>
                <Typography sx={{ color: "#64748B", mt: 0.5, mb: 2 }}>
                  Subscribe to a research analyst to unlock their complete call history here.
                </Typography>
                <Button variant="contained" onClick={() => navigate("/client/analysts")} sx={{ bgcolor: "#5271FF", boxShadow: "none" }}>
                  Browse research analysts
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                {subscribed.items.map((call) => (
                  <RecommendationCard key={call.id} call={call} onOpen={setSelectedCall} />
                ))}
              </Box>
            )}

            {subscribed.pagination.hasMore && (
              <Stack alignItems="center" sx={{ mt: 2.5 }}>
                <Button
                  variant="outlined"
                  disabled={loadingSection === "subscribed"}
                  onClick={() => loadMore("subscribed")}
                  sx={{ borderColor: "#5271FF", color: "#405EE6", fontWeight: 700 }}
                >
                  {loadingSection === "subscribed" ? "Loading…" : "Show more subscribed calls"}
                </Button>
              </Stack>
            )}
          </Box>

          <Box component="section" sx={{ bgcolor: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "20px", p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
              <ExploreRoundedIcon sx={{ color: "#22C55E" }} />
              <Typography component="h2" sx={{ color: "#172033", fontSize: 21, fontWeight: 800 }}>
                Discover More
              </Typography>
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>
                ({discover.pagination.total})
              </Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontSize: 13.5, mb: 2 }}>
              Preview recent calls from other analysts. Subscribe to unlock trade levels and research notes.
            </Typography>

            {discover.items.length === 0 ? (
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #C7D2FE",
                  borderRadius: "14px",
                  py: 4,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "#172033", fontWeight: 800 }}>
                  No matching calls found
                </Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13.5, mt: 0.4 }}>
                  Change or clear the filters to see more recommendations.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                {discover.items.map((call) => (
                  <RecommendationCard
                    key={call.id}
                    call={call}
                    subscribing={subscribingRaId === call.raId}
                    onSubscribe={subscribeToAnalyst}
                  />
                ))}
              </Box>
            )}

            {discover.pagination.hasMore && (
              <Stack alignItems="center" sx={{ mt: 2.5 }}>
                <Button
                  variant="contained"
                  disabled={loadingSection === "discover"}
                  onClick={() => loadMore("discover")}
                  sx={{ bgcolor: "#5271FF", fontWeight: 700, boxShadow: "none", "&:hover": { bgcolor: "#405EE6", boxShadow: "none" } }}
                >
                  {loadingSection === "discover" ? "Loading…" : "Show more recent calls"}
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
      )}

      <RecommendationDetailsDialog call={selectedCall} onClose={() => setSelectedCall(null)} />
    </Box>
  );
};

export default ClientRecommendationsPage;
