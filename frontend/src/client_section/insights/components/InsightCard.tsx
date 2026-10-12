import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import type { InsightItem } from "../types";

type InsightCardProps = { insight: InsightItem; onOpen: () => void };

const InsightCard = ({ insight, onOpen }: InsightCardProps) => {
  const isVideo = insight.type === "VIDEO";
  const accent = isVideo ? "#DC2626" : "#3155D9";
  const videoPublisher = insight.authorRole === "BROKER"
    ? insight.authorOrganization || insight.author
    : insight.author;

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: "hidden", borderColor: "#E5EAF2", height: "100%" }}
    >
      {isVideo && insight.youtubeVideoId ? <Box component="a" href={insight.youtubeUrl || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${insight.title} on YouTube`} sx={{ position: "relative", bgcolor: "#111827", display: "block" }}><Box component="img" src={`https://i.ytimg.com/vi/${insight.youtubeVideoId}/hqdefault.jpg`} alt="" sx={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover", opacity: .9 }} /><PlayCircleRoundedIcon sx={{ position: "absolute", inset: 0, m: "auto", color: "white", fontSize: 54, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.45))" }} /></Box> : <Box
        sx={{
          height: 118,
          p: 2.25,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#3155D9,#6D83F2)",
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
      </Box>}

      {isVideo && (
        <Box sx={{ px: 2.25, py: 1.15, bgcolor: "#F8FAFC", borderBottom: "1px solid #E5EAF2" }}>
          <Typography variant="caption" color="text.secondary" display="block">Video by</Typography>
          <Typography variant="body2" fontWeight={800} color="#18213A">{videoPublisher}</Typography>
        </Box>
      )}

      <Stack sx={{ p: 2.25, height: "calc(100% - 118px)" }} spacing={1.2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" fontWeight={800} color={accent}>
            {isVideo ? "VIDEO" : "BLOG"}
          </Typography>
          <Chip size="small" icon={insight.visibility === "PUBLIC" ? <PublicRoundedIcon /> : <LockOutlinedIcon />} label={insight.visibility === "PUBLIC" ? "Public" : "Subscriber"} sx={{ ml: "auto" }} />
        </Stack>
        <Typography variant="h6" sx={{ fontSize: "1.05rem", lineHeight: 1.35, fontWeight: 750, color: "#18213A" }}>
          {insight.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flexGrow: 1 }}>
          {insight.summary}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="caption" display="block" fontWeight={700}>Published by {insight.author}</Typography>
            {insight.authorOrganization && <Typography variant="caption" display="block" color="text.secondary">{insight.authorOrganization}</Typography>}
            <Typography variant="caption" color="text.secondary">{insight.publishedAt}</Typography>
          </Box>
          <Button size="small" onClick={onOpen} endIcon={<ArrowForwardRoundedIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
            {isVideo ? "Watch" : "Read"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default InsightCard;
