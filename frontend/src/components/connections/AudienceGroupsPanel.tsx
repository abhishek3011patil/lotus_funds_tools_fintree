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
  FormControlLabel,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
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
const RECIPIENTS_PER_PAGE = 6;

type RecipientPickerProps = {
  type: AudienceMemberType;
  title: string;
  items: AudienceConnection[];
  selected: Set<string>;
  onToggle: (type: AudienceMemberType, id: string) => void;
  emptyMessage: string;
  helper?: string;
};

const RecipientPicker = ({ type, title, items, selected, onToggle, emptyMessage, helper }: RecipientPickerProps) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => items.filter(item => [
    item.name, item.email, item.sebiRegistration, item.entityType, item.channelDetail,
  ].some(value => String(value || "").toLowerCase().includes(normalizedQuery))), [items, normalizedQuery]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / RECIPIENTS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * RECIPIENTS_PER_PAGE, safePage * RECIPIENTS_PER_PAGE);
  const selectedCount = items.filter(item => selected.has(memberKey(type, item.id))).length;
  const allVisibleSelected = visible.length > 0 && visible.every(item => selected.has(memberKey(type, item.id)));

  const detail = (item: AudienceConnection) => {
    if (type === "CLIENT") return item.email || "Connected client";
    if (type === "BROKER") return item.sebiRegistration || "Connected broker";
    if (type === "TELEGRAM") return `${item.entityType || "Telegram"} · ${item.channelDetail || "Active participant"}`;
    return item.channelDetail || "WhatsApp participant";
  };

  return <Stack spacing={1.5} sx={{ pt: 2 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
      <Box><Typography fontWeight={800}>{title}</Typography>{helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}</Box>
      <Chip size="small" color={selectedCount ? "primary" : "default"} label={`${selectedCount} selected`} />
    </Stack>
    <TextField
      size="small"
      fullWidth
      value={query}
      onChange={event => { setQuery(event.target.value); setPage(1); }}
      label={`Search ${title.toLowerCase()}`}
      placeholder="Search by name or contact detail"
      InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
    />
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">{filtered.length} of {items.length} available</Typography>
      {visible.length > 0 && <Button size="small" onClick={() => visible.forEach(item => {
        const isSelected = selected.has(memberKey(type, item.id));
        if (allVisibleSelected ? isSelected : !isSelected) onToggle(type, item.id);
      })}>{allVisibleSelected ? "Clear this page" : "Select this page"}</Button>}
    </Stack>
    {items.length === 0 ? <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}><Typography color="text.secondary">{emptyMessage}</Typography></Paper>
      : filtered.length === 0 ? <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}><Typography color="text.secondary">No matches for “{query}”.</Typography></Paper>
      : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
        {visible.map(item => <Paper key={item.id} variant="outlined" sx={{ px: 1.25, py: .5, borderColor: selected.has(memberKey(type, item.id)) ? "primary.main" : "divider", bgcolor: selected.has(memberKey(type, item.id)) ? "action.selected" : "background.paper" }}>
          <FormControlLabel sx={{ m: 0, width: "100%", alignItems: "flex-start" }} control={<Checkbox checked={selected.has(memberKey(type, item.id))} onChange={() => onToggle(type, item.id)} />} label={<Box sx={{ py: .75, minWidth: 0 }}><Typography noWrap fontWeight={650}>{item.name}</Typography><Typography noWrap variant="caption" color="text.secondary">{detail(item)}</Typography></Box>} />
        </Paper>)}
      </Box>}
    {pageCount > 1 && <Pagination count={pageCount} page={safePage} onChange={(_, nextPage) => setPage(nextPage)} size="small" color="primary" sx={{ alignSelf: "center", pt: .5 }} />}
  </Stack>;
};

