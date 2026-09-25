import { Alert, Box, Card, CardContent, List, ListItem, ListItemText } from "@mui/material";
import { SubscriptionStatusCard } from "../../components/subscription";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { brokerSubscription } from "../mocks/broker.mock";

const BrokerSubscription = () => <Box>
    <BrokerPageHeader title="Subscription" 
    subtitle="Current Broker plan and included features." 
    readOnly />
    <Alert severity="info" 
    sx={{ mb: 2 }}>Renewal and payment actions are intentionally not connected in this frontend branch.
    </Alert>
    <Card variant="outlined">
        <CardContent>
            <SubscriptionStatusCard subscription={brokerSubscription.details} title="Broker subscription status" />
            </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                    <List>{brokerSubscription.features.map((feature) => <ListItem key={feature}>
                        <ListItemText primary={feature} />
                        </ListItem>)}
                        </List>
                        </CardContent>
                        </Card>
                        </Box>;
export default BrokerSubscription;
