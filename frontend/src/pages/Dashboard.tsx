import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  type ChipProps,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CardMembershipOutlinedIcon from "@mui/icons-material/CardMembershipOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TelegramIcon from "@mui/icons-material/Telegram";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { useNavigate } from "react-router-dom";
import RecommendationHistory from "./common/RecommendationHistory";
import api from "../utils/axio";
import type {
  CurrentSubscriptionResponse,
  SubscriptionDetails,
} from "../types/subscription";
import {
  formatSubscriptionDate,
  getSubscriptionStatusPresentation,
  normalizeDaysRemaining,
} from "../components/subscription/subscriptionStatus.utils";
import RAClientsCard from "../components/dashboard/RAClientsCard";

type ResearchCall = {
  id: string;
  status?: string;
  created_at?: string;
  version_type?: string;
  symbol?: string;
  name?: string;
  action?: string;
  entry?: {
    low?: number | string | null;
    ideal?: number | string | null;
    high?: number | string | null;
  };
  targets?: Array<number | string>;
  stop_losses?: Array<number | string>;
};

type RAProfile = {
  account_status?: string | null;
  status?: string | null;
  sebi_reg_no?: string | null;
  sebi_expiry_date?: string | null;
};

type SubscriptionNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

type DashboardStatusCardProps = {
  title: string;
  icon: ReactNode;
  status: string;
  statusColor?: ChipProps["color"];
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const timeAgo = (value?: string | null) => {
  if (!value) return "Recently";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatEntry = (call: ResearchCall) => {
  if (call.entry?.ideal !== null && call.entry?.ideal !== undefined) {
    return String(call.entry.ideal);
  }
  if (call.entry?.low !== null && call.entry?.low !== undefined) {
    return call.entry.high !== null && call.entry.high !== undefined
      ? `${call.entry.low} - ${call.entry.high}`
      : String(call.entry.low);
  }
  return "—";
};

const statusPresentation = (value?: string | null) => {
  const normalized = String(value || "").trim().toUpperCase();
  const color: ChipProps["color"] = ["ACTIVE", "APPROVED"].includes(normalized)
    ? "success"
    : ["SUSPENDED", "EXPIRED", "REJECTED"].includes(normalized)
      ? "error"
      : ["PENDING", "UNDER_REVIEW", "ON_HOLD"].includes(normalized)
        ? "warning"
        : "default";

  return {
    label: normalized
      ? normalized.toLowerCase().replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase())
      : "Status unavailable",
    color,
  };
};

const callStatusChipStyles = (value?: string | null) => {
  const status = String(value || "").trim().toUpperCase();

  if (["ACTIVE", "PUBLISHED"].includes(status)) {
    return {
      bgcolor: "#E8F8EE",
      color: "#187346",
      borderColor: "#B9E8CA",
    };
  }

  if (status === "CLOSED") {
    return {
      bgcolor: "#FFF6DB",
      color: "#8A5A0A",
      borderColor: "#F2D98C",
    };
  }

  if (status === "OPEN") {
    return {
      bgcolor: "#EEF3FF",
      color: "#2952B3",
      borderColor: "#CAD7F7",
    };
  }

  return {
    bgcolor: "#F5F7FA",
    color: "#526075",
    borderColor: "#DDE3EC",
  };
};

const DashboardStatusCard = ({
  title,
  icon,
  status,
  statusColor = "default",
  loading = false,
  error,
  children,
  actionLabel,
  onAction,
}: DashboardStatusCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      minWidth: 0,
      height: "100%",
      border: "1px solid #E7ECF4",
      borderRadius: 3,
      boxSizing: "border-box",
      background: "linear-gradient(145deg, #FFFFFF 0%, #FBFCFF 100%)",
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.045)",
      transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 14px 30px rgba(30, 64, 175, 0.09)",
        borderColor: "#C9D5F2",
      },
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.25,
            color: "primary.main",
            bgcolor: "#EEF3FF",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography fontWeight={750} fontSize="0.9rem" noWrap color="#172033">
          {title}
        </Typography>
      </Stack>
      {loading ? (
        <CircularProgress size={18} />
      ) : (
        <Chip
          size="small"
          label={status}
          color={statusColor}
          sx={{ fontWeight: 650, height: 25, fontSize: "0.7rem" }}
        />
      )}
    </Stack>
    <Box sx={{ mt: 1.5, minHeight: 44 }}>
      {error ? (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      ) : (
        children
      )}
    </Box>
    {actionLabel && onAction && (
      <Button
        size="small"
        onClick={onAction}
        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "1rem !important" }} />}
        sx={{ mt: 0.75, px: 0, py: 0.25, fontWeight: 700 }}
      >
        {actionLabel}
      </Button>
    )}
  </Paper>
);

