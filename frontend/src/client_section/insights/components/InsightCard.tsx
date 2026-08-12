import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { InsightItem } from "../types";

type InsightCardProps = { insight: InsightItem };

const InsightCard = ({ insight }: InsightCardProps) => {
  const isVideo = insight.type === "Video";

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: "hidden", borderColor: "#E5EAF2", height: "100%" }}
    >
      <Box
        sx={{
          height: 118,
          p: 2.25,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${insight.accent} 0%, ${insight.accent}CC 100%)`,
        }}
      >
        <Chip
          label={insight.category}
          size="small"
          sx={{ bgcolor: "rgba(255,255,255,.92)", fontWeight: 700, color: "#26324B" }}
        />
        <Box sx={{ color: "#fff", display: "flex" }}>
          {isVideo ? <PlayCircleRoundedIcon sx={{ fontSize: 38 }} /> : <ArticleRoundedIcon sx={{ fontSize: 36 }} />}
        </Box>
      </Box>

      <Stack sx={{ p: 2.25, height: "calc(100% - 118px)" }} spacing={1.2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" fontWeight={800} color={insight.accent}>
            {insight.type.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary">• {insight.duration}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontSize: "1.05rem", lineHeight: 1.35, fontWeight: 750, color: "#18213A" }}>
          {insight.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flexGrow: 1 }}>
          {insight.summary}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="caption" display="block" fontWeight={700}>{insight.author}</Typography>
            <Typography variant="caption" color="text.secondary">{insight.publishedAt}</Typography>
          </Box>
          <Button size="small" endIcon={<ArrowForwardRoundedIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
            {isVideo ? "Watch" : "Read"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default InsightCard;
