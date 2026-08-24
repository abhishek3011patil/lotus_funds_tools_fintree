import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BadgeIcon from "@mui/icons-material/Badge";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsIcon from "@mui/icons-material/Payments";
import type { SubscriptionDetails } from "../../types/subscription";
import type { BrokerAccount } from "../types/brokerAccount";
import { getMyBrokerAccount, getMyBrokerSubscription } from "../services/brokerAccount.service";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [accountResponse, subscriptionResponse] = await Promise.all([getMyBrokerAccount(), getMyBrokerSubscription()]);
      setBroker(accountResponse.broker);
      setSubscription(subscriptionResponse.subscription);
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
