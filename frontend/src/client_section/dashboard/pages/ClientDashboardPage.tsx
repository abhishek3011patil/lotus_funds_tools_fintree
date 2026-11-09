import { useEffect, useState } from "react";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import OnlinePredictionRoundedIcon from "@mui/icons-material/OnlinePredictionRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchClientDashboard } from "../api";
import type { ClientDashboardResponse } from "../types";
import DashboardStatCard from "../components/DashboardStatCard";
import DiscoverAnalystsPanel from "../components/DiscoverAnalystsPanel";
import RecentCallsPanel from "../components/RecentCallsPanel";
import SubscriptionsPanel from "../components/SubscriptionsPanel";
import { ExpiringPanel, NotificationsPanel } from "../components/DashboardSidePanels";
import { ClientDashboardSkeleton } from "../../components/ClientPageSkeletons";

const ClientDashboardPage = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<ClientDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchClientDashboard(signal);
      setDashboard(data);
    } catch (requestError: any) {
      if (
        requestError.code !== "ERR_CANCELED" &&
        !signal?.aborted
      ) {
        setError(
          requestError.response?.data?.message ||
          "Unable to load your dashboard."
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, []);

  if (loading && !dashboard) {
    return <ClientDashboardSkeleton />;
  }

 if (!dashboard) {
  return (
    <Box
      sx={{
        minHeight: "65vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          bgcolor: "#FFFFFF",
          border: "1px solid #E8ECF3",
          borderRadius: "18px",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
          }}
        >
          <NotificationsRoundedIcon
            sx={{ fontSize: 30, color: "#DC2626" }}
          />
        </Box>

        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 800,
            color: "#172033",
            mb: 1,
          }}
        >
          Unable to load dashboard
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: "#64748B",
            lineHeight: 1.7,
            mb: 3,
          }}
        >{error && error !== "Unable to load your dashboard."
  ? error
  : "We couldn't fetch your dashboard data. Please check your connection and try again."}
          
        </Typography>

        <Button
          variant="contained"
          onClick={() => loadDashboard()}
          disabled={loading}
          sx={{
            bgcolor: "#405EE6",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 14,
            px: 3.5,
            py: 1.2,
            borderRadius: "10px",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#304BC7",
              boxShadow: "0 4px 12px rgba(64, 94, 230, 0.2)",
            },
            "&:disabled": {
              bgcolor: "#A5B4FC",
              color: "#FFFFFF",
            },
          }}
        >
          {loading ? "Retrying..." : "Try Again"}
        </Button>
      </Box>
    </Box>
  );
}

  const firstName = (localStorage.getItem("username") || "Client").split(/[._\s-]/)[0];
  const stats = [
    { label: "Subscribed RAs", value: dashboard.summary.subscribedRaCount, helper: "Active research analysts", icon: GroupsRoundedIcon, color: "#405EE6", background: "#EEF2FF" },
    { label: "New Calls Today", value: dashboard.summary.newCallsToday, helper: "From your subscriptions", icon: TodayRoundedIcon, color: "#15803D", background: "#ECFDF5" },
    { label: "Active Calls", value: dashboard.summary.activeCalls, helper: "Currently published", icon: OnlinePredictionRoundedIcon, color: "#B45309", background: "#FFF7ED" },
    { label: "Unread Notifications", value: dashboard.summary.unreadNotifications, helper: "Account and subscription news", icon: NotificationsRoundedIcon, color: "#BE185D", background: "#FDF2F8" },
  ];

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" sx={{ color: "#172033", fontSize: { xs: 27, md: 32 }, fontWeight: 800, textTransform: "capitalize" }}>
          Welcome back, {firstName}
        </Typography>
        <Typography sx={{ color: "#64748B", mt: 0.45 }}>
          Here’s what’s happening across your research subscriptions.
        </Typography>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2, mb: 2.5 }}>
        {stats.map((stat) => <DashboardStatCard key={stat.label} {...stat} />)}
      </Box>

      <ExpiringPanel expiring={dashboard.expiringSubscriptions} onManage={() => navigate("/client/analysts")} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2.2fr) minmax(280px, .8fr)" }, gap: 2.5, mt: dashboard.expiringSubscriptions.length ? 2.5 : 0, mb: 2.5 }}>
        <RecentCallsPanel calls={dashboard.recentCalls} onViewAll={() => navigate("/client/recommendations")} />
        <Stack spacing={2.5}>
          <SubscriptionsPanel subscriptions={dashboard.subscriptions} onManage={() => navigate("/client/analysts")} />
          <NotificationsPanel notifications={dashboard.notifications} onNotifications={() => navigate("/client/notifications")} />
        </Stack>
      </Box>

      <DiscoverAnalystsPanel analysts={dashboard.discoverAnalysts} onBrowse={() => navigate("/client/analysts")} />
    </Box>
  );
};

export default ClientDashboardPage;
