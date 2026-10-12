import { Button, Card, CardContent, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import type { BrokerResearchCall } from "../types/broker.types";
import { formatIndiaDateTime } from "../../utils/formatters";

const BrokerReadOnlyCallTable = ({ calls }: { calls: BrokerResearchCall[] }) => (
  <>
  <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
    {calls.map(call => <Card key={call.id} variant="outlined"><CardContent>
      <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={800}>{call.symbol}</Typography><Chip size="small" label={call.action} color={call.action === "BUY" ? "success" : "error"} /></Stack>
      <Typography variant="body2" sx={{ mt: 1 }}>Entry: {call.entryRange || call.entry}</Typography>
      <Typography variant="body2">Targets: {call.targets.join(", ")} · SL: {call.stopLosses.join(", ")}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{call.raName} · {formatIndiaDateTime(call.publishedAt)}</Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}><Chip size="small" label={call.status} variant="outlined" /><Button size="small">View details</Button></Stack>
    </CardContent></Card>)}
  </Stack>
  <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: "none", md: "block" } }}>
    <Table size="small" aria-label="Read-only research calls">
      <TableHead><TableRow><TableCell>Instrument</TableCell><TableCell>Action</TableCell><TableCell>Entry / range</TableCell><TableCell>Targets / stop-loss</TableCell><TableCell>RA & audience</TableCell><TableCell>Status</TableCell><TableCell>Published</TableCell><TableCell>Disclaimer</TableCell><TableCell>Exit / errata</TableCell><TableCell /></TableRow></TableHead>
      <TableBody>{calls.map((call) => <TableRow key={call.id} hover>
        <TableCell><strong>{call.symbol}</strong><br />{call.timeHorizon}</TableCell>
        <TableCell><Chip size="small" label={call.action} color={call.action === "BUY" ? "success" : "error"} /></TableCell>
        <TableCell>{call.entry}<br />{call.entryRange}</TableCell>
        <TableCell>{call.targets.join(", ")}<br />SL: {call.stopLosses.join(", ")}</TableCell>
        <TableCell>{call.raName}<br />{call.audience}</TableCell>
        <TableCell><Chip size="small" label={call.status} variant="outlined" /></TableCell>
        <TableCell>{formatIndiaDateTime(call.publishedAt)}</TableCell>
        <TableCell>{call.disclaimerVersion}</TableCell>
        <TableCell>{call.exitStatus}<br />{call.hasErrata ? "Errata issued" : "No errata"}</TableCell>
        <TableCell><Tooltip title="Opens a read-only detail view"><Button size="small">View details</Button></Tooltip></TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>
  </>
);

export default BrokerReadOnlyCallTable;
