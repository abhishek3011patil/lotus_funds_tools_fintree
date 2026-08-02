import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { brokerResearchAnalysts } from "../mocks/broker.mock";

const BrokerResearchAnalysts = () => <Box><BrokerPageHeader title="Research Analysts" subtitle="Research Analysts currently associated with this Broker." readOnly />
  <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>SEBI registration</TableCell><TableCell>Category</TableCell><TableCell>Subscription</TableCell><TableCell>Registration expiry</TableCell><TableCell>Performance</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead><TableBody>{brokerResearchAnalysts.map((ra) => <TableRow key={ra.id}><TableCell>{ra.name}</TableCell><TableCell>{ra.sebiRegistration}</TableCell><TableCell>{ra.category}</TableCell><TableCell>{ra.subscriptionStatus}</TableCell><TableCell>{ra.registrationExpiry}</TableCell><TableCell>{ra.performance}</TableCell><TableCell><Chip size="small" label={ra.status} color={ra.status === "ACTIVE" ? "success" : "default"} /></TableCell><TableCell><Button size="small">View profile</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
</Box>;
export default BrokerResearchAnalysts;
