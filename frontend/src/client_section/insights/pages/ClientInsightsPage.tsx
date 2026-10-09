import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import api from "../../../utils/axio";
import InsightCard from "../components/InsightCard";
import type { InsightItem, InsightType } from "../types";
import AuthenticatedRichText from "../../../content/AuthenticatedRichText";
import { Button } from "@mui/material";

type ApiItem = { id: string; content_type: InsightType; title: string; summary: string; category: string; article_body: string | null; youtube_url: string | null; youtube_video_id: string | null; youtube_channel_url: string | null; visibility: "SUBSCRIBERS" | "PUBLIC"; author_name: string; author_role: string; author_organization: string | null; published_at: string };
const displayDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

const ClientInsightsPage = () => {
  const [items, setItems] = useState<InsightItem[]>([]);
  const [tab, setTab] = useState<"ALL" | InsightType>("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InsightItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ items: ApiItem[] }>("/content/client", { signal: controller.signal }).then(({ data }) => {
      setItems((data.items || []).map(item => ({ id: item.id, type: item.content_type, title: item.title, summary: item.summary, category: item.category, body: item.article_body, youtubeUrl: item.youtube_url, youtubeVideoId: item.youtube_video_id, youtubeChannelUrl: item.youtube_channel_url, visibility: item.visibility, author: item.author_name || "Tarkashh publisher", authorRole: item.author_role, authorOrganization: item.author_organization, publishedAt: displayDate(item.published_at) })));
    }).catch((err: any) => {
      if (err.code !== "ERR_CANCELED") setError(err.response?.data?.message || "Unable to load insights.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => (tab === "ALL" || item.type === tab) && (!needle || `${item.title} ${item.summary} ${item.category} ${item.author}`.toLowerCase().includes(needle)));
  }, [items, tab, query]);

  return <Stack spacing={3}>
    <Box sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, color: "#fff", background: "linear-gradient(115deg,#3155D9 0%,#5271FF 62%,#15803D 160%)" }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}><Box sx={{ bgcolor: "rgba(255,255,255,.16)", borderRadius: 2.5, p: 1.4, display: "flex", width: "fit-content" }}><AutoStoriesRoundedIcon sx={{ fontSize: 32 }} /></Box><Box><Typography variant="h4" fontWeight={800}>Insights</Typography><Typography sx={{ mt: .5, opacity: .9, maxWidth: 650 }}>Blogs and videos from your subscribed research analysts and brokers, plus selected public content.</Typography></Box></Stack></Box>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, borderColor: "#E2E8F0" }}><Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ md: "center" }}><Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ flexGrow: 1 }} variant="scrollable"><Tab value="ALL" label="All" /><Tab value="BLOG" icon={<ArticleRoundedIcon />} iconPosition="start" label="Blogs" /><Tab value="VIDEO" icon={<VideoLibraryOutlinedIcon />} iconPosition="start" label="Videos" /></Tabs><TextField size="small" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search insights" sx={{ minWidth: { md: 280 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} /></Stack></Paper>
    {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box> : visible.length ? <Grid container spacing={2.5}>{visible.map(item => <Grid key={item.id} size={{ xs: 12, sm: 6, xl: 4 }}><InsightCard insight={item} onOpen={() => setSelected(item)} /></Grid>)}</Grid> : <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, textAlign: "center", borderStyle: "dashed" }}><AutoStoriesRoundedIcon color="disabled" sx={{ fontSize: 48 }} /><Typography variant="h6" fontWeight={800} mt={1}>{query ? "No matching insights" : "No insights available yet"}</Typography><Typography color="text.secondary">{query ? "Try a different search." : "Published content from your subscriptions will appear here."}</Typography></Paper>}
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md"><DialogTitle sx={{ pr: 7, fontWeight: 800 }}>{selected?.title}<IconButton aria-label="Close" onClick={() => setSelected(null)} sx={{ position: "absolute", right: 12, top: 12 }}><CloseRoundedIcon /></IconButton></DialogTitle><DialogContent dividers>{selected?.type === "VIDEO" && selected.youtubeVideoId ? <Stack spacing={2}><Box component="iframe" src={`https://www.youtube-nocookie.com/embed/${selected.youtubeVideoId}`} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen sx={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 2 }} /><Box><Typography variant="caption" color="text.secondary">Video by</Typography><Typography variant="subtitle1" fontWeight={800}>{selected.authorRole === "BROKER" ? selected.authorOrganization || selected.author : selected.author}</Typography></Box><Stack direction="row" gap={1} flexWrap="wrap"><Button component="a" href={selected.youtubeUrl || undefined} target="_blank" rel="noopener noreferrer" variant="contained">Open on YouTube</Button>{selected.youtubeChannelUrl && <Button component="a" href={selected.youtubeChannelUrl} target="_blank" rel="noopener noreferrer" variant="outlined">Visit channel</Button>}</Stack></Stack> : selected?.body ? <AuthenticatedRichText html={selected.body} /> : null}<Stack mt={2}><Typography variant="body2" fontWeight={800}>Published by {selected?.author}</Typography>{selected?.authorOrganization && <Typography variant="body2" color="text.secondary">{selected.authorOrganization}</Typography>}<Typography variant="caption" color="text.secondary">{selected?.publishedAt}</Typography></Stack></DialogContent></Dialog>
  </Stack>;
};
export default ClientInsightsPage;
