import ChangePassword from "../common/ChangePassword";
import TelegramConnection from "../pages/common/TelegramConnection";
import AddParticipant from "../common/RAProfileEditRequest";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import IconButton from "@mui/material/IconButton";

import CloseIcon from "@mui/icons-material/Close";

import { useTelegramNotification } from "../hooks/useTelegramNotification";
import Button from "@mui/material/Button";
import RASettingsDisclaimer from "../common/RASettingsDisclaimer";
import RemoveParticipant from "../components/setting/RA_setting_component/ManageParticipants";
import WhatsAppParticipants from "../components/setting/WhatsAppParticipants";

import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";



const Settings = () => {

  const navigate = useNavigate();

  // ✅ INSIDE COMPONENT
  const {
    telegramDisconnected,
    hideNotification,
  } = useTelegramNotification();

  return (
  <Box 
    sx={{ 
      padding: { xs: "16px", sm: "30px" }, 
      backgroundColor: "#f8f9fa", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start"
    }}
  >
    
    {/* 1. Unified Header Row Inside a Matching White Card */}
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "column" },
        justifyContent: "space-between", 
        alignItems: { xs: "flex-start", sm: "start" }, 
        gap: 2,
        backgroundColor: "#ffffff", 
        border: "1px solid #e0e0e0", 
        borderRadius: "12px", 
        padding: { xs: "20px", sm: "24px" }, 
        marginBottom: "24px", 
        width: "100%", 
        maxWidth: "1000px",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
        boxSizing: "border-box"
      }}
    >
      <Typography 
        variant="h2" 
        sx={{ 
          margin: 0, 
          fontSize: "20px", 
          fontWeight: 600, 
          color: "#1a1a1a", 
          fontFamily: "sans-serif" 
        }}
      >
        Settings
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate("/ra/profile")}
     
        sx={{ 
          textTransform: "none", 
          borderRadius: "8px", 
          fontWeight: 500,
          width: { xs: "100%", sm: "auto" },
          backgroundColor: "#1D4ED8",
          "&:hover": { backgroundColor: "#1E40AF" }
        }}
      >
        View Profile
      </Button>
    </Box>

    {/* 2. Notification Alert Container */}
    <Box sx={{ width: "100%", maxWidth: "1000px" }}>
      {telegramDisconnected && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "#ffebee",
            border: "1px solid #ef9a9a",
            borderRadius: "8px"
          }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={hideNotification}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Telegram Not Connected</AlertTitle>
          You are not connected to Telegram. Please connect before generating calls.
        </Alert>
      )}
    </Box>

    {/* 3. Change Password Card */}
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: { xs: "16px", sm: "24px" }, marginBottom: "24px", width: "100%", maxWidth: "1000px", boxSizing: "border-box" }}>
      <ChangePassword />
    </Box>

    {/* 4. Disclaimer Card */}
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: { xs: "16px", sm: "24px" }, marginBottom: "24px", width: "100%", maxWidth: "1000px", boxSizing: "border-box" }}>
      <RASettingsDisclaimer />
    </Box>

    {/* 5. WhatsApp Participants Card */}
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: { xs: "16px", sm: "24px" }, marginBottom: "24px", width: "100%", maxWidth: "1000px", boxSizing: "border-box" }}>
      <WhatsAppParticipants />
    </Box>

    {/* 6. Remove/Manage Participants Card */}
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: { xs: "16px", sm: "24px" }, marginBottom: "24px", width: "100%", maxWidth: "1000px", boxSizing: "border-box" }}>
      <RemoveParticipant />
    </Box>

    {/* 7. Telegram Connection Setup Card */}
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: { xs: "16px", sm: "24px" }, marginBottom: "24px", width: "100%", maxWidth: "1000px", boxSizing: "border-box" }}>
      <TelegramConnection />
    </Box>

  </Box>
);
};

export default Settings;
