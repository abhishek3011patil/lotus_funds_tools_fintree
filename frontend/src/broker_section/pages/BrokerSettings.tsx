import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, 
  Grid, IconButton, InputAdornment, List, ListItem, ListItemText, Paper, 
  Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Tabs, TextField, Typography 
} from "@mui/material";
import { SubscriptionStatusCard } from "../../components/subscription";
import type { SubscriptionDetails } from "../../types/subscription";
import type { BrokerAccount } from "../types/brokerAccount";
import { changeMyBrokerPassword, getMyBrokerAccount, getMyBrokerSubscription } from "../services/brokerAccount.service";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CardMembershipOutlinedIcon from "@mui/icons-material/CardMembershipOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { getBrokerAnalysts, type AssociatedAnalyst } from "../services/brokerOnboarding.service";
// Add Visibility icons
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


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
  const [showPassword, setShowPassword] = useState(false);
  // 1. Ref setup for smooth scrolling
const accountRef = useRef<HTMLDivElement | null>(null);
const analystsRef = useRef<HTMLDivElement | null>(null);
const subscriptionRef = useRef<HTMLDivElement | null>(null);
const securityRef = useRef<HTMLDivElement | null>(null);

// 2. State for analysts
const [analysts, setAnalysts] = useState<AssociatedAnalyst[]>([]);

// 3. Scroll helper function
const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, tabIndex: number) => {
  setTab(tabIndex);
  ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const loadSettings = useCallback(async () => {
  try {
    const [accountResponse, subscriptionResponse, analystsData] = await Promise.all([
      getMyBrokerAccount(),
      getMyBrokerSubscription(),
      getBrokerAnalysts(), // Fetches RA list from your brokerOnboarding service
    ]);
    setBroker(accountResponse.broker);
    setSubscription(subscriptionResponse.subscription);
    setAnalysts(analystsData);
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
    <Box>
      <Typography variant="h4" fontWeight={800}>Broker Settings</Typography>
      <Typography color="text.secondary">Manage your account, associated RAs, subscription, and login security.</Typography>
    </Box>

    <Grid container spacing={3} alignItems="flex-start">
      {/* LEFT SIDEBAR NAVIGATION */}
      <Grid size={{ xs: 12, md: 3.5, lg: 3 }} sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
        <Card variant="outlined" sx={{ borderRadius: 4, p: 1.5 }}>
          <Tabs
            orientation="vertical"
            value={tab}
            sx={{
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                justifyContent: "flex-start",
                minHeight: 48,
                borderRadius: 2,
                px: 2,
                my: 0.5,
                fontWeight: 600,
                color: "text.secondary",
                textTransform: "none",
                fontSize: "0.95rem",
                "&.Mui-selected": {
                  backgroundColor: "#EEF2FF",
                  color: "#3730A3",
                },
                "&:hover": {
                  backgroundColor: "#F3F4F6",
                },
              },
            }}
          >
            <Tab
              icon={<PersonOutlineIcon />}
              iconPosition="start"
              label="Account"
              onClick={() => scrollToSection(accountRef, 0)}
            />
            <Tab
              icon={<GroupOutlinedIcon />}
              iconPosition="start"
              label="Associated RAs"
              onClick={() => scrollToSection(analystsRef, 1)}
            />
            <Tab
              icon={<CardMembershipOutlinedIcon />}
              iconPosition="start"
              label="Subscription"
              onClick={() => scrollToSection(subscriptionRef, 2)}
            />
            <Tab
              icon={<LockOutlinedIcon />}
              iconPosition="start"
              label="Security"
              onClick={() => scrollToSection(securityRef, 3)}
            />
          </Tabs>
        </Card>
      </Grid>

      {/* RIGHT SIDE MAIN CONTENT (SINGLE SCROLLABLE COLUMN) */}
      <Grid size={{ xs: 12, md: 8.5, lg: 9 }}>
        <Stack spacing={3}>
          
          {/* SECTION 1: ACCOUNT & PROFILE */}
          <Card ref={accountRef} variant="outlined" sx={{ borderRadius: 4, scrollMarginTop: 24 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Profile and account</Typography>
              <Typography color="text.secondary" mb={2}>Review your registered broker profile details.</Typography>
              <Alert severity="info" sx={{ mb: 2.5 }}>Registration details are read-only after submission. Contact the administrator if an approved detail needs correction.</Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Account name</Typography><Typography fontWeight={600}>{broker.account.name}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Login email</Typography><Typography fontWeight={600}>{broker.account.email}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Organization</Typography><Typography fontWeight={600}>{broker.organization.legalName || "—"}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">SEBI registration</Typography><Typography fontWeight={600}>{broker.registration.sebiRegistrationNo || "—"}</Typography></Grid>
              </Grid>
              <Box mt={2.5}>
                <Button variant="contained" onClick={() => navigate("/broker/profile")}>Open my broker profile</Button>
              </Box>
            </CardContent>
          </Card>

          {/* SECTION 2: ASSOCIATED RESEARCH ANALYSTS */}
          <Card ref={analystsRef} variant="outlined" sx={{ borderRadius: 4, scrollMarginTop: 24 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>Associated Research Analysts</Typography>
                <Button variant="outlined" size="small" onClick={() => navigate("/broker/analysts")}>Manage RAs</Button>
              </Stack>
              <Typography color="text.secondary" mb={2.5}>Research Analysts onboarded and linked under your brokerage account.</Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: "#E9E9EE" }}>
                <Table size="small" aria-label="Associated Research Analysts" sx={{ "& th": { bgcolor: "#F9FAFB", fontWeight: 700, fontSize: 12, py: 1.5 }, "& td": { fontSize: 13, py: 1.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>SEBI Registration</TableCell>
                      <TableCell>Expertise</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          No Research Analysts added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      analysts.map((ra) => (
                        <TableRow key={ra.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{ra.name}</TableCell>
                          <TableCell>{ra.sebiRegistration || "—"}</TableCell>
                          <TableCell>{ra.category || "—"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={ra.status === "PENDING" ? "Pending onboarding" : ra.status}
                              color={ra.status === "ACTIVE" ? "success" : ra.status === "REJECTED" ? "error" : "warning"}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* SECTION 3: SUBSCRIPTION */}
          <Card ref={subscriptionRef} variant="outlined" sx={{ borderRadius: 4, scrollMarginTop: 24 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <SubscriptionStatusCard subscription={subscription} error={null} onRetry={() => void loadSettings()} title="Broker Subscription" />
            </CardContent>
          </Card>

         {/* SECTION 4: SECURITY */}
<Card ref={securityRef} variant="outlined" sx={{ borderRadius: 4, scrollMarginTop: 24 }}>
  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
    <Box component="form" onSubmit={changePassword} sx={{ maxWidth: 520 }}>
      <Typography variant="h6" fontWeight={700}>Change password</Typography>
      <Typography color="text.secondary" mb={2}>Your new password must contain at least 8 characters, one letter, and one number.</Typography>
      <Stack spacing={2}>
        {passwordError && <Alert severity="error">{passwordError}</Alert>}
        {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}

        <TextField
          label="Current password"
          type={showPassword ? "text" : "password"}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          autoComplete="current-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="New password"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Confirm new password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box><Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : "Change password"}</Button></Box>
      </Stack>
    </Box>
  </CardContent>
</Card>

        </Stack>
      </Grid>
    </Grid>
  </Stack>
);
};

export default BrokerSettings;
