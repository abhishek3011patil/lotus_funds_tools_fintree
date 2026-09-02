import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f4f7fe", p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 560, p: { xs: 3, sm: 5 }, textAlign: "center", borderRadius: 4 }}>
        <Typography sx={{ color: "#5271ff", fontSize: 64, fontWeight: 900, lineHeight: 1 }}>404</Typography>
        <Typography variant="h4" fontWeight={800} mt={2}>Page not found</Typography>
        <Typography color="text.secondary" mt={1}>The link may be incorrect, expired, or the page may have moved.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" spacing={1.5} mt={3}>
          <Button variant="contained" startIcon={<HomeRoundedIcon />} onClick={() => navigate("/", { replace: true })}>Go to home</Button>
          <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>Go back</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default NotFound;
