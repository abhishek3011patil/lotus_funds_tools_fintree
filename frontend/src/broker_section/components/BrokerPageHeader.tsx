import { Box, Chip, Typography } from "@mui/material";

const BrokerPageHeader = ({ title, subtitle, readOnly = false }: { title: string; subtitle: string; readOnly?: boolean }) => (
  <Box sx={{ mb: 3, p: { xs: 2, sm: 2.5 }, bgcolor: "background.paper", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      <Typography variant="h4" fontWeight={700}>{title}</Typography>
      {readOnly && <Chip label="Read-only" size="small" color="info" variant="outlined" />}
    </Box>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
  </Box>
);

export default BrokerPageHeader;
