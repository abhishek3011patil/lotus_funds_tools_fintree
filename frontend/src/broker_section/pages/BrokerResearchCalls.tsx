import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import RecommendationHistory, { type ApiHistoryRecord, type HistoryRecord } from "../../pages/common/RecommendationHistory";
import { getBrokerCalls, onboardingError, publishBrokerCall } from "../services/brokerOnboarding.service";
import { fetchResearchCallTemplates, type ResearchCallTemplateMap } from "../../services/researchCallTemplate.service";
import { createDefaultCallTemplate, formatResearchCallMessage, type ResearchCallMessageType } from "../../utils/researchCallTemplate.utils";

const resolveBrokerDisclaimer = (call: HistoryRecord) => {
  const values: Record<string, string> = {
    company_name: call.broker_legal_name || call.broker_name || "",
    trade_name: call.broker_trade_name || call.broker_name || "",
    sebi_registration_no: call.broker_sebi_registration || "",
    registration_category: call.broker_registration_category || "",
    membership_code: call.broker_membership_code || "",
    registered_address: call.broker_registered_address || "",
    email: call.broker_email || "", mobile: call.broker_mobile || "", website: call.broker_website || "",
    authorized_person_name: call.broker_authorized_person_name || "",
    authorized_person_designation: call.broker_authorized_person_designation || "",
    compliance_officer_name: call.broker_compliance_officer_name || "",
    exchanges: call.broker_exchanges || "", segments: call.broker_segments || "",
    current_date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
  };
  const template = call.broker_disclaimer_template || "Investments in securities markets are subject to market risks. Read all related documents carefully before investing.";
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => values[key] || "N/A");
};

const BrokerResearchCalls = () => {
  const [calls, setCalls] = useState<ApiHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const [templates, setTemplates] = useState<ResearchCallTemplateMap>({ NEW_CALL: null, ERRATA: null });
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const [nextCalls, nextTemplates] = await Promise.all([getBrokerCalls(), token ? fetchResearchCallTemplates(token, "BROKER") : Promise.resolve({ NEW_CALL: null, ERRATA: null } as ResearchCallTemplateMap)]);
      setCalls(nextCalls); setTemplates(nextTemplates);
    }
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
    const fallbackMessage = String(call.published_message_text || "").trim() || [
      "RESEARCH RECOMMENDATION",
      `Stock Name: ${call.instrument}`,
      `Symbol: ${call.symbol}`,
      `Exchange: ${call.exchange}`,
      `Action: ${call.action}`,
      `Call Type: ${call.type}`,
      `Entry: ${call.entry}`,
      `Research Analyst: ${call.researcher_name || call.researcherName || "Research Analyst"}`,
    ].join("\n\n");
    const messageType: ResearchCallMessageType = String(call.version_type || "").toUpperCase() === "ERRATA" ? "ERRATA" : "NEW_CALL";
    try {
      const template = templates[messageType] || createDefaultCallTemplate(messageType, "BROKER");
      const generated = formatResearchCallMessage(template, {
        publishedAt: call.dateTime, instrument: call.instrument, symbol: call.symbol, exchange: call.exchange,
        action: call.action, callType: call.type, entry: String(call.entry ?? ""),
        targets: [call.target_price, call.target_price_2, call.target_price_3],
        stopLosses: [call.stop_loss, call.stop_loss_2, call.stop_loss_3], expiry: call.expiry || undefined,
        timeHorizon: call.category, holdingPeriod: call.holding_period || undefined, rationale: call.rationale || undefined,
        underlyingStudy: call.underlying_study || undefined, remarks: call.research_remarks || undefined,
        errataReason: call.errata_reason || undefined,
      }, {
        fullName: call.researcher_name || call.researcherName || "Research Analyst",
        organizationName: call.researcher_organization || undefined,
        sebiRegistrationNumber: call.researcher_sebi_registration || undefined,
        contactNumber: call.researcher_contact || undefined, email: call.researcher_email || undefined,
      }, messageType, "BROKER", {
        companyName: call.broker_trade_name || call.broker_legal_name || call.broker_name,
        sebiRegistrationNumber: call.broker_sebi_registration || undefined,
        disclaimer: resolveBrokerDisclaimer(call),
      });
      setMessage(generated);
    } catch { setMessage(fallbackMessage); }
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
        <Typography color="text.secondary" sx={{ mb: 2 }}>Review the message generated from your Broker Call Message Template. The Research Analyst name is selected dynamically from this call and the latest Broker Disclaimer is inserted automatically.</Typography>
        {selected?.status?.toUpperCase() === "CLOSED" && <Alert severity="info" sx={{ mb: 2 }}>This call is closed and can no longer be published to clients.</Alert>}
        {selected && <Alert severity="info" sx={{ mb: 2 }}>The system will append: Distributed by: {selected.broker_name || "Broker"}{selected.broker_sebi_registration ? ` · SEBI Registration No: ${selected.broker_sebi_registration}` : ""}</Alert>}
        <TextField multiline minRows={16} fullWidth label="Call message" value={message} onChange={event => setMessage(event.target.value)} disabled={publishing || selected?.broker_published} />
      </DialogContent><DialogActions><Button disabled={publishing} onClick={() => setSelected(null)}>Close</Button>{!selected?.broker_published && selected?.status?.toUpperCase() !== "CLOSED" && <Button variant="contained" disabled={publishing || !message.trim()} onClick={() => void publish()}>{publishing ? "Publishing..." : "Publish to clients"}</Button>}</DialogActions>
    </Dialog>
  </Box>;
};
export default BrokerResearchCalls;
