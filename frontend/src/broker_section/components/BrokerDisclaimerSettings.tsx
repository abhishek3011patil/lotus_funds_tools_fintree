import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import api from "../../utils/axio";

type BlockKey = "company_name" | "trade_name" | "sebi_registration_no" | "registration_category" | "membership_code" | "registered_address" | "email" | "mobile" | "website" | "authorized_person_name" | "authorized_person_designation" | "compliance_officer_name" | "exchanges" | "segments" | "current_date";
type DisclaimerResponse = { disclaimer: string; disclaimerUpdatedAt: string | null; version: number; blocks: Record<BlockKey, string> };

const blockOptions: { key: BlockKey; label: string }[] = [
  { key: "company_name", label: "Company name" }, { key: "trade_name", label: "Trading name" },
  { key: "sebi_registration_no", label: "SEBI registration" }, { key: "registration_category", label: "Registration category" },
  { key: "membership_code", label: "Membership code" }, { key: "exchanges", label: "Exchanges" },
  { key: "segments", label: "Segments" }, { key: "authorized_person_name", label: "Authorised person" },
  { key: "authorized_person_designation", label: "Authorised designation" }, { key: "compliance_officer_name", label: "Compliance officer" },
  { key: "registered_address", label: "Registered address" }, { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" }, { key: "website", label: "Website" }, { key: "current_date", label: "Current date" },
];

const defaultTemplate = `{{company_name}} (trading as {{trade_name}}) is registered with SEBI under registration number {{sebi_registration_no}} in the category {{registration_category}}.

Investments in securities markets are subject to market risks. Read all related documents carefully before investing. Information shared by {{company_name}} is for informational and educational purposes and must not be treated as a guarantee of returns or personalised investment advice.

Exchange membership: {{exchanges}}. Market segments: {{segments}}.
Compliance contact: {{compliance_officer_name}} | {{email}} | {{mobile}}
Registered address: {{registered_address}}
Website: {{website}}

Last generated: {{current_date}}`;

export default function BrokerDisclaimerSettings() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [template, setTemplate] = useState("");
  const [blocks, setBlocks] = useState<Partial<Record<BlockKey, string>>>({});
  const [version, setVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get<DisclaimerResponse>("/broker/disclaimer").then(({ data }) => { setTemplate(data.disclaimer || ""); setBlocks(data.blocks || {}); setVersion(data.version || 0); setUpdatedAt(data.disclaimerUpdatedAt); }).catch((err: any) => setError(err.response?.data?.message || "Unable to load the disclaimer.")).finally(() => setLoading(false));
  }, []);

  const preview = useMemo(() => template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (token, key: BlockKey) => blocks[key] || `[${blockOptions.find(item => item.key === key)?.label || key}]`), [template, blocks]);
  const insertBlock = (key: BlockKey) => {
    const textarea = inputRef.current;
    const token = `{{${key}}}`;
    if (!textarea) { setTemplate(current => `${current}${current ? " " : ""}${token}`); return; }
    const start = textarea.selectionStart; const end = textarea.selectionEnd;
    setTemplate(current => `${current.slice(0, start)}${token}${current.slice(end)}`);
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + token.length, start + token.length); });
  };
  const save = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data } = await api.put("/broker/disclaimer", { disclaimer: template });
      setVersion(data.version); setUpdatedAt(data.disclaimerUpdatedAt); setSuccess(data.message || "Broker disclaimer saved.");
    } catch (err: any) { setError(err.response?.data?.message || "Unable to save the disclaimer."); }
    finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  return <div style={{ width: "100%" }}>
    <Typography variant="h6" sx={{ fontSize: "20px", fontWeight: 600, color: "#1a1a1a", fontFamily: "sans-serif", mb: 1 }}>
      Broker Disclaimer
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 2.5 }}>
      Create the broker disclaimer shown with your communications. Broker blocks always use the latest approved profile details.
    </Typography>

    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>Add broker details</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {blockOptions.map(block => <Tooltip key={block.key} title={blocks[block.key] || "No approved value available"}><Chip icon={<AddRoundedIcon />} label={block.label} onClick={() => insertBlock(block.key)} variant="outlined" color="primary" /></Tooltip>)}
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Click a block to insert it at the cursor—for example, Company name inserts {"{{company_name}}"}.
      </Typography>
    </Box>

    <TextField inputRef={inputRef} fullWidth multiline rows={8} label="Disclaimer" value={template} onChange={event => setTemplate(event.target.value)} helperText={`${template.length}/10,000 characters`} inputProps={{ maxLength: 10000 }} />

    <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 2 }} alignItems={{ sm: "center" }}>
      <Button variant="contained" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save Disclaimer"}</Button>
      <Button variant="text" startIcon={<RestartAltRoundedIcon />} onClick={() => setTemplate(defaultTemplate)}>Use recommended template</Button>
      <Button variant="text" onClick={() => setShowPreview(current => !current)}>{showPreview ? "Hide Preview" : "Preview"}</Button>
    </Stack>

    {success && <Alert sx={{ mt: 2 }} severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

    <Collapse in={showPreview}>
      <Box sx={{ mt: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={600} mb={1}>Resolved preview</Typography>
        <TextField fullWidth multiline minRows={6} value={preview || "Start writing or use the recommended template to preview the final disclaimer."} InputProps={{ readOnly: true }} />
      </Box>
    </Collapse>

    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
      Version {version || "—"}{updatedAt ? ` • Last saved ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}` : " • Not saved yet"}
    </Typography>
  </div>;
}
