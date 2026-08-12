import { useEffect, useState } from "react";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import OnlinePredictionRoundedIcon from "@mui/icons-material/OnlinePredictionRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchClientDashboard } from "../api";
import type { ClientDashboardResponse } from "../types";
import DashboardStatCard from "../components/DashboardStatCard";
import DiscoverAnalystsPanel from "../components/DiscoverAnalystsPanel";
import RecentCallsPanel from "../components/RecentCallsPanel";
import SubscriptionsPanel from "../components/SubscriptionsPanel";
import { ExpiringPanel, NotificationsPanel } from "../components/DashboardSidePanels";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ClientDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchClientDashboard(controller.signal)
      .then(setDashboard)
      .catch((requestError) => {
        if ((requestError as { code?: string }).code !== "ERR_CANCELED") {
          setError(requestError.response?.data?.message || "Unable to load your dashboard.");
        }
      });
    return () => controller.abort();
  }, []);

  if (!dashboard && !error) {
    return <Box sx={{ minHeight: 520, display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: "#5271FF" }} /></Box>;
  }

  if (!dashboard) return <Alert severity="error">{error}</Alert>;

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
