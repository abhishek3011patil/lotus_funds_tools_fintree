import { Alert, Avatar, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { brokerBranding } from "../mocks/broker.mock";

const BrokerBranding = () => {
  const [branding, setBranding] = useState(brokerBranding);
  const update = (field: keyof typeof branding) => (event: React.ChangeEvent<HTMLInputElement>) => setBranding((value) => ({ ...value, [field]: event.target.value }));
  return <Box><BrokerPageHeader title="Branding" subtitle="Preview permitted Broker white-label fields. Saving is not connected yet." />
    <Alert severity="warning" sx={{ mb: 2 }}>RA attribution, research text, entry, targets, stop-loss, publication timestamp, disclaimer and research ownership cannot be altered.</Alert>
    <Grid container spacing={3}><Grid size={{ xs: 12, md: 7 }}><Stack spacing={2}><TextField label="Broker display name" value={branding.displayName} onChange={update("displayName")} /><TextField label="Contact email" value={branding.contactEmail} onChange={update("contactEmail")} /><TextField label="Contact number" value={branding.contactNumber} onChange={update("contactNumber")} /><TextField label="Website" value={branding.website} onChange={update("website")} /><TextField label="Primary brand colour" type="color" value={branding.primaryColour} onChange={update("primaryColour")} /><TextField label="Broker type" value={branding.brokerType} slotProps={{ input: { readOnly: true } }} helperText="Broker type is read-only" /><Button variant="contained" disabled>Save branding (API not connected)</Button></Stack></Grid><Grid size={{ xs: 12, md: 5 }}><Card variant="outlined"><CardContent><Stack direction="row" spacing={2} alignItems="center"><Avatar sx={{ bgcolor: branding.primaryColour, width: 56, height: 56 }}>LP</Avatar><Box><Typography variant="h6">{branding.displayName}</Typography><Typography color="text.secondary">{branding.brokerType} Broker</Typography></Box></Stack><Box sx={{ borderTop: 4, borderColor: branding.primaryColour, mt: 3, pt: 2 }}><Typography fontWeight={600}>Broker preview</Typography><Typography variant="body2">{branding.contactEmail}<br />{branding.contactNumber}<br />{branding.website}</Typography></Box></CardContent></Card></Grid></Grid>
  </Box>;
};
export default BrokerBranding;
