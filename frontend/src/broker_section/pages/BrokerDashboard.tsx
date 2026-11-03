import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BadgeIcon from "@mui/icons-material/Badge";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsIcon from "@mui/icons-material/Payments";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CampaignIcon from "@mui/icons-material/Campaign";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import type { SubscriptionDetails } from "../../types/subscription";
import type { BrokerAccount } from "../types/brokerAccount";
import { getMyBrokerAccount, getMyBrokerSubscription } from "../services/brokerAccount.service";
import { getBrokerAnalysts, getBrokerCalls, getBrokerClients, type AssociatedAnalyst } from "../services/brokerOnboarding.service";
import type { ApiHistoryRecord } from "../../pages/common/RecommendationHistory";

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
  : "Not provided";
const normalizedStatus = (status: string | null | undefined) =>
  status?.trim().toUpperCase() || "PENDING";

const MetricCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
  <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h6" fontWeight={700} mt={0.5}>{value}</Typography></Box>
        <Box sx={{ p: 1, height: 40, borderRadius: 2, color, bgcolor: `${color}18` }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const BrokerDashboard = () => {
  const navigate = useNavigate();
  const [broker, setBroker] = useState<BrokerAccount | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [analysts, setAnalysts] = useState<AssociatedAnalyst[]>([]);
  const [calls, setCalls] = useState<ApiHistoryRecord[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [accountResponse, subscriptionResponse, analystResponse, callsResponse, clientsResponse] = await Promise.all([
        getMyBrokerAccount(), getMyBrokerSubscription(), getBrokerAnalysts(), getBrokerCalls(), getBrokerClients(),
      ]);
      setBroker(accountResponse.broker);
      setSubscription(subscriptionResponse.subscription);
      setAnalysts(analystResponse);
      setCalls(callsResponse);
      setClientCount(clientsResponse.length);
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || "Unable to load broker dashboard."
        : "Unable to load broker dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authenticated broker data when the page opens.
    void loadDashboard();
  }, [loadDashboard]);
  const retry = () => { setLoading(true); setError(null); void loadDashboard(); };

  const notices = useMemo(() => {
    if (!broker) return [];
    const result: { severity: "warning" | "error" | "info"; text: string }[] = [];
    if (!broker.account.isActive || normalizedStatus(broker.account.status) !== "ACTIVE") result.push({ severity: "error", text: "Your broker account is not active. Contact the administrator." });
    if (normalizedStatus(broker.registration.status) !== "APPROVED") result.push({ severity: "warning", text: `Broker approval is ${normalizedStatus(broker.registration.status).toLowerCase()}.` });
    if (!subscription) result.push({ severity: "warning", text: "No broker subscription was found." });
    else if (subscription.status !== "ACTIVE") result.push({ severity: "warning", text: `Your subscription is ${subscription.status.toLowerCase().replaceAll("_", " ")}.` });
    else if ((subscription.daysRemaining ?? 999) <= 30) result.push({ severity: "info", text: `Your subscription has ${subscription.daysRemaining} days remaining.` });
    return result;
  }, [broker, subscription]);
  const activeAnalysts = analysts.filter((analyst) => analyst.status === "ACTIVE").length;
  const publishedCalls = calls.filter((call) => Boolean(call.broker_published)).length;
  const openCalls = calls.filter((call) => String(call.status).toUpperCase() !== "CLOSED").length;
  const analystCallCounts = analysts.map((analyst) => ({
    ...analyst,
    calls: calls.filter((call) => (call.researcher_name || call.researcherName || "").toLowerCase() === analyst.name.toLowerCase()).length,
  })).sort((a, b) => b.calls - a.calls);
  const topCallCount = Math.max(1, ...analystCallCounts.map((analyst) => analyst.calls));

  if (loading) return <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (error || !broker) return <Alert severity="error" action={<Button color="inherit" onClick={retry}>Retry</Button>}>{error || "Broker profile not found."}</Alert>;

  return (
    <Stack spacing={3}>
      <Box><Typography variant="h4" fontWeight={800}>Broker Dashboard</Typography><Typography color="text.secondary" mt={0.5}>Welcome, {broker.organization.tradeName || broker.account.name}. Here is your account overview.</Typography></Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Account Status" value={broker.account.isActive ? normalizedStatus(broker.account.status) : "INACTIVE"} icon={<BadgeIcon />} color="#16a34a" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Broker Approval" value={normalizedStatus(broker.registration.status)} icon={<AccountBalanceIcon />} color="#5271FF" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Subscription" value={subscription?.status || "NOT FOUND"} icon={<PaymentsIcon />} color="#9333ea" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Days Remaining" value={subscription?.daysRemaining == null ? "—" : String(subscription.daysRemaining)} icon={<EventAvailableIcon />} color="#ea580c" /></Grid>
      </Grid>
      {notices.length > 0 && <Stack spacing={1}><Typography variant="h6" fontWeight={700}>Action needed</Typography>{notices.map((notice) => <Alert key={notice.text} severity={notice.severity}>{notice.text}</Alert>)}</Stack>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Active analysts" value={String(activeAnalysts)} icon={<PeopleAltIcon />} color="#2563eb" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Clients" value={String(clientCount)} icon={<PeopleAltIcon />} color="#16a34a" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Calls available" value={String(calls.length)} icon={<AssessmentIcon />} color="#9333ea" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard label="Published to clients" value={String(publishedCalls)} icon={<CampaignIcon />} color="#ea580c" /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}><Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6" fontWeight={700}>Research calls</Typography><Typography variant="body2" color="text.secondary">Review and distribute the latest analyst calls.</Typography></Box><Button variant="contained" startIcon={<ShortcutIcon />} onClick={() => navigate("/broker/research-calls")}>Open calls</Button></Stack>
          <Stack spacing={1.5} sx={{ mt: 2 }}>{calls.slice(0, 4).map((call) => <Stack key={call.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}><Box><Typography fontWeight={600}>{call.instrument || call.symbol}</Typography><Typography variant="caption" color="text.secondary">{call.researcher_name || call.researcherName || "Research Analyst"} · {call.action}</Typography></Box><Chip size="small" label={call.broker_published ? "Published" : "Ready to publish"} color={call.broker_published ? "success" : "warning"} variant="outlined" /></Stack>)}{calls.length === 0 && <Typography color="text.secondary" sx={{ py: 2 }}>No research calls are available yet.</Typography>}</Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{openCalls} open calls · {publishedCalls} published</Typography>
        </CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}><CardContent>
          <Typography variant="h6" fontWeight={700}>Performance by analyst</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Call activity based on associated analyst research.</Typography>
          <Stack spacing={1.5}>{analystCallCounts.slice(0, 5).map((analyst) => <Box key={analyst.id}><Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight={600}>{analyst.name}</Typography><Typography variant="body2" color="text.secondary">{analyst.calls} calls</Typography></Stack><LinearProgress variant="determinate" value={(analyst.calls / topCallCount) * 100} sx={{ mt: .5, height: 6, borderRadius: 3 }} /></Box>)}{analystCallCounts.length === 0 && <Typography color="text.secondary">Add an analyst to see activity.</Typography>}</Stack>
          <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/broker/performance")}>View analytics</Button>
        </CardContent></Card></Grid>
      </Grid>
      <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
        <Typography variant="h6" fontWeight={700}>Business and subscription tools</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Manage the commercial side of your brokerage from one place.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} divider={<Divider orientation="vertical" flexItem />}><Button startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/broker/research-analysts")}>Add analyst</Button><Button startIcon={<PeopleAltIcon />} onClick={() => navigate("/broker/clients")}>Manage clients</Button><Button startIcon={<PaymentsIcon />} onClick={() => navigate("/broker/subscription")}>Manage subscription</Button><Button startIcon={<CampaignIcon />} onClick={() => navigate("/broker/announcements")}>Create announcement</Button></Stack>
      </CardContent></Card>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}><Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}><CardContent>
          <Typography variant="h6" fontWeight={700}>Broker details</Typography>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Legal name</Typography><Typography fontWeight={600}>{broker.organization.legalName || "—"}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">SEBI registration</Typography><Typography fontWeight={600}>{broker.registration.sebiRegistrationNo || "—"}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Registration validity</Typography><Typography fontWeight={600}>{formatDate(broker.registration.validity)}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Contact</Typography><Typography fontWeight={600}>{broker.contact.mobile || broker.contact.email || "—"}</Typography></Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/broker/profile")}>View full profile</Button>
        </CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}><CardContent>
          <Typography variant="h6" fontWeight={700}>Membership</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={2}>
            {Object.entries(broker.exchanges).filter(([, active]) => active).map(([name]) => <Chip key={name} label={name.toUpperCase()} color="primary" variant="outlined" />)}
            {Object.entries(broker.segments).filter(([, active]) => active).map(([name]) => <Chip key={name} label={name === "futuresAndOptions" ? "F&O" : name.toUpperCase()} />)}
          </Stack>
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate("/broker/settings")}>Open settings</Button>
        </CardContent></Card></Grid>
      </Grid>
    </Stack>
  );
};

export default BrokerDashboard;
