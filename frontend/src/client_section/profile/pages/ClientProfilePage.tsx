import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";
import ProfileOverview from "../components/ProfileOverview";
import ChangePasswordPanel from "../components/ChangePasswordPanel";
import { fetchClientProfile } from "../api";
import type { ClientProfile } from "../types";
import { getLoginRoute } from "../../../utils/authRedirect";

type Section = "profile" | "password";

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchClientProfile(controller.signal)
      .then(setProfile)
      .catch((requestError) => {
        if (requestError?.name !== "CanceledError") setError("Unable to load your profile.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const logout = () => {
    const role = localStorage.getItem("role");
    localStorage.clear();
    navigate(getLoginRoute(role, ["CLIENT"]), { replace: true });
  };

  const navButtonSx = (active: boolean) => ({
    justifyContent: "flex-start",
    textTransform: "none",
    fontWeight: active ? 750 : 600,
    color: active ? "#344FC7" : "#526078",
    bgcolor: active ? "#EEF1FF" : "transparent",
    px: 1.5,
    py: 1.15,
    "&:hover": { bgcolor: active ? "#E6EAFF" : "#F5F7FA" },
  });

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="#18213A" sx={{ fontSize: { xs: "1.65rem", sm: "2rem" } }}>Profile & account</Typography>
        <Typography color="text.secondary" mt={0.5}>View your account details and manage account security.</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#E5EAF2", p: 1.2 }}>
          <Stack direction={{ xs: "row", md: "column" }} spacing={0.5} sx={{ overflowX: "auto" }}>
            <Button startIcon={<PersonOutlineRoundedIcon />} onClick={() => setSection("profile")} sx={navButtonSx(section === "profile")}>View profile</Button>
            <Button startIcon={<LockOutlinedIcon />} onClick={() => setSection("password")} sx={navButtonSx(section === "password")}>Change password</Button>
            <Button startIcon={<LogoutRoundedIcon />} onClick={logout} sx={{ ...navButtonSx(false), color: "#D14343", mt: { md: 1 } }}>Log out</Button>
          </Stack>
        </Paper>

        <Box>
          {loading && <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress size={30} /></Box>}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && section === "profile" && profile && <ProfileOverview profile={profile} />}
          {!loading && !error && section === "password" && <ChangePasswordPanel />}
        </Box>
      </Box>
    </Stack>
  );
};

export default ClientProfilePage;
