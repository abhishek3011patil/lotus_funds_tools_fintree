import { Add } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, MenuItem, Pagination, Select, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import BrokerClientTable from "../components/BrokerClientTable";
import BrokerEmptyState from "../components/BrokerEmptyState";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { brokerClients as initialClients } from "../mocks/broker.mock";
import type { BrokerClient } from "../types/broker.types";

const PAGE_SIZE = 5;
const BrokerClients = () => {
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BrokerClient | null>(null);
  const [deactivating, setDeactivating] = useState<BrokerClient | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const filtered = useMemo(() => clients.filter((client) => (status === "ALL" || client.status === status) && `${client.displayName} ${client.reference}`.toLowerCase().includes(search.toLowerCase())), [clients, search, status]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const saveAdd = () => { if (!name.trim() || !reference.trim()) return; setClients((value) => [...value, { id: `local-${Date.now()}`, displayName: name.trim(), reference: reference.trim(), status: "ACTIVE", joinedAt: new Date().toISOString().slice(0, 10) }]); setAdding(false); setName(""); setReference(""); };
  const saveEdit = () => { if (!editing || !name.trim()) return; setClients((value) => value.map((item) => item.id === editing.id ? { ...item, displayName: name.trim() } : item)); setEditing(null); };

  return <Box><BrokerPageHeader title="Clients" subtitle="Frontend-only client list management. Changes in this preview are not saved to an API." />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}><TextField size="small" label="Search clients" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} fullWidth /><FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem></Select></FormControl><Button variant="contained" startIcon={<Add />} onClick={() => setAdding(true)}>Add client</Button></Stack>
    {visible.length ? <><BrokerClientTable clients={visible} onEdit={(client) => { setEditing(client); setName(client.displayName); }} onDeactivate={setDeactivating} /><Pagination sx={{ mt: 2 }} page={page} count={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} onChange={(_, value) => setPage(value)} /></> : <BrokerEmptyState state="empty" emptyText="No clients match the current filters." />}
    <Dialog open={adding} onClose={() => setAdding(false)} fullWidth maxWidth="sm"><DialogTitle>Add client</DialogTitle><DialogContent><DialogContentText sx={{ mb: 2 }}>Use a non-sensitive display name and Broker reference. API integration is pending.</DialogContentText><Stack spacing={2}><TextField autoFocus label="Display name" value={name} onChange={(e) => setName(e.target.value)} /><TextField label="Broker reference" value={reference} onChange={(e) => setReference(e.target.value)} /></Stack></DialogContent><DialogActions><Button onClick={() => setAdding(false)}>Cancel</Button><Button onClick={saveAdd} variant="contained">Add locally</Button></DialogActions></Dialog>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm"><DialogTitle>Edit client</DialogTitle><DialogContent><TextField autoFocus fullWidth sx={{ mt: 1 }} label="Display name" value={name} onChange={(e) => setName(e.target.value)} /></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit} variant="contained">Save locally</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deactivating)} onClose={() => setDeactivating(null)}><DialogTitle>Deactivate client?</DialogTitle><DialogContent><DialogContentText>This only updates local mock state. No account or backend record will be changed.</DialogContentText></DialogContent><DialogActions><Button onClick={() => setDeactivating(null)}>Cancel</Button><Button color="error" onClick={() => { if (deactivating) setClients((value) => value.map((item) => item.id === deactivating.id ? { ...item, status: "INACTIVE" } : item)); setDeactivating(null); }}>Deactivate</Button></DialogActions></Dialog>
  </Box>;
};
export default BrokerClients;
