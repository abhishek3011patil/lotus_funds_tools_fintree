import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, Paper, Stack, Tab, Tabs, Typography,
} from "@mui/material";

interface DisclaimerItem {
  id: string;
  version_number: number;
  disclaimer_text: string;
  created_at: string;
}

interface TemplateVersion {
  id: string;
  messageType: "NEW_CALL" | "ERRATA";
  versionNumber: number;
  destination: "DEFAULT" | "GROUP";
  templateName: string | null;
  groupName: string | null;
  participants: Array<{ type: string; name: string; detail?: string | null }>;
  template: { canvasText?: string; blocks?: Array<{ type: string; fieldKey?: string; text?: string; enabled?: boolean }> };
  importedCurrent: boolean;
  createdAt: string;
}

interface RAInfo { name: string; username: string; email: string }

const dateTime = (value: string) => new Date(value).toLocaleString("en-IN");

const DisclaimerHistory = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState<DisclaimerItem[]>([]);
  const [templates, setTemplates] = useState<TemplateVersion[]>([]);
  const [ra, setRa] = useState<RAInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"TEMPLATES" | "DISCLAIMERS">("TEMPLATES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/history/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load saved versions.");
        setHistory(data.history || []);
        setTemplates(data.messageTemplateHistory || []);
        setRa(data.ra || null);
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(cause.message || "Could not load saved versions.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1100, mx: "auto" }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700}>RA message and disclaimer versions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Read-only record of saved layouts and disclaimers.
        </Typography>
        {ra && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ra.name} · {ra.username} · {ra.email}
        </Typography>}
        <Tabs value={activeTab} onChange={(_, tab: "TEMPLATES" | "DISCLAIMERS") => setActiveTab(tab)}
          variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label={`Message templates (${templates.length})`} value="TEMPLATES" />
          <Tab label={`Disclaimers (${history.length})`} value="DISCLAIMERS" />
        </Tabs>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <Typography>Loading saved versions...</Typography> : activeTab === "DISCLAIMERS" ? (
          history.length === 0 ? <Typography color="text.secondary">No saved disclaimer versions.</Typography> :
          <Stack spacing={2}>
            {history.map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
                <Chip label={`Version ${item.version_number}`} color="primary" size="small" sx={{ alignSelf: "flex-start" }} />
                <Typography variant="caption" color="text.secondary">Saved {dateTime(item.created_at)}</Typography>
              </Stack>
              <Typography component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", fontSize: "0.875rem" }}>
                {item.disclaimer_text}
              </Typography>
            </Paper>)}
          </Stack>
        ) : templates.length === 0 ? <Typography color="text.secondary">No saved message template versions.</Typography> : (
          <Stack spacing={2}>
            {templates.map((item) => <Paper key={item.id} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label={`Version ${item.versionNumber}`} color="primary" size="small" />
                <Chip label={item.messageType === "ERRATA" ? "Errata" : "New recommendation"} size="small" />
                <Chip label={item.destination === "GROUP" ? "Group" : "Default"} size="small" variant="outlined" />
                {item.importedCurrent && <Chip label="Imported current layout" size="small" variant="outlined" />}
                <Typography variant="caption" color="text.secondary">Saved {dateTime(item.createdAt)}</Typography>
              </Stack>
              {item.templateName && <Typography fontWeight={700}>{item.templateName}</Typography>}
              {item.destination === "GROUP" && <Box sx={{ my: 1.5 }}>
                <Typography variant="body2"><strong>Group:</strong> {item.groupName || "Group no longer available"}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Participants at save:</strong> {item.participants?.length || 0}</Typography>
                {item.participants?.length > 0 && <Stack gap={0.75} sx={{ mt: 1 }}>
                  {item.participants.map((participant, index) =>
                    <Typography key={`${item.id}-${index}`} variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {participant.type} · {participant.name}{participant.detail ? ` · ${participant.detail}` : ""}
                    </Typography>)}
                </Stack>}
              </Box>}
              <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.75 }}>Saved message layout</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: "#F8FAFF", border: "1px solid #E0E7FF", borderRadius: 1.5,
                whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "monospace", fontSize: "0.78rem" }}>
                {item.template?.canvasText || JSON.stringify(item.template, null, 2)}
              </Box>
            </Paper>)}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default DisclaimerHistory;
