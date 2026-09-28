import { Alert, AlertTitle, Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useNavigate, useParams } from "react-router-dom";
import ChangePassword from "../common/ChangePassword";
import TelegramConnection from "./common/TelegramConnection";
import RASettingsDisclaimer from "../common/RASettingsDisclaimer";
import ManageParticipants from "../components/setting/RA_setting_component/ManageParticipants";
import WhatsAppParticipants from "../components/setting/WhatsAppParticipants";
import RASubscriptionStatus from "../components/setting/RA_setting_component/RASubscriptionStatus";
import RASubscriptionHistory from "../components/setting/RA_setting_component/RASubscriptionHistory";
import ResearchCallTemplateBuilder from "../components/setting/ResearchCallTemplateBuilder";
import RASettingsNavigation, {
  isRASettingsSection,
  type RASettingsSection,
} from "../components/setting/RASettingsNavigation";
import { useTelegramNotification } from "../hooks/useTelegramNotification";
import RAProfilePicture from "../components/setting/RAProfilePicture";

const cardSx = {
  bgcolor: "#fff",
  borderColor: "#E5EAF2",
  borderRadius: 3,
  p: { xs: 2.25, sm: 3 },
  scrollMarginTop: 16,
};

const Settings = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const activeSection: RASettingsSection = isRASettingsSection(section) ? section : "account";
  const { telegramDisconnected, hideNotification } = useTelegramNotification();

  const handleNavigate = (section: RASettingsSection) => {
    navigate(`/settings/${section}`);
  };

  const telegramAlert = telegramDisconnected ? (
    <Alert
      severity="error"
      sx={{ borderRadius: 2.5 }}
      action={
        <IconButton color="inherit" size="small" onClick={hideNotification} aria-label="Dismiss Telegram alert">
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      <AlertTitle>Telegram not connected</AlertTitle>
      Connect Telegram before sending research calls through that channel.
    </Alert>
  ) : null;

  const renderActiveSection = () => {
    switch (activeSection) {
      case "subscription":
        return (
          <Paper variant="outlined" sx={cardSx}>
            <RASubscriptionStatus />
            <RASubscriptionHistory />
          </Paper>
        );
      case "security":
        return <Paper variant="outlined" sx={cardSx}><ChangePassword /></Paper>;
      case "research":
        return (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={cardSx}><RASettingsDisclaimer /></Paper>
            <Paper variant="outlined" sx={cardSx}><ResearchCallTemplateBuilder /></Paper>
          </Stack>
        );
      case "whatsapp":
        return <Paper variant="outlined" sx={cardSx}><WhatsAppParticipants /></Paper>;
      case "telegram-participants":
        return (
          <Stack spacing={2.5}>
            {telegramAlert}
            <Paper variant="outlined" sx={cardSx}><ManageParticipants /></Paper>
          </Stack>
        );
      case "telegram-connection":
        return (
          <Stack spacing={2.5}>
            {telegramAlert}
            <Paper variant="outlined" sx={cardSx}><TelegramConnection /></Paper>
          </Stack>
        );
      case "account":
      default:
        return (
          <Stack spacing={2.5}>
            <RAProfilePicture />
            <Paper variant="outlined" sx={cardSx}>
              <Typography variant="h6" fontWeight={800}>Profile and account</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5} mb={2.5}>
                Review your approved profile or request changes to your public analyst details.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="contained" startIcon={<PersonOutlineRoundedIcon />} onClick={() => navigate("/ra/profile")} sx={{ textTransform: "none", bgcolor: "#5271FF", fontWeight: 700 }}>
                  View profile
                </Button>
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => navigate("/ra/profile/edit")} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Request profile edit
                </Button>
              </Stack>
            </Paper>
          </Stack>
        );
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1180, mx: "auto" }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" fontWeight={800} color="#18213A" sx={{ fontSize: { xs: "1.65rem", sm: "2rem" } }}>
            Settings
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Manage your analyst account, research preferences, and delivery channels.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "230px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
          <RASettingsNavigation activeSection={activeSection} onNavigate={handleNavigate} />

          <Box minWidth={0}>{renderActiveSection()}</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
