import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import RecommendationHistory, { type ApiHistoryRecord, type HistoryRecord } from "../../pages/common/RecommendationHistory";
import { getBrokerCalls, onboardingError, publishBrokerCall } from "../services/brokerOnboarding.service";

const BrokerResearchCalls = () => {
  const [calls, setCalls] = useState<ApiHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setCalls(await getBrokerCalls()); }
    catch (err) { setError(onboardingError(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);
  const openOptions = (call: HistoryRecord) => {
    const baseMessage = String(call.published_message_text || "").trim() || [
      "RESEARCH RECOMMENDATION",
      `Stock Name: ${call.instrument}`,
      `Symbol: ${call.symbol}`,
      `Exchange: ${call.exchange}`,
      `Action: ${call.action}`,
      `Call Type: ${call.type}`,
      `Entry: ${call.entry}`,
      `Research Analyst: ${call.researcher_name || call.researcherName || "Research Analyst"}`,
    ].join("\n\n");
    setMessage(baseMessage);
    setSelected(call);
  };
  const publish = async () => {
    if (!selected?.id || !message.trim()) return;
    setPublishing(true); setError("");
    try {
      const result = await publishBrokerCall(selected.id, message.trim());
      setNotice(`Call published. ${result.delivery?.whatsappQueued || 0} WhatsApp and ${result.delivery?.telegramQueued || 0} Telegram deliveries queued.`);
      setSelected(null); await load();
    } catch (publishError) { setError(onboardingError(publishError)); }
    finally { setPublishing(false); }
  };
  return <Box>
    <BrokerPageHeader title="Research Calls" subtitle="Published calls from the Research Analysts associated with your brokerage." readOnly />
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <TextField size="small" fullWidth label="Search calls, symbols or Research Analysts" value={search} onChange={e => setSearch(e.target.value)} />
      <Button onClick={() => void load()} disabled={loading}>Refresh</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {error ? <Alert severity="error" action={<Button onClick={() => void load()}>Retry</Button>}>{error}</Alert>
      : loading ? <Box sx={{ textAlign: "center", p: 5 }}><CircularProgress aria-label="Loading research calls" /></Box>
        : <>
          {calls.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No published calls yet. Add an existing RA or complete RA onboarding to see their published calls here.</Alert>}
          <RecommendationHistory records={calls} showMedia enableExport searchQuery={search} exportFileBaseName="broker-research-calls"
            renderRowActions={call => <Stack direction="row" spacing={1} alignItems="center"><Button size="small" variant="outlined" onClick={() => openOptions(call)}>Options</Button>{call.broker_published && <Chip size="small" color="success" label="Published" />}</Stack>} />
        </>}
    <Dialog open={Boolean(selected)} onClose={() => !publishing && setSelected(null)} fullWidth maxWidth="md">
      <DialogTitle>Broker call options</DialogTitle><DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Review the Research Analyst's call message and broker attribution. Publishing sends it to enabled broker clients; later RA errata and exit messages are sent automatically.</Typography>
        {selected?.status?.toUpperCase() === "CLOSED" && <Alert severity="info" sx={{ mb: 2 }}>This call is closed and can no longer be published to clients.</Alert>}
        {selected && <Alert severity="info" sx={{ mb: 2 }}>The system will append: Distributed by: {selected.broker_name || "Broker"}{selected.broker_sebi_registration ? ` · SEBI Registration No: ${selected.broker_sebi_registration}` : ""}</Alert>}
        <TextField multiline minRows={16} fullWidth label="Call message" value={message} onChange={event => setMessage(event.target.value)} disabled={publishing || selected?.broker_published} />
      </DialogContent><DialogActions><Button disabled={publishing} onClick={() => setSelected(null)}>Close</Button>{!selected?.broker_published && selected?.status?.toUpperCase() !== "CLOSED" && <Button variant="contained" disabled={publishing || !message.trim()} onClick={() => void publish()}>{publishing ? "Publishing..." : "Publish to clients"}</Button>}</DialogActions>
    </Dialog>
  </Box>;
};
export default BrokerResearchCalls;
