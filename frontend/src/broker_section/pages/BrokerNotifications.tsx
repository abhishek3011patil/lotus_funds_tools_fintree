import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { brokerNotifications } from "../mocks/broker.mock";

const BrokerNotifications = () => <Box><BrokerPageHeader title="Notifications" subtitle="Research, account and subscription notices for this Broker." /><Stack spacing={2}>{brokerNotifications.map((note) => <Card variant="outlined" key={note.id}><CardContent><Stack direction="row" justifyContent="space-between"><Typography fontWeight={600}>{note.title}</Typography>{!note.read && <Chip label="New" size="small" color="primary" />}</Stack><Typography color="text.secondary" sx={{ mt: 1 }}>{note.message}</Typography><Typography variant="caption">{new Date(note.createdAt).toLocaleString()}</Typography></CardContent></Card>)}</Stack></Box>;
export default BrokerNotifications;
