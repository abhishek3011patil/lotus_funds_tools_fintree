import { Add } from "@mui/icons-material";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import BrokerClientTable from "../components/BrokerClientTable";
import BrokerEmptyState from "../components/BrokerEmptyState";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { createBrokerClient, getBrokerClientDeliveries, getBrokerClients, onboardingError, setBrokerClientChannel } from "../services/brokerOnboarding.service";
import type { BrokerClient, BrokerClientDelivery } from "../types/broker.types";

const emptyForm = { name: "", email: "", phoneNumber: "", aadhaarNumber: "", panNumber: "" };
const deliveryLabel: Record<BrokerClientDelivery["eventType"], string> = {
  RESEARCH_CALL_PUBLISHED: "Published", RESEARCH_CALL_ERRATA: "Errata", RESEARCH_CALL_EXITED: "Exited",
};

const BrokerClients = () => {
  const [clients, setClients] = useState<BrokerClient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [channelTarget, setChannelTarget] = useState<{ client: BrokerClient; channel: "whatsapp" | "telegram" } | null>(null);
  const [channelPhone, setChannelPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [historyClient, setHistoryClient] = useState<BrokerClient | null>(null);
  const [deliveries, setDeliveries] = useState<BrokerClientDelivery[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setClients(await getBrokerClients(search)); }
    catch (requestError) { setError(onboardingError(requestError)); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  const saveClient = async () => {
    setSaving(true); setError("");
    try { await createBrokerClient(form); setAdding(false); setForm(emptyForm); setNotice("Client added to the broker directory."); await load(); }
    catch (requestError) { setError(onboardingError(requestError)); }
    finally { setSaving(false); }
  };

  const openChannel = (client: BrokerClient, channel: "whatsapp" | "telegram") => {
    if (channel === "whatsapp" ? client.whatsappAdded : client.telegramAdded) {
      setBusyId(client.id);
      void setBrokerClientChannel(client.id, channel, false)
        .then(() => { setNotice(`Client removed from ${channel === "whatsapp" ? "WhatsApp" : "Telegram"}.`); return load(); })
        .catch(requestError => setError(onboardingError(requestError))).finally(() => setBusyId(""));
      return;
    }
    setChannelTarget({ client, channel }); setChannelPhone(client.phoneNumber ? `+${client.phoneNumber}` : ""); setConsent(false);
  };

  const confirmChannel = async () => {
    if (!channelTarget || !consent) return;
    setBusyId(channelTarget.client.id); setError("");
    try {
      await setBrokerClientChannel(channelTarget.client.id, channelTarget.channel, true, channelPhone);
      setNotice(`Client added to ${channelTarget.channel === "whatsapp" ? "WhatsApp" : "Telegram"}.`);
      setChannelTarget(null); await load();
    } catch (requestError) { setError(onboardingError(requestError)); }
    finally { setBusyId(""); }
  };

  const showHistory = async (client: BrokerClient) => {
    setHistoryClient(client); setBusyId(client.id); setDeliveries([]);
    try { setDeliveries(await getBrokerClientDeliveries(client.id)); }
    catch (requestError) { setError(onboardingError(requestError)); }
    finally { setBusyId(""); }
  };

  return <Box>
    <BrokerPageHeader title="Clients" subtitle="Manage portal clients and clients added by your brokerage, including delivery channels and call history." />
    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
      <TextField size="small" label="Search clients" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
      <Button variant="contained" startIcon={<Add />} onClick={() => setAdding(true)} sx={{ whiteSpace: "nowrap" }}>Add client</Button>
    </Stack>
    {loading ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      : clients.length ? <BrokerClientTable clients={clients} busyId={busyId} onChannel={openChannel} onHistory={showHistory} />
        : <BrokerEmptyState state="empty" emptyText="No clients found. Portal subscribers will appear automatically, or add a client manually." />}

    <Dialog open={adding} onClose={() => !saving && setAdding(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add client</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info">For privacy, only masked Aadhaar/PAN values and secure hashes are retained.</Alert>
        <TextField autoFocus required label="Full name" value={form.name} onChange={e => setForm(value => ({ ...value, name: e.target.value }))} />
        <TextField label="Email" type="email" value={form.email} onChange={e => setForm(value => ({ ...value, email: e.target.value }))} />
        <TextField required label="Phone with country code" placeholder="+919876543210" value={form.phoneNumber} onChange={e => setForm(value => ({ ...value, phoneNumber: e.target.value }))} />
        <TextField required label="Aadhaar number" inputProps={{ maxLength: 12 }} value={form.aadhaarNumber} onChange={e => setForm(value => ({ ...value, aadhaarNumber: e.target.value.replace(/\D/g, "") }))} />
        <TextField required label="PAN number" inputProps={{ maxLength: 10 }} value={form.panNumber} onChange={e => setForm(value => ({ ...value, panNumber: e.target.value.toUpperCase() }))} />
      </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setAdding(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void saveClient()}>{saving ? "Adding..." : "Add client"}</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(channelTarget)} onClose={() => !busyId && setChannelTarget(null)} fullWidth maxWidth="xs">
      <DialogTitle>Add to {channelTarget?.channel === "whatsapp" ? "WhatsApp" : "Telegram"}</DialogTitle><DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>This number will receive calls published by the broker and automatic RA errata/exit updates.</Typography>
        <TextField fullWidth label="Phone number" value={channelPhone} onChange={e => setChannelPhone(e.target.value)} />
        <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={consent} onChange={e => setConsent(e.target.checked)} />} label={`I confirm ${channelTarget?.client.name || "the client"} consented to receive these messages.`} />
      </DialogContent><DialogActions><Button disabled={Boolean(busyId)} onClick={() => setChannelTarget(null)}>Cancel</Button><Button variant="contained" disabled={Boolean(busyId) || !consent} onClick={() => void confirmChannel()}>{busyId ? "Adding..." : "Add"}</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(historyClient)} onClose={() => setHistoryClient(null)} fullWidth maxWidth="md">
      <DialogTitle>Call delivery history · {historyClient?.name}</DialogTitle><DialogContent>
        {busyId ? <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress /></Stack> : deliveries.length === 0 ? <Alert severity="info">No calls have been delivered to this client yet.</Alert> : <Stack spacing={1.25}>
          {deliveries.map(delivery => <Box key={delivery.id} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={2}><Box><Typography fontWeight={750}>{delivery.instrument || delivery.symbol} · {deliveryLabel[delivery.eventType]}</Typography><Typography variant="body2" color="text.secondary">{delivery.researchAnalyst} · {delivery.channel}</Typography></Box><Typography variant="body2" color={delivery.status === "SENT" ? "success.main" : delivery.status === "FAILED" ? "error.main" : "warning.main"} fontWeight={750}>{delivery.status}</Typography></Stack><Typography variant="caption" color="text.secondary">Queued {new Date(delivery.queuedAt).toLocaleString("en-IN")}{delivery.sentAt ? ` · Sent ${new Date(delivery.sentAt).toLocaleString("en-IN")}` : ""}</Typography>{delivery.errorMessage && <Typography variant="caption" color="error" display="block">{delivery.errorMessage}</Typography>}</Box>)}
        </Stack>}
      </DialogContent><DialogActions><Button onClick={() => setHistoryClient(null)}>Close</Button></DialogActions>
    </Dialog>
  </Box>;
};

export default BrokerClients;
