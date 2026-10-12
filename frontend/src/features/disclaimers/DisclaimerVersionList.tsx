import { Alert, Box, Stack, Typography } from "@mui/material";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ProductState from "../../components/common/ProductState";

const DisclaimerVersionList = () => (
  <Box>
    <Typography variant="h4">Disclaimer Versions</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Platform disclaimer version management.</Typography>
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Alert severity="warning">Activating a new disclaimer must affect future publications only.</Alert>
      <Alert severity="info">Historical research calls retain their original disclaimer version and text.</Alert>
    </Stack>
    <ProductState kind="unavailable" icon={<GavelOutlinedIcon fontSize="large" />} title="Disclaimer versioning is not connected" description="No sample legal text or simulated versions are displayed. Version history and activation controls will appear after the audited platform disclaimer API is available." />
  </Box>
);

export default DisclaimerVersionList;
