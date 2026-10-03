import { Box } from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import BrokerPageHeader from "../components/BrokerPageHeader";
import ProductState from "../../components/common/ProductState";

const BrokerNotifications = () => <Box><BrokerPageHeader title="Notifications" subtitle="Research, account and subscription notices for this Broker." /><ProductState kind="unavailable" icon={<NotificationsNoneRoundedIcon fontSize="large" />} title="Notifications are not connected" description="There are no live notifications to show. Sample notices have been removed so this screen never presents demo activity as real account data." /></Box>;
export default BrokerNotifications;
