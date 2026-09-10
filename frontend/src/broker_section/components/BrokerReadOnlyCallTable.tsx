import { Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import type { BrokerResearchCall } from "../types/broker.types";

const BrokerReadOnlyCallTable = ({ calls }: { calls: BrokerResearchCall[] }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small" aria-label="Read-only research calls">
      <TableHead><TableRow><TableCell>Instrument</TableCell><TableCell>Action</TableCell><TableCell>Entry / range</TableCell><TableCell>Targets / stop-loss</TableCell><TableCell>RA & audience</TableCell><TableCell>Status</TableCell><TableCell>Published</TableCell><TableCell>Disclaimer</TableCell><TableCell>Exit / errata</TableCell><TableCell /></TableRow></TableHead>
      <TableBody>{calls.map((call) => <TableRow key={call.id} hover>
        <TableCell><strong>{call.symbol}</strong><br />{call.timeHorizon}</TableCell>
        <TableCell><Chip size="small" label={call.action} color={call.action === "BUY" ? "success" : "error"} /></TableCell>
        <TableCell>{call.entry}<br />{call.entryRange}</TableCell>
        <TableCell>{call.targets.join(", ")}<br />SL: {call.stopLosses.join(", ")}</TableCell>
        <TableCell>{call.raName}<br />{call.audience}</TableCell>
        <TableCell><Chip size="small" label={call.status} variant="outlined" /></TableCell>
        <TableCell>{new Date(call.publishedAt).toLocaleString()}</TableCell>
        <TableCell>{call.disclaimerVersion}</TableCell>
        <TableCell>{call.exitStatus}<br />{call.hasErrata ? "Errata issued" : "No errata"}</TableCell>
        <TableCell><Tooltip title="Opens a read-only detail view"><Button size="small">View details</Button></Tooltip></TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>
);

export default BrokerReadOnlyCallTable;
