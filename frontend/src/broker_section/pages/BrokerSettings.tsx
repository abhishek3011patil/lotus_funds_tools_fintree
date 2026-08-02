import { Alert, Box, FormControlLabel, Stack, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useState } from "react";
import BrokerPageHeader from "../components/BrokerPageHeader";
import BrokerBranding from "./BrokerBranding";
import BrokerSubscription from "./BrokerSubscription";

const BrokerSettings = () => {
  const [tab, setTab] = useState(0);
  return (
    <Box><BrokerPageHeader title="Settings" subtitle="Broker profile, branding, subscription, notifications and security placeholders." /><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Broker settings sections"><Tab label="Profile" /><Tab label="Branding" /><Tab label="Subscription" /><Tab label="Notifications" /><Tab label="Security" /></Tabs><Box sx={{ mt: 3 }}>
      {tab === 0 && <Stack spacing={2} maxWidth={600}><TextField label="Broker name" defaultValue="Lotus Partner Securities" /><TextField label="Contact email" defaultValue="support@example-broker.test" /><Alert severity="info">Profile saving will be connected through the Broker service in a later backend phase.</Alert></Stack>}
      {tab === 1 && <BrokerBranding />}{tab === 2 && <BrokerSubscription />}
      {tab === 3 && <Stack><FormControlLabel control={<Switch defaultChecked />} label="Research call notifications" /><FormControlLabel control={<Switch defaultChecked />} label="Subscription notifications" /><FormControlLabel control={<Switch />} label="Product announcements" /></Stack>}
      {tab === 4 && <Alert severity="info"><Typography fontWeight={600}>Security placeholder</Typography>Password and OTP changes are not implemented in this frontend branch.</Alert>}
    </Box></Box>
  );
};

export default BrokerSettings;
