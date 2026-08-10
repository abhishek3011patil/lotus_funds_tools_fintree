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
    variant="outlined"
    sx={{
      p: 2,
      minWidth: 0,
      height: "100%",
      borderColor: "#E2E8F0",
      borderRadius: 2,
      boxSizing: "border-box",
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Typography fontWeight={700} fontSize="0.9rem" noWrap>
          {title}
        </Typography>
      </Stack>
      {loading ? (
        <CircularProgress size={18} />
      ) : (
        <Chip size="small" label={status} color={statusColor} />
      )}
    </Stack>
    <Box sx={{ mt: 1.25, minHeight: 42 }}>
      {error ? (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      ) : (
        children
      )}
    </Box>
    {actionLabel && onAction && (
      <Button size="small" onClick={onAction} sx={{ mt: 0.75, px: 0 }}>
        {actionLabel}
      </Button>
    )}
  </Paper>
);

const CallSummaryRow = ({ call }: { call: ResearchCall }) => (
  <Box sx={{ py: 1.25 }}>
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={0.75}
    >
      <Box minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
          <Typography fontWeight={700} fontSize="0.85rem" noWrap>
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
        <Chip size="small" label={call.status || "Unknown"} variant="outlined" />
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
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, borderColor: "#E9E9EE", borderRadius: 2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              RA Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review your calls, delivery channels, and account status.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate("/recommendations")}
            sx={{ whiteSpace: "nowrap", alignSelf: { xs: "stretch", md: "auto" } }}
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
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
          my: 2,
        }}
      >
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
        variant="outlined"
        sx={{ p: { xs: 1, sm: 2 }, borderColor: "#CBD5E1", borderRadius: 2 }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          px={{ xs: 1, sm: 0 }}
          pt={1}
          mb={1}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Research Call History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your primary workspace for reviewing and filtering recommendation history.
            </Typography>
          </Box>
          <TextField
            placeholder="Search symbols..."
            size="small"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ width: { xs: "100%", sm: 260 }, flexShrink: 0 }}
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
          mt: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography fontWeight={700}>Active Calls</Typography>
            <Chip size="small" label={activeCalls.length} color="primary" variant="outlined" />
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

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography fontWeight={700}>Recent Calls</Typography>
            <Typography variant="caption" color="text.secondary">Latest 5</Typography>
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
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, minWidth: 0, gridColumn: { lg: "1 / -1" } }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            mb={1}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsNoneOutlinedIcon color="primary" />
              <Typography fontWeight={700}>Notifications</Typography>
            </Stack>
            <Button size="small" onClick={() => navigate("/notifications")}>
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
                  py={1.1}
                >
                  <Box minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      {!notification.is_read && (
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "primary.main" }} />
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
