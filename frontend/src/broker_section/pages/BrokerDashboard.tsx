import { Alert, Box, Card, CardContent, Grid, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import BrokerEmptyState from "../components/BrokerEmptyState";
import BrokerPageHeader from "../components/BrokerPageHeader";
import BrokerReadOnlyCallTable from "../components/BrokerReadOnlyCallTable";
import BrokerSummaryCards from "../components/BrokerSummaryCards";
import { brokerService } from "../services/broker.service";
import type { BrokerDashboardData, LoadState } from "../types/broker.types";

const BrokerDashboard = () => {
  const [data, setData] = useState<BrokerDashboardData | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const load = () => { setState("loading"); brokerService.getDashboard().then((value) => { setData(value); setState(value.recentCalls.length ? "ready" : "empty"); }).catch(() => setState("error")); };
  useEffect(() => { brokerService.getDashboard().then((value) => { setData(value); setState(value.recentCalls.length ? "ready" : "empty"); }).catch(() => setState("error")); }, []);

  if (state !== "ready" || !data) return <Box><BrokerPageHeader title="Broker Dashboard" subtitle="A read-only overview of your research distribution and subscriptions." /><BrokerEmptyState state={state === "ready" ? "empty" : state} emptyText="No dashboard activity is available yet." onRetry={load} /></Box>;

  return (
    <Box>
      <BrokerPageHeader title="Broker Dashboard" subtitle="A read-only overview of research delivered to your clients." />
      <BrokerSummaryCards items={[
        { label: "Active subscribed RAs", value: data.metrics.activeRAs }, { label: "Broker clients", value: data.metrics.clients }, { label: "Research calls received", value: data.metrics.callsReceived }, { label: "Open research calls", value: data.metrics.openCalls }, { label: "Closed research calls", value: data.metrics.closedCalls }, { label: "Subscription", value: data.metrics.subscriptionStatus },
      ]} />
      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>Recent research calls</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>Research calls are displayed exactly as published by the Research Analyst and cannot be edited by a Broker.</Alert>
      <BrokerReadOnlyCallTable calls={data.recentCalls} />
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}><Card variant="outlined"><CardContent><Typography variant="h6">Recent RA performance</Typography><List>{data.performance.map((row) => <ListItem key={row.id} divider><ListItemText primary={row.raName} secondary={`${row.successRate}% success · ${row.averageReturn}% average return · ${row.closedCalls} closed calls`} /></ListItem>)}</List></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card variant="outlined"><CardContent><Typography variant="h6">Notifications</Typography><List>{data.notifications.map((note) => <ListItem key={note.id} divider><ListItemText primary={note.title} secondary={note.message} /></ListItem>)}</List></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
};

export default BrokerDashboard;
