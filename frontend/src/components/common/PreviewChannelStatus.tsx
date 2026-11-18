import { Box, Paper, Typography } from "@mui/material";

export default function PreviewChannelStatus({
  raPhoneNumber,
}: {
  raPhoneNumber?: string | null;
}) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#EAF7FD", borderColor: "#54B5E6" }}>
      <Typography fontWeight={800} sx={{ color: "#1686BD" }}>Telegram</Typography>
      <Typography variant="body2" sx={{ color: "#155A7A", overflowWrap: "anywhere" }}>
        RA contact: {raPhoneNumber?.trim() || "Number unavailable"}
      </Typography>
    </Paper>
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#F3F4F6", borderColor: "#D1D5DB" }}>
      <Typography fontWeight={800} sx={{ color: "#6B7280" }}>WhatsApp</Typography>
      <Typography variant="body2" sx={{ color: "#4B5563" }}>Not subscribed</Typography>
    </Paper>
  </Box>;
}