const CallSummaryRow = ({ call }: { call: ResearchCall }) => (
  <Box
    sx={{
      px: 0.5,
      py: 1.5,
      borderRadius: 2,
      transition: "background-color 160ms ease",
      "&:hover": { bgcolor: "#F8FAFD" },
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={0.75}
    >
      <Box minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
          <Typography fontWeight={750} fontSize="0.88rem" noWrap color="#172033">
            {call.name || call.symbol || "Unknown instrument"}
          </Typography>
          <Chip
            size="small"
            label={call.action || "—"}
            color={String(call.action).toUpperCase() === "BUY" ? "success" : "error"}
            variant="outlined"
          />
          {call.version_type === "ERRATA" && (
            <Chip size="small" label="Errata Issued" color="warning" />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Entry {formatEntry(call)} · Target {call.targets?.[0] ?? "—"} · SL{" "}
          {call.stop_losses?.[0] ?? "—"}
        </Typography>
      </Box>
      <Box sx={{ textAlign: { xs: "left", sm: "right" }, flexShrink: 0 }}>
        <Chip
          size="small"
          label={call.status || "Unknown"}
          variant="outlined"
          sx={{
            ...callStatusChipStyles(call.status),
            height: 25,
            fontSize: "0.7rem",
            fontWeight: 750,
            textTransform: "capitalize",
          }}
        />
        <Typography display="block" variant="caption" color="text.secondary" mt={0.25}>
          {formatDateTime(call.created_at)}
        </Typography>
      </Box>
    </Stack>
  </Box>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [calls, setCalls] = useState<ResearchCall[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramDestinationCount, setTelegramDestinationCount] =
    useState<number | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [profile, setProfile] = useState<RAProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SubscriptionNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCalls = async () => {
      try {
        const response = await api.get<ResearchCall[]>("/research/calls/my");
        if (active) setCalls(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (active) setCallsError("Unable to load your research calls.");
      } finally {
        if (active) setCallsLoading(false);
      }
    };

    const loadTelegram = async () => {
      const [statusResult, participantsResult] = await Promise.allSettled([
        api.get<{ connected: boolean }>("/telegram/status"),
        api.get<{ success: boolean; count: number }>("/telegram/my-participants"),
      ]);

      if (!active) return;
      if (statusResult.status === "fulfilled") {
        setTelegramConnected(Boolean(statusResult.value.data.connected));
      } else {
        setTelegramError("Telegram status is temporarily unavailable.");
      }
      if (participantsResult.status === "fulfilled") {
        setTelegramDestinationCount(Number(participantsResult.value.data.count || 0));
      }
      setTelegramLoading(false);
    };

    const loadProfile = async () => {
      try {
        const response = await api.get<{ success: boolean; data: RAProfile }>(
          "/registration/profile"
        );
        if (active) setProfile(response.data.data || null);
      } catch {
        if (active) setProfileError("Unable to load account details.");
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const response = await api.get<CurrentSubscriptionResponse>(
          "/subscriptions/me"
        );
        if (active) setSubscription(response.data.subscription);
      } catch {
        if (active) setSubscriptionError("Unable to load subscription status.");
      } finally {
        if (active) setSubscriptionLoading(false);
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          notifications: SubscriptionNotification[];
        }>("/subscription-notifications");
        if (active) setNotifications(response.data.notifications || []);
      } catch {
        if (active) setNotificationsError("Unable to load notifications.");
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };

    void loadCalls();
    void loadTelegram();
    void loadProfile();
    void loadSubscription();
    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const recentCalls = useMemo(() => calls.slice(0, 5), [calls]);
  const activeCalls = useMemo(
    () =>
      calls
        .filter((call) =>
          ["ACTIVE", "OPEN", "PUBLISHED"].includes(
            String(call.status || "").toUpperCase()
          )
        )
        .slice(0, 5),
    [calls]
  );
  const accountStatus = statusPresentation(
    profile?.account_status || profile?.status
  );
  const subscriptionStatus = subscription
    ? getSubscriptionStatusPresentation(subscription.status)
    : { label: "Not available", color: "default" as const };

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, sm: 3.5 },
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 3.5,
          color: "#FFFFFF",
          background: "linear-gradient(120deg, #102A72 0%, #1E40AF 55%, #315CCB 100%)",
          boxShadow: "0 18px 40px rgba(30, 64, 175, 0.2)",
          "&::before": {
            content: '""',
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            right: -70,
            top: -150,
            bgcolor: "rgba(255,255,255,0.1)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            right: 140,
            bottom: -120,
            bgcolor: "rgba(112, 150, 255, 0.22)",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.8}>
              <AutoAwesomeOutlinedIcon sx={{ fontSize: "1rem", color: "#BFD0FF" }} />
              <Typography
                variant="overline"
                sx={{ color: "#D8E2FF", letterSpacing: "0.11em", fontWeight: 700, lineHeight: 1 }}
              >
                Research workspace
              </Typography>
            </Stack>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.025em">
              RA Dashboard
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(255,255,255,0.76)", maxWidth: 520 }}>
              Review your calls, delivery channels, and account status.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate("/recommendations")}
            sx={{
              position: "relative",
              zIndex: 1,
              whiteSpace: "nowrap",
              alignSelf: { xs: "stretch", md: "auto" },
              bgcolor: "#FFFFFF",
              color: "#17398F",
              fontWeight: 750,
              px: 2.25,
              py: 1.15,
              borderRadius: 2.25,
              boxShadow: "0 8px 20px rgba(4, 18, 57, 0.18)",
              "&:hover": { bgcolor: "#F4F7FF", boxShadow: "0 10px 24px rgba(4, 18, 57, 0.24)" },
            }}
          >
            Create Research Call
          </Button>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
          my: 2.5,
        }}
      >
        <RAClientsCard />

        <DashboardStatusCard
          title="Telegram"
          icon={<TelegramIcon fontSize="small" />}
          status={telegramConnected ? "Connected" : "Not Connected"}
          statusColor={telegramConnected ? "success" : "error"}
          loading={telegramLoading}
          error={telegramError}
          actionLabel="Manage Telegram"
          onAction={() => navigate("/settings")}
        >
          <Typography variant="body2" color="text.secondary">
            {telegramDestinationCount === null
              ? "Destination count unavailable"
              : `${telegramDestinationCount} configured destination${
                  telegramDestinationCount === 1 ? "" : "s"
                }`}
          </Typography>
        </DashboardStatusCard>

        <DashboardStatusCard
          title="WhatsApp"
          icon={<WhatsAppIcon fontSize="small" />}
          status="Monitoring unavailable"
          actionLabel="Manage WhatsApp"
          onAction={() => navigate("/settings")}
        >
          <Typography variant="body2" color="text.secondary">
            Configured through WhatsApp Settings. Live operational status is not available.
          </Typography>
        </DashboardStatusCard>

        <DashboardStatusCard
          title="Account / SEBI"
          icon={<VerifiedUserOutlinedIcon fontSize="small" />}
          status={accountStatus.label}
          statusColor={accountStatus.color}
          loading={profileLoading}
          error={profileError}
          actionLabel="View Profile"
          onAction={() => navigate("/ra/profile")}
        >
          <Typography variant="body2" color="text.secondary">
            SEBI: {profile?.sebi_reg_no || "Not available"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Expiry: {formatSubscriptionDate(profile?.sebi_expiry_date || null)}
          </Typography>
        </DashboardStatusCard>

        <DashboardStatusCard
          title="Subscription"
          icon={<CardMembershipOutlinedIcon fontSize="small" />}
          status={subscriptionStatus.label}
          statusColor={subscriptionStatus.color}
          loading={subscriptionLoading}
          error={subscriptionError}
          actionLabel="Manage Subscription"
          onAction={() => navigate("/settings")}
        >
          <Typography variant="body2" color="text.secondary">
            {subscription?.planName || "No plan available"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subscription
              ? `${normalizeDaysRemaining(subscription.daysRemaining)} days remaining · Expires ${formatSubscriptionDate(
                  subscription.expiresAt
                )}`
              : "Subscription details unavailable"}
          </Typography>
        </DashboardStatusCard>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 2 },
          border: "1px solid #E2E8F2",
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.045)",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          px={{ xs: 1, sm: 0.5 }}
          pt={1}
          mb={1.5}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.25,
                bgcolor: "#EEF3FF",
                color: "primary.main",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <HistoryRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={750} color="#172033">
                Research Call History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review and filter your complete recommendation history.
              </Typography>
            </Box>
          </Stack>
          <TextField
            placeholder="Search symbols..."
            size="small"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{
              width: { xs: "100%", sm: 280 },
              flexShrink: 0,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.25,
                bgcolor: "#F8FAFD",
                "& fieldset": { borderColor: "#E3E8F0" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <RecommendationHistory
          searchQuery={searchQuery}
          showAllRAs
          enableExport
          exportFileBaseName="ra-dashboard"
        />
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
          mt: 2.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid #E4EAF2",
            borderRadius: 3,
            minWidth: 0,
            boxShadow: "0 8px 26px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#ECFDF3", color: "#15803D", display: "grid", placeItems: "center" }}>
                <BoltRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography fontWeight={750} color="#172033">Active Calls</Typography>
                <Typography variant="caption" color="text.secondary">Currently in the market</Typography>
              </Box>
            </Stack>
            <Chip size="small" label={activeCalls.length} color="success" sx={{ fontWeight: 750 }} />
          </Stack>
          {callsLoading ? (
            <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack>
          ) : callsError ? (
            <Typography variant="body2" color="error.main" py={2}>{callsError}</Typography>
          ) : activeCalls.length === 0 ? (
            <Typography variant="body2" color="text.secondary" py={2}>
              No active calls right now.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {activeCalls.map((call) => <CallSummaryRow key={call.id} call={call} />)}
            </Stack>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid #E4EAF2",
            borderRadius: 3,
            minWidth: 0,
            boxShadow: "0 8px 26px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#EEF3FF", color: "primary.main", display: "grid", placeItems: "center" }}>
                <TrendingUpRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography fontWeight={750} color="#172033">Recent Calls</Typography>
                <Typography variant="caption" color="text.secondary">Latest recommendations</Typography>
              </Box>
            </Stack>
            <Chip size="small" label="Latest 5" variant="outlined" sx={{ fontWeight: 650, borderColor: "#D9E1EC" }} />
          </Stack>
          {callsLoading ? (
            <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack>
          ) : callsError ? (
            <Typography variant="body2" color="error.main" py={2}>{callsError}</Typography>
          ) : recentCalls.length === 0 ? (
            <Typography variant="body2" color="text.secondary" py={2}>
              No research calls found.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {recentCalls.map((call) => <CallSummaryRow key={call.id} call={call} />)}
            </Stack>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid #E4EAF2",
            borderRadius: 3,
            minWidth: 0,
            gridColumn: { lg: "1 / -1" },
            boxShadow: "0 8px 26px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            mb={1}
          >
            <Stack direction="row" alignItems="center" spacing={1.1}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#FFF7E8", color: "#B45309", display: "grid", placeItems: "center" }}>
                <NotificationsNoneOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography fontWeight={750} color="#172033">Notifications</Typography>
                <Typography variant="caption" color="text.secondary">Latest account and subscription updates</Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              onClick={() => navigate("/notifications")}
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "1rem !important" }} />}
              sx={{ fontWeight: 700 }}
            >
              View All Notifications
            </Button>
          </Stack>
          {notificationsLoading ? (
            <Stack alignItems="center" py={3}><CircularProgress size={24} /></Stack>
          ) : notificationsError ? (
            <Typography variant="body2" color="error.main" py={1}>{notificationsError}</Typography>
          ) : notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recent notifications.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {notifications.slice(0, 4).map((notification) => (
                <Stack
                  key={notification.id}
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                  px={0.5}
                  py={1.35}
                  sx={{ borderRadius: 2, "&:hover": { bgcolor: "#F8FAFD" } }}
                >
                  <Box minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      {!notification.is_read && (
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "primary.main", boxShadow: "0 0 0 3px #E8EEFF" }} />
                      )}
                      <Typography fontWeight={notification.is_read ? 500 : 700} fontSize="0.85rem">
                        {notification.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {notification.message}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" flexShrink={0}>
                    {timeAgo(notification.created_at)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
