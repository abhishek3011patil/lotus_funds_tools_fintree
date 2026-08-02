import { Alert, Box } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import BrokerReadOnlyCallTable from "../components/BrokerReadOnlyCallTable";
import { brokerResearchCalls } from "../mocks/broker.mock";

const BrokerResearchCalls = () => <Box>
  <BrokerPageHeader title="Research Calls" subtitle="Calls sent by your subscribed Research Analysts to Broker clients." readOnly />
  <Alert severity="info" sx={{ mb: 2 }}>Broker access is strictly read-only. Entries, targets, stop-losses, timestamps, attribution, disclaimers and research text cannot be changed.</Alert>
  <BrokerReadOnlyCallTable calls={brokerResearchCalls} />
</Box>;
export default BrokerResearchCalls;
