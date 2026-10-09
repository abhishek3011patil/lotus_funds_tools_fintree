import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
  Paper, Radio, RadioGroup, Select, Snackbar, Stack, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import api from "../utils/axio";
import RichTextEditor from "./RichTextEditor";

type Kind = "BLOG" | "VIDEO";
type Visibility = "SUBSCRIBERS" | "PUBLIC";
type Status = "DRAFT" | "PUBLISHED";
type ContentItem = {
  id: string; content_type: Kind; title: string; summary: string; category: string;
  article_body: string | null; youtube_url: string | null; youtube_video_id: string | null;
  visibility: Visibility; status: Status; published_at: string | null; updated_at: string;
  youtube_channel_url: string | null;
};
type FormState = { contentType: Kind; title: string; summary: string; category: string; articleBody: string; youtubeUrl: string; youtubeChannelUrl: string; visibility: Visibility; status: Status };

const emptyForm = (kind: Kind): FormState => ({ contentType: kind, title: "", summary: "", category: "Market education", articleBody: "", youtubeUrl: "", youtubeChannelUrl: "", visibility: "SUBSCRIBERS", status: "DRAFT" });
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "Not published";

export default function ContentManagementPage() {
  const [tab, setTab] = useState<Kind>("BLOG");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm("BLOG"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ items: ContentItem[] }>("/content/manage");
      setItems(data.items || []);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load your content.");
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const visibleItems = useMemo(() => items.filter(item => item.content_type === tab), [items, tab]);
  const openCreate = () => { setEditing(null); setForm(emptyForm(tab)); setError(""); setDialogOpen(true); };
  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({ contentType: item.content_type, title: item.title, summary: item.summary, category: item.category, articleBody: item.article_body || "", youtubeUrl: item.youtube_url || "", youtubeChannelUrl: item.youtube_channel_url || "", visibility: item.visibility, status: item.status });
    setError(""); setDialogOpen(true);
  };
  const save = async (status: Status) => {
    setSaving(true); setError("");
    try {
      const payload = { ...form, status };
      const response = editing ? await api.put(`/content/manage/${editing.id}`, payload) : await api.post("/content/manage", payload);
      setNotice(response.data.message || "Content saved."); setDialogOpen(false); await load();
    } catch (err: any) { setError(err.response?.data?.message || "Unable to save content."); }
    finally { setSaving(false); }
  };
  const remove = async (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try { await api.delete(`/content/manage/${item.id}`); setNotice("Content deleted."); await load(); }
    catch (err: any) { setError(err.response?.data?.message || "Unable to delete content."); }
  };

  return <Stack spacing={3}>
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, color: "#fff", background: "linear-gradient(120deg,#243B8F,#5271FF 68%,#22C55E 145%)" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
        <Box><Typography variant="overline" sx={{ opacity: .78, letterSpacing: 1.5 }}>PUBLISH TO CLIENT INSIGHTS</Typography><Typography variant="h4" fontWeight={800}>Content Management</Typography><Typography sx={{ mt: .75, opacity: .9 }}>Create useful blogs and YouTube videos for subscribers or make selected content public for demos.</Typography></Box>
        <Button variant="contained" color="inherit" startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ color: "#3155D9", fontWeight: 800, alignSelf: { xs: "stretch", sm: "center" } }}>New {tab === "BLOG" ? "blog" : "video"}</Button>
      </Stack>
    </Paper>

    {error && !dialogOpen && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", borderColor: "#E2E8F0" }}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab value="BLOG" icon={<ArticleRoundedIcon />} iconPosition="start" label={`Blogs (${items.filter(i => i.content_type === "BLOG").length})`} />
        <Tab value="VIDEO" icon={<VideoLibraryRoundedIcon />} iconPosition="start" label={`Videos (${items.filter(i => i.content_type === "VIDEO").length})`} />
      </Tabs>
    </Paper>

    {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box> : visibleItems.length === 0 ?
      <Paper variant="outlined" sx={{ py: 8, px: 3, borderRadius: 3, textAlign: "center", borderStyle: "dashed" }}>
        {tab === "BLOG" ? <ArticleRoundedIcon color="disabled" sx={{ fontSize: 48 }} /> : <VideoLibraryRoundedIcon color="disabled" sx={{ fontSize: 48 }} />}
        <Typography variant="h6" fontWeight={800} mt={1}>No {tab === "BLOG" ? "blogs" : "videos"} yet</Typography>
        <Typography color="text.secondary" mb={2}>Start a draft, preview the details, and publish when it is ready.</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>Create {tab === "BLOG" ? "blog" : "video"}</Button>
      </Paper> :
      <Grid container spacing={2.5}>{visibleItems.map(item => <Grid key={item.id} size={{ xs: 12, md: 6, xl: 4 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%", borderColor: "#E2E8F0" }}>
          <Stack spacing={1.5} height="100%">
            {item.content_type === "VIDEO" && item.youtube_video_id && <Box component="img" src={`https://i.ytimg.com/vi/${item.youtube_video_id}/hqdefault.jpg`} alt="" sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 2 }} />}
            <Stack direction="row" gap={1} flexWrap="wrap"><Chip size="small" label={item.status === "PUBLISHED" ? "Published" : "Draft"} color={item.status === "PUBLISHED" ? "success" : "default"} /><Chip size="small" variant="outlined" icon={item.visibility === "PUBLIC" ? <PublicRoundedIcon /> : <LockOutlinedIcon />} label={item.visibility === "PUBLIC" ? "Public demo" : "Subscribers only"} /><Chip size="small" variant="outlined" label={item.category} /></Stack>
            <Typography variant="h6" fontWeight={800}>{item.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{item.summary}</Typography>
            <Typography variant="caption" color="text.secondary">{item.status === "PUBLISHED" ? `Published ${formatDate(item.published_at)}` : `Updated ${formatDate(item.updated_at)}`}</Typography>
            <Stack direction="row" justifyContent="flex-end"><IconButton aria-label="Edit" onClick={() => openEdit(item)}><EditOutlinedIcon /></IconButton><IconButton aria-label="Delete" color="error" onClick={() => void remove(item)}><DeleteOutlineRoundedIcon /></IconButton></Stack>
          </Stack>
        </Paper>
      </Grid>)}</Grid>}

    <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="md">
      <DialogTitle fontWeight={800}>{editing ? "Edit" : "Create"} {form.contentType === "BLOG" ? "blog" : "video"}</DialogTitle>
      <DialogContent dividers><Stack spacing={2.2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Tabs value={form.contentType} onChange={(_, value) => setForm(emptyForm(value))} variant="fullWidth"><Tab value="BLOG" icon={<ArticleRoundedIcon />} iconPosition="start" label="Blog" /><Tab value="VIDEO" icon={<VideoLibraryRoundedIcon />} iconPosition="start" label="YouTube video" /></Tabs>
        <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} inputProps={{ maxLength: 180 }} required />
        <TextField label="Short summary" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} multiline minRows={2} helperText={`${form.summary.length}/500 — shown on the Insights card`} inputProps={{ maxLength: 500 }} required />
        <TextField label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} inputProps={{ maxLength: 80 }} required />
        {form.contentType === "BLOG" ? <RichTextEditor value={form.articleBody} onChange={articleBody => setForm(current => ({ ...current, articleBody }))} /> : <Stack spacing={2}><TextField label="YouTube video link" value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." helperText="YouTube videos, Shorts, Live, and youtu.be links are supported." required /><TextField label="YouTube channel link (optional)" value={form.youtubeChannelUrl} onChange={e => setForm({ ...form, youtubeChannelUrl: e.target.value })} placeholder="https://www.youtube.com/@yourchannel" helperText="Adds a direct Visit channel action in client Insights." /></Stack>}
        <Box><Typography variant="subtitle2" fontWeight={800} mb={.5}>Who can see this?</Typography><RadioGroup value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value as Visibility })}><FormControlLabel value="SUBSCRIBERS" control={<Radio />} label="Subscribers only — active clients subscribed to you" /><FormControlLabel value="PUBLIC" control={<Radio />} label="Public demo — all signed-in clients" /></RadioGroup></Box>
        {editing && <FormControl><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}><MenuItem value="DRAFT">Draft</MenuItem><MenuItem value="PUBLISHED">Published</MenuItem></Select></FormControl>}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="outlined" onClick={() => void save("DRAFT")} disabled={saving}>Save draft</Button><Button variant="contained" onClick={() => void save("PUBLISHED")} disabled={saving}>{saving ? "Saving…" : "Publish"}</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
  </Stack>;
}
