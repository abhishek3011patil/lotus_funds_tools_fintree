import { Alert, Box, Button, Card, CardContent, Grid, List, ListItemButton, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { disclaimerService } from "./disclaimer.service";
import DisclaimerStatusChip from "./DisclaimerStatusChip";
import DisclaimerVersionDetails from "./DisclaimerVersionDetails";
import type { DisclaimerVersion } from "./disclaimer.types";

const DisclaimerVersionList = () => {
  const [versions, setVersions] = useState<DisclaimerVersion[]>([]);
  const [selected, setSelected] = useState<DisclaimerVersion | null>(null);
  const [draftText, setDraftText] = useState("");
  const [preview, setPreview] = useState<DisclaimerVersion | null>(null);
  useEffect(() => { disclaimerService.getDisclaimerVersions().then((items) => { setVersions(items); setSelected(items[0] ?? null); }); }, []);
  const createPreview = async () => { if (!draftText.trim()) return; setPreview(await disclaimerService.createDisclaimerDraft({ ownerType: "PLATFORM", ownerId: "platform", text: draftText.trim() })); };
  return <Box><Typography variant="h4" fontWeight={700}>Disclaimer Versions</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Platform disclaimer version-management frontend foundation.</Typography><Stack spacing={1} sx={{ mb: 3 }}><Alert severity="warning">Activating a new disclaimer affects future publications only.</Alert><Alert severity="info">Historical research calls retain their original disclaimer version and text.</Alert></Stack><Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}><Card variant="outlined"><List>{versions.map((item) => <ListItemButton selected={selected?.id === item.id} key={item.id} onClick={() => { setSelected(item); setPreview(null); }}><ListItemText primary={`Version ${item.version}`} secondary={item.effectiveFrom ?? "Not effective"} /><DisclaimerStatusChip status={item.status} /></ListItemButton>)}</List></Card></Grid><Grid size={{ xs: 12, md: 8 }}>{(preview ?? selected) && <DisclaimerVersionDetails version={(preview ?? selected)!} />}</Grid></Grid><Card variant="outlined" sx={{ mt: 3 }}><CardContent><Typography variant="h6">Draft editor placeholder</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Platform-only preview. Broker and RA disclaimer editing is not exposed here.</Typography><TextField fullWidth multiline minRows={5} label="Draft disclaimer text" value={draftText} onChange={(e) => setDraftText(e.target.value)} /><Stack direction="row" spacing={1} sx={{ mt: 2 }}><Button variant="contained" onClick={createPreview} disabled={!draftText.trim()}>Preview draft</Button><Button disabled>Activate (API not connected)</Button></Stack></CardContent></Card></Box>;
};
export default DisclaimerVersionList;
