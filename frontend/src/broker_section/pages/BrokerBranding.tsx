import { Alert, Box } from "@mui/material";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import BrokerPageHeader from "../components/BrokerPageHeader";
import ProductState from "../../components/common/ProductState";

const BrokerBranding = () => {
  return <Box><BrokerPageHeader title="Branding" subtitle="Preview permitted Broker white-label fields. Saving is not connected yet." />
    <Alert severity="warning" sx={{ mb: 2 }}>RA attribution, research text, entry, targets, stop-loss, publication timestamp, disclaimer and research ownership cannot be altered.</Alert>
    <ProductState kind="unavailable" icon={<PaletteOutlinedIcon fontSize="large" />} title="Branding controls are not connected" description="Tarkashh will load approved broker identity fields from the server before allowing a preview or save. Sample broker details have been removed." />
  </Box>;
};
export default BrokerBranding;
