import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  createAudienceGroup,
  deleteAudienceGroup,
  fetchAudienceConnections,
  fetchAudienceGroups,
  updateAudienceGroup,
  type AudienceConnection,
  type AudienceGroup,
  type AudienceMemberType,
} from "../../services/audienceGroups.service";

const apiMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;

const memberKey = (type: AudienceMemberType, id: string) => `${type}:${id}`;

const AudienceGroupsPanel = () => {
  const [groups, setGroups] = useState<AudienceGroup[]>([]);
  const [clients, setClients] = useState<AudienceConnection[]>([]);
  const [brokers, setBrokers] = useState<AudienceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AudienceGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AudienceGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [nextGroups, connections] = await Promise.all([fetchAudienceGroups(), fetchAudienceConnections()]);
      setGroups(nextGroups); setClients(connections.clients); setBrokers(connections.brokers);
    } catch (requestError) { setError(apiMessage(requestError, "Unable to load audience groups.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the analyst's server-backed groups when the tab opens.
    void load();
  }, [load]);

  const openEditor = (group?: AudienceGroup) => {
    setEditing(group || null); setName(group?.name || ""); setDescription(group?.description || "");
    setSelected(new Set((group?.members || []).map(member => memberKey(member.type, member.id))));
    setDialogError(""); setDialogOpen(true);
  };

  const toggle = (type: AudienceMemberType, id: string) => {
    const key = memberKey(type, id);
    setSelected(current => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const selectedMembers = useMemo(() => [...selected].map(key => {
    const [type, id] = key.split(":");
    return { type: type as AudienceMemberType, id };
  }), [selected]);

  const save = async () => {
    if (name.trim().length < 2) { setDialogError("Enter a group name with at least 2 characters."); return; }
    if (selectedMembers.length === 0) { setDialogError("Select at least one client or broker."); return; }
    setSaving(true); setDialogError("");
    const input = { name: name.trim(), description: description.trim(), members: selectedMembers };
    try {
      if (editing) await updateAudienceGroup(editing.id, input); else await createAudienceGroup(input);
      setDialogOpen(false); setNotice(editing ? "Audience group updated." : "Audience group created."); await load();
    } catch (requestError) { setDialogError(apiMessage(requestError, "Unable to save audience group.")); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { await deleteAudienceGroup(deleteTarget.id); setDeleteTarget(null); setNotice("Audience group deleted."); await load(); }
    catch (requestError) { setError(apiMessage(requestError, "Unable to delete audience group.")); }
    finally { setSaving(false); }
  };

  if (loading && groups.length === 0) return <Paper variant="outlined" sx={{ py: 8, textAlign: "center" }}><CircularProgress size={30} /></Paper>;

  return <Stack spacing={2.5}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
      <Box><Typography variant="h5">Audience groups</Typography><Typography color="text.secondary">Combine connected clients and brokers, then select a group when publishing a call.</Typography></Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => openEditor()}>Create group</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {error && <Alert severity="error" action={<Button color="inherit" onClick={() => void load()}>Retry</Button>}>{error}</Alert>}
    {groups.length === 0 ? <Paper variant="outlined" sx={{ py: 7, px: 3, textAlign: "center" }}><GroupsOutlinedIcon sx={{ fontSize: 44, color: "text.secondary" }} /><Typography variant="h6" sx={{ mt: 1 }}>No groups yet</Typography><Typography color="text.secondary">Create a group for a desk, strategy, plan, or distribution segment.</Typography></Paper>
      : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {groups.map(group => {
          const clientCount = group.members.filter(member => member.type === "CLIENT").length;
          const brokerCount = group.members.filter(member => member.type === "BROKER").length;
          return <Paper key={group.id} variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}><Box><Typography variant="h6">{group.name}</Typography><Typography variant="body2" color="text.secondary">{group.description || "No description"}</Typography></Box><Stack direction="row" spacing={.5}><Chip size="small" label={`${clientCount} clients`} /><Chip size="small" label={`${brokerCount} brokers`} /></Stack></Stack>
            <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>{group.members.slice(0, 6).map(member => <Chip key={memberKey(member.type, member.id)} size="small" variant="outlined" label={member.name} />)}{group.members.length > 6 && <Chip size="small" label={`+${group.members.length - 6} more`} />}</Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}><Button size="small" variant="outlined" onClick={() => openEditor(group)}>Edit</Button><Button size="small" color="error" onClick={() => setDeleteTarget(group)}>Delete</Button></Stack>
          </Paper>;
        })}
      </Box>}

    <Dialog open={dialogOpen} onClose={() => { if (!saving) setDialogOpen(false); }} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Edit audience group" : "Create audience group"}</DialogTitle>
      <DialogContent dividers><Stack spacing={2}>
        {dialogError && <Alert severity="error">{dialogError}</Alert>}
        <TextField autoFocus label="Group name" value={name} onChange={event => setName(event.target.value)} inputProps={{ maxLength: 80 }} required />
        <TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} inputProps={{ maxLength: 240 }} multiline minRows={2} />
        <Typography fontWeight={750}>Clients</Typography>
        {clients.length === 0 ? <Typography color="text.secondary">No active client connections.</Typography> : clients.map(client => <FormControlLabel key={client.id} control={<Checkbox checked={selected.has(memberKey("CLIENT", client.id))} onChange={() => toggle("CLIENT", client.id)} />} label={<Box><Typography>{client.name}</Typography><Typography variant="caption" color="text.secondary">{client.email || "Connected client"}</Typography></Box>} />)}
        <Divider />
        <Typography fontWeight={750}>Brokers</Typography>
        {brokers.length === 0 ? <Typography color="text.secondary">No active broker connections.</Typography> : brokers.map(broker => <FormControlLabel key={broker.id} control={<Checkbox checked={selected.has(memberKey("BROKER", broker.id))} onChange={() => toggle("BROKER", broker.id)} />} label={<Box><Typography>{broker.name}</Typography><Typography variant="caption" color="text.secondary">{broker.sebiRegistration || "Connected broker"}</Typography></Box>} />)}
      </Stack></DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save group"}</Button></DialogActions>
    </Dialog>

    <Dialog open={deleteTarget !== null} onClose={() => { if (!saving) setDeleteTarget(null); }} maxWidth="xs" fullWidth>
      <DialogTitle>Delete audience group?</DialogTitle><DialogContent><Typography>Delete “{deleteTarget?.name}”? Calls already published to this group will keep their historical audience snapshot.</Typography></DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button color="error" variant="contained" disabled={saving} onClick={() => void remove()}>Delete</Button></DialogActions>
    </Dialog>
  </Stack>;
};

export default AudienceGroupsPanel;
