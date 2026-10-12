import { Alert, Box } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import BrokerPageHeader from "../components/BrokerPageHeader";
import ProductState from "../../components/common/ProductState";

const BrokerAnnouncements = () => <Box><BrokerPageHeader title="Announcements" subtitle="Create non-research communications for Broker clients. This preview does not publish data." />
  <Alert severity="warning" sx={{ mb: 2 }}>Announcements must not contain or imitate a research recommendation, target, entry or trading instruction.</Alert>
  <ProductState kind="unavailable" icon={<CampaignOutlinedIcon fontSize="large" />} title="Announcements are not connected" description="Publishing and announcement history will appear after a compliant announcements API and audit trail are available. No sample announcements are shown." />
</Box>;
export default BrokerAnnouncements;
