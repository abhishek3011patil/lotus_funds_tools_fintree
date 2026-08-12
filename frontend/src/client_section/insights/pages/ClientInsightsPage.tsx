import { useMemo, useState } from "react";
import { Box, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import InsightCard from "../components/InsightCard";
import { placeholderInsights } from "../placeholderInsights";
import type { InsightType } from "../types";

type Filter = "All" | InsightType;

const ClientInsightsPage = () => {
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const visibleInsights = useMemo(() => {
    const query = search.trim().toLowerCase();
    return placeholderInsights.filter((item) => {
      const matchesType = filter === "All" || item.type === filter;
      const matchesSearch = !query || [item.title, item.summary, item.category, item.author]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }, [filter, search]);

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          borderRadius: 3.5,
          p: { xs: 2.5, sm: 3.5 },
          color: "#fff",
          background: "linear-gradient(115deg, #5271FF 0%, #6A80F8 62%, #22C55E 160%)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Box sx={{ bgcolor: "rgba(255,255,255,.16)", borderRadius: 2.5, p: 1.4, display: "flex", width: "fit-content" }}>
            <AutoStoriesRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.65rem", sm: "2rem" } }}>
              Insights
            </Typography>
            <Typography sx={{ mt: 0.5, opacity: 0.9, maxWidth: 650 }}>
              Practical articles and short videos to help you understand research calls and invest more thoughtfully.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} alignItems={{ sm: "center" }}>
        <Tabs value={filter} onChange={(_, value: Filter) => setFilter(value)}>
          <Tab value="All" label="All" />
          <Tab value="Article" label="Articles" />
          <Tab value="Video" label="Videos" />
        </Tabs>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search insights"
          size="small"
          sx={{ width: { xs: "100%", sm: 300 }, bgcolor: "#fff" }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
        />
      </Stack>

      {visibleInsights.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2.25 }}>
          {visibleInsights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </Box>
      ) : (
        <Box sx={{ py: 8, textAlign: "center", bgcolor: "#fff", borderRadius: 3, border: "1px solid #E5EAF2" }}>
          <Typography fontWeight={700}>No insights found</Typography>
          <Typography variant="body2" color="text.secondary">Try another search or content type.</Typography>
        </Box>
      )}
    </Stack>
  );
};

export default ClientInsightsPage;