const AudienceGroupsPanel = () => {
  const [groups, setGroups] = useState<AudienceGroup[]>([]);
  const [clients, setClients] = useState<AudienceConnection[]>([]);
  const [brokers, setBrokers] = useState<AudienceConnection[]>([]);
  const [telegramParticipants, setTelegramParticipants] = useState<AudienceConnection[]>([]);
  const [whatsAppParticipants, setWhatsAppParticipants] = useState<AudienceConnection[]>([]);
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
  const [recipientTab, setRecipientTab] = useState<AudienceMemberType>("CLIENT");
  const [editorSession, setEditorSession] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AudienceGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [nextGroups, connections] = await Promise.all([fetchAudienceGroups(), fetchAudienceConnections()]);
      setGroups(nextGroups); setClients(connections.clients); setBrokers(connections.brokers);
      setTelegramParticipants(connections.telegram); setWhatsAppParticipants(connections.whatsapp);
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
    setDialogError(""); setRecipientTab("CLIENT"); setEditorSession(current => current + 1); setDialogOpen(true);
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
    if (selectedMembers.length === 0) { setDialogError("Select at least one recipient."); return; }
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
      <Box><Typography variant="h5">Audience groups</Typography><Typography color="text.secondary">Combine clients, brokers, and channel participants, then select a group when publishing a call.</Typography></Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => openEditor()}>Create group</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {error && <Alert severity="error" action={<Button color="inherit" onClick={() => void load()}>Retry</Button>}>{error}</Alert>}
    {groups.length === 0 ? <Paper variant="outlined" sx={{ py: 7, px: 3, textAlign: "center" }}><GroupsOutlinedIcon sx={{ fontSize: 44, color: "text.secondary" }} /><Typography variant="h6" sx={{ mt: 1 }}>No groups yet</Typography><Typography color="text.secondary">Create a group for a desk, strategy, plan, or distribution segment.</Typography></Paper>
      : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {groups.map(group => {
          const clientCount = group.members.filter(member => member.type === "CLIENT").length;
          const brokerCount = group.members.filter(member => member.type === "BROKER").length;
          const telegramCount = group.members.filter(member => member.type === "TELEGRAM").length;
          const whatsAppCount = group.members.filter(member => member.type === "WHATSAPP").length;
          return <Paper key={group.id} variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}><Box><Typography variant="h6">{group.name}</Typography><Typography variant="body2" color="text.secondary">{group.description || "No description"}</Typography></Box><Stack direction="row" spacing={.5} useFlexGap flexWrap="wrap" justifyContent="flex-end"><Chip size="small" label={`${clientCount} clients`} /><Chip size="small" label={`${brokerCount} brokers`} /><Chip size="small" label={`${telegramCount} Telegram`} /><Chip size="small" label={`${whatsAppCount} WhatsApp`} /></Stack></Stack>
            <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>{group.members.slice(0, 6).map(member => <Chip key={memberKey(member.type, member.id)} size="small" variant="outlined" label={member.name} />)}{group.members.length > 6 && <Chip size="small" label={`+${group.members.length - 6} more`} />}</Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}><Button size="small" variant="outlined" onClick={() => openEditor(group)}>Edit</Button><Button size="small" color="error" onClick={() => setDeleteTarget(group)}>Delete</Button></Stack>
          </Paper>;
        })}
      </Box>}

    <Dialog open={dialogOpen} onClose={() => { if (!saving) setDialogOpen(false); }} fullWidth maxWidth="md">
      <DialogTitle>{editing ? "Edit audience group" : "Create audience group"}</DialogTitle>
      <DialogContent dividers><Stack spacing={2} key={editorSession}>
        {dialogError && <Alert severity="error">{dialogError}</Alert>}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1.4fr)" }, gap: 1.5 }}>
          <TextField autoFocus label="Group name" value={name} onChange={event => setName(event.target.value)} inputProps={{ maxLength: 80 }} required />
          <TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} inputProps={{ maxLength: 240 }} />
        </Box>
        <Paper variant="outlined" sx={{ px: 1.5, py: 1.25, bgcolor: "background.default" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1}>
            <Box><Typography fontWeight={800}>Choose recipients</Typography><Typography variant="body2" color="text.secondary">Search and select recipients from each channel.</Typography></Box>
            <Chip color={selected.size ? "primary" : "default"} label={`${selected.size} total selected`} />
          </Stack>
        </Paper>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={recipientTab} onChange={(_, value: AudienceMemberType) => setRecipientTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Recipient type">
            <Tab value="CLIENT" label={`Clients (${clients.filter(item => selected.has(memberKey("CLIENT", item.id))).length}/${clients.length})`} />
            <Tab value="BROKER" label={`Brokers (${brokers.filter(item => selected.has(memberKey("BROKER", item.id))).length}/${brokers.length})`} />
            <Tab value="TELEGRAM" label={`Telegram (${telegramParticipants.filter(item => selected.has(memberKey("TELEGRAM", item.id))).length}/${telegramParticipants.length})`} />
            <Tab value="WHATSAPP" label={`WhatsApp (${whatsAppParticipants.filter(item => selected.has(memberKey("WHATSAPP", item.id))).length}/${whatsAppParticipants.length})`} />
          </Tabs>
        </Box>
        <Box hidden={recipientTab !== "CLIENT"}><RecipientPicker type="CLIENT" title="Clients" items={clients} selected={selected} onToggle={toggle} emptyMessage="No active client connections." /></Box>
        <Box hidden={recipientTab !== "BROKER"}><RecipientPicker type="BROKER" title="Brokers" items={brokers} selected={selected} onToggle={toggle} emptyMessage="No active broker connections." /></Box>
        <Box hidden={recipientTab !== "TELEGRAM"}><RecipientPicker type="TELEGRAM" title="Telegram participants" items={telegramParticipants} selected={selected} onToggle={toggle} emptyMessage="No active Telegram participants. Add them from Settings first." /></Box>
        <Box hidden={recipientTab !== "WHATSAPP"}><RecipientPicker type="WHATSAPP" title="WhatsApp participants" items={whatsAppParticipants} selected={selected} onToggle={toggle} emptyMessage="No eligible WhatsApp participants. Add or confirm them from Settings first." helper="Only active participants with confirmed consent are available." /></Box>
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
