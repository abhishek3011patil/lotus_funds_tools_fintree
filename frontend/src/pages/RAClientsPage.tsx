import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Chip, CircularProgress, InputAdornment, Paper, Stack,
  Tab, Tabs, TextField, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import api from "../utils/axio";

type Client = {
  id: string; subscriptionId: string; name: string; email: string | null;
  status: string; startsAt: string | null; expiresAt: string | null;
  subscribedAt: string | null;
};

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function RAClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/ra/dashboard/clients?status=${status}&limit=50&search=${encodeURIComponent(search)}`)
      .then(({ data }) => mounted && setClients(data.clients || []))
      .catch(() => mounted && setError("Unable to load your clients right now."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [status, search]);

  const activeCount = useMemo(() => clients.filter((client) => client.status === "ACTIVE").length, [clients]);

  return <Box sx={{ maxWidth: 1400, mx: "auto" }}>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" sx={{ fontWeight: 750, color: "#172554" }}>Clients</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Manage relationships, subscriptions, and client activity.</Typography></Box>
      <TextField size="small" placeholder="Search clients" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { xs: "100%", md: 300 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Tabs value={status} onChange={(_, value) => setStatus(value)} sx={{ px: 2, borderBottom: "1px solid #e5e7eb" }}>
        <Tab value="ACTIVE" label={`Active${activeCount ? ` (${activeCount})` : ""}`} />
        <Tab value="EXPIRED" label="Expired" />
        <Tab value="ALL" label="All clients" />
      </Tabs>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 900 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.2fr 1.1fr", gap: 2, px: 3, py: 1.5, bgcolor: "#f8fafc", color: "text.secondary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Client</span><span>Subscription</span><span>Start date</span><span>End date</span><span>Last activity</span><span>Status</span>
          </Box>
          {loading ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress size={28} /></Stack> : clients.length === 0 ? <Stack alignItems="center" sx={{ py: 8, px: 3 }}><PersonOutlineIcon sx={{ fontSize: 42, color: "#94a3b8", mb: 1 }} /><Typography fontWeight={700}>No clients found</Typography><Typography color="text.secondary">Subscribed clients will appear here.</Typography></Stack> : clients.map((client) => <Box key={client.subscriptionId} sx={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.2fr 1.1fr", gap: 2, px: 3, py: 2, alignItems: "center", borderTop: "1px solid #eef2f7", "&:hover": { bgcolor: "#fafbff" } }}>
            <Box><Typography fontWeight={700}>{client.name}</Typography><Typography variant="body2" color="text.secondary">{client.email || "No email on file"}</Typography></Box>
            <Typography variant="body2">RA subscription</Typography><Typography variant="body2">{date(client.startsAt)}</Typography><Typography variant="body2">{date(client.expiresAt)}</Typography><Typography variant="body2">{date(client.subscribedAt)}</Typography><Chip size="small" label={client.status} color={client.status === "ACTIVE" ? "success" : "default"} />
          </Box>)}
        </Box>
      </Box>
    </Paper>
  </Box>;
}
