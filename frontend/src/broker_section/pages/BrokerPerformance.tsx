import { Box } from "@mui/material";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import BrokerPageHeader from "../components/BrokerPageHeader";
import ProductState from "../../components/common/ProductState";

const BrokerPerformance = () => {
  return (
    <Box><BrokerPageHeader title="RA Performance" subtitle="Calculated performance metrics supplied for read-only comparison." readOnly />
      <ProductState kind="unavailable" icon={<QueryStatsRoundedIcon fontSize="large" />} title="Performance data is not connected" description="Tarkashh will show verified, server-calculated RA performance here once the reporting API is available. Sample performance figures have been removed." note="No performance formula or calculation method was changed in this release." />
    </Box>
  );
};

export default BrokerPerformance;
