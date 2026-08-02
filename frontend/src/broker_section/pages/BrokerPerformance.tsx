import { Box, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import BrokerPageHeader from "../components/BrokerPageHeader";
import BrokerSummaryCards from "../components/BrokerSummaryCards";
import { brokerPerformance, brokerResearchAnalysts } from "../mocks/broker.mock";

const BrokerPerformance = () => {
  const [raId, setRaId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const rows = useMemo(() => brokerPerformance.filter((row) => (raId === "ALL" || row.raId === raId) && (status === "ALL" || row.status === status)), [raId, status]);
  return (
    <Box><BrokerPageHeader title="RA Performance" subtitle="Calculated performance metrics supplied for read-only comparison." readOnly />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}><FormControl size="small" sx={{ minWidth: 220 }}><InputLabel>Research Analyst</InputLabel><Select value={raId} label="Research Analyst" onChange={(e) => setRaId(e.target.value)}><MenuItem value="ALL">All RAs</MenuItem>{brokerResearchAnalysts.map((ra) => <MenuItem key={ra.id} value={ra.id}>{ra.name}</MenuItem>)}</Select></FormControl><TextField type="date" size="small" label="From" defaultValue="2026-04-01" slotProps={{ inputLabel: { shrink: true } }} /><TextField type="date" size="small" label="To" defaultValue="2026-07-31" slotProps={{ inputLabel: { shrink: true } }} /><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}><MenuItem value="ALL">All</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem></Select></FormControl></Stack>
      <BrokerSummaryCards items={[{ label: "Research Analysts", value: rows.length }, { label: "Total calls", value: rows.reduce((sum, row) => sum + row.calls, 0) }, { label: "Average success rate", value: rows.length ? `${Math.round(rows.reduce((sum, row) => sum + row.successRate, 0) / rows.length)}%` : "—" }]} />
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}><Table size="small"><TableHead><TableRow><TableCell>RA</TableCell><TableCell>Calls</TableCell><TableCell>Closed</TableCell><TableCell>Success rate</TableCell><TableCell>Average return</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.raName}</TableCell><TableCell>{row.calls}</TableCell><TableCell>{row.closedCalls}</TableCell><TableCell>{row.successRate}%</TableCell><TableCell>{row.averageReturn}%</TableCell><TableCell><Chip size="small" label={row.status} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>
    </Box>
  );
};

export default BrokerPerformance;
