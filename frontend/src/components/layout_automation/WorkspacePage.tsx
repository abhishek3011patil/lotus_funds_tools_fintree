import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, CardActionArea, Chip, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import { workspaceTools } from "./workspaceTools";
export type WorkspaceSection = "overview" | "Morning" | "Afternoon" | "Evening" | "Special" | "Weekly";
const sections: Record<WorkspaceSection, { title: string; subtitle: string; tools: number[] }> = {
  overview: { title: "Your reporting workspace", subtitle: "Create market updates, prepare client communications and keep every report on brand.", tools: [0, 1, 2, 3, 4, 5] },
  Morning: { title: "Start the market day", subtitle: "Prepare your morning briefing with market data, institutional activity and branded reports.", tools: [0, 1, 2, 3, 4] },
  Afternoon: { title: "Keep the day moving", subtitle: "Use the shared reporting tools to prepare intraday updates and client communications.", tools: [2, 3, 4] },
  Evening: { title: "Wrap up the market day", subtitle: "Bring the day’s market movements together and prepare your closing communication.", tools: [2, 3, 4] },
  Special: { title: "Tools for the details", subtitle: "Prepare your data and brand assets for a consistent reporting workflow.", tools: [5, 4, 3] },
  Weekly: { title: "Bring the week together", subtitle: "Use the shared market and communication tools to prepare your weekly update.", tools: [2, 3, 4] },
};
export default function WorkspacePage({ section = "overview" }: { section?: WorkspaceSection }) {
  const [query, setQuery] = useState("");
  const page = sections[section];
  const tools = useMemo(() => page.tools.map(i => workspaceTools[i]).filter(tool => `${tool.title} ${tool.description} ${tool.category}`.toLowerCase().includes(query.trim().toLowerCase())), [page, query]);
  return <Stack spacing={{ xs: 3, md: 4 }}>
    <Box>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: "0.12em" }}>EMPLOYEE WORKSPACE</Typography>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={2} mt={0.5}>
        <Box><Typography variant="h4">{page.title}</Typography><Typography color="text.secondary" sx={{ mt: 1, maxWidth: 650, lineHeight: 1.7 }}>{page.subtitle}</Typography></Box>
        <Chip variant="outlined" label="Research & communication" sx={{ bgcolor: "background.paper", borderColor: "divider", color: "text.secondary" }} />
      </Stack>
    </Box>
    {section === "overview" && <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, borderColor: "#DCE4FA", background: "linear-gradient(110deg, #EEF2FF 0%, #F8FAFF 70%, #FFFFFF 100%)" }}>
      <Stack direction={{ xs: "column", md: "row" }} gap={3} alignItems={{ md: "center" }} justifyContent="space-between">
        <Box sx={{ maxWidth: 570 }}>
          <Stack direction="row" spacing={1} alignItems="center" color="primary.main" mb={1.5}><WbSunnyOutlined fontSize="small" /><Typography variant="caption" fontWeight={800}>YOUR NEXT MARKET BRIEFING</Typography></Stack>
          <Typography variant="h5">A clear start to every market day.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.75 }}>Start with the morning report, add your market insights and make it your company’s own.</Typography>
          <Button component={Link} to="/morning-report-builder" variant="contained" endIcon={<ArrowForwardRounded />} sx={{ mt: 2.5 }}>Create morning report</Button>
        </Box>
        <Box sx={{ width: { xs: "100%", md: 265 }, boxSizing: "border-box", p: 2.5, borderRadius: 2.5, bgcolor: "rgba(255,255,255,.85)", border: "1px solid #E2E8F6", flexShrink: 0 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={750}>A simple workflow</Typography>
          {["Prepare your market data", "Apply company branding", "Review and share your report"].map((label, i) => <Stack key={label} direction="row" gap={1.5} alignItems="center" mt={1.5}><Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "primary.light", color: "primary.main", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</Box><Typography variant="body2" fontWeight={600}>{label}</Typography></Stack>)}
        </Box>
      </Stack>
    </Paper>}
    <Box component="section" aria-labelledby="workspace-tools-heading">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} mb={2.5}>
        <Box><Typography id="workspace-tools-heading" variant="h6">{section === "overview" ? "Your tools" : "Reporting tools"}</Typography><Typography variant="body2" color="text.secondary" mt={0.5}>Everything you need, in one place.</Typography></Box>
        <TextField size="small" placeholder="Find a tool…" value={query} onChange={e => setQuery(e.target.value)} inputProps={{ "aria-label": "Find a reporting tool" }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} sx={{ width: { xs: "100%", sm: 260 }, bgcolor: "background.paper" }} />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {tools.map(tool => <Card key={tool.path} variant="outlined" sx={{ borderRadius: 3, transition: "border-color 160ms, box-shadow 160ms", "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 20px rgba(49,85,217,.06)" } }}><CardActionArea component={Link} to={tool.path} sx={{ p: 3, height: "100%", display: "flex", alignItems: "stretch", flexDirection: "column" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}><Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 2, color: "primary.main", bgcolor: "primary.light" }}><tool.icon /></Box><Typography variant="caption" color="text.secondary" fontWeight={600}>{tool.category}</Typography></Stack>
          <Typography variant="subtitle1" fontWeight={750}>{tool.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3, lineHeight: 1.7, flexGrow: 1 }}>{tool.description}</Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between" color="primary.main"><Typography variant="body2" fontWeight={750}>Open tool</Typography><ArrowForwardRounded fontSize="small" /></Stack>
        </CardActionArea></Card>)}
      </Box>
      {!tools.length && <Paper variant="outlined" sx={{ textAlign: "center", py: 6, px: 2, borderRadius: 3 }}><FolderOpenOutlined sx={{ color: "text.secondary", fontSize: 36 }} /><Typography variant="h6" mt={1}>No matching tools</Typography><Typography color="text.secondary" variant="body2" mt={1}>Try another name or clear your search to see all tools.</Typography><Button sx={{ mt: 2 }} onClick={() => setQuery("")}>Clear search</Button></Paper>}
    </Box>
    <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}><Typography variant="caption" color="text.secondary">Tarkashh · Research, connected</Typography></Box>
  </Stack>;
}
