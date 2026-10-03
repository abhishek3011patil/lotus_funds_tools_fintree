import { Box, Stack, Typography } from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import ProductState from "../../../components/common/ProductState";

const ClientInsightsPage = () => (
  <Stack spacing={3}>
    <Box sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, color: "#fff", background: "linear-gradient(115deg, #3155D9 0%, #5271FF 62%, #15803D 160%)" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <Box sx={{ bgcolor: "rgba(255,255,255,.16)", borderRadius: 2.5, p: 1.4, display: "flex", width: "fit-content" }}><AutoStoriesRoundedIcon sx={{ fontSize: 32 }} /></Box>
        <Box><Typography variant="h4">Insights</Typography><Typography sx={{ mt: 0.5, opacity: 0.9, maxWidth: 650 }}>Practical articles and videos about research calls and informed investing.</Typography></Box>
      </Stack>
    </Box>
    <ProductState kind="unavailable" icon={<VideoLibraryOutlinedIcon fontSize="large" />} title="Insights are being prepared" description="There is no published insight content yet. Demo articles and videos have been removed so every item shown here will come from an approved Tarkashh content source." note="A content publishing source and video provider must be connected before this section can go live." />
  </Stack>
);

export default ClientInsightsPage;
