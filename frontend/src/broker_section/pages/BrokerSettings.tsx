import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { SubscriptionStatusCard } from "../../components/subscription";
import type { SubscriptionDetails } from "../../types/subscription";
import type { BrokerAccount } from "../types/brokerAccount";
import { changeMyBrokerPassword, getMyBrokerAccount, getMyBrokerSubscription } from "../services/brokerAccount.service";

const BrokerSettings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [broker, setBroker] = useState<BrokerAccount | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [accountResponse, subscriptionResponse] = await Promise.all([getMyBrokerAccount(), getMyBrokerSubscription()]);
      setBroker(accountResponse.broker); setSubscription(subscriptionResponse.subscription);
    } catch (requestError) {
      setLoadError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message || "Unable to load settings." : "Unable to load settings.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authenticated broker data when the page opens.
    void loadSettings();
  }, [loadSettings]);
  const retry = () => { setLoading(true); setLoadError(null); void loadSettings(); };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setPasswordError(null); setPasswordSuccess(null);
    if (newPassword !== confirmPassword) { setPasswordError("New password and confirmation do not match."); return; }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) { setPasswordError("Use at least 8 characters with a letter and a number."); return; }
    setSaving(true);
    try {
      const response = await changeMyBrokerPassword(currentPassword, newPassword);
      setPasswordSuccess(response.message); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (requestError) {
      setPasswordError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message || "Unable to change password." : "Unable to change password.");
    } finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (loadError || !broker) return <Alert severity="error" action={<Button color="inherit" onClick={retry}>Retry</Button>}>{loadError || "Broker profile not found."}</Alert>;

  return (
    <Stack spacing={3}>
      <Box><Typography variant="h4" fontWeight={800}>Broker Settings</Typography><Typography color="text.secondary">Manage your account, subscription, and login security.</Typography></Box>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Account" /><Tab label="Subscription" /><Tab label="Security" />
        </Tabs>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && <Stack spacing={2.5}>
            <Alert severity="info">Registration details are read-only after submission. Contact the administrator if an approved detail needs correction.</Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Account name</Typography><Typography fontWeight={600}>{broker.account.name}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Login email</Typography><Typography fontWeight={600}>{broker.account.email}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Organization</Typography><Typography fontWeight={600}>{broker.organization.legalName || "—"}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">SEBI registration</Typography><Typography fontWeight={600}>{broker.registration.sebiRegistrationNo || "—"}</Typography></Grid>
            </Grid>
            <Box><Button variant="contained" onClick={() => navigate("/broker/profile")}>Open my broker profile</Button></Box>
          </Stack>}
          {tab === 1 && <SubscriptionStatusCard subscription={subscription} error={null} onRetry={() => void loadSettings()} title="Broker Subscription" />}
          {tab === 2 && <Box component="form" onSubmit={changePassword} sx={{ maxWidth: 520 }}>
            <Typography variant="h6" fontWeight={700}>Change password</Typography><Typography color="text.secondary" mb={2}>Your new password must contain at least 8 characters, one letter, and one number.</Typography>
            <Stack spacing={2}>
              {passwordError && <Alert severity="error">{passwordError}</Alert>}{passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}
              <TextField label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" />
              <TextField label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required autoComplete="new-password" />
              <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" />
              <Box><Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : "Change password"}</Button></Box>
            </Stack>
          </Box>}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default BrokerSettings;
