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



const Settings = () => {

  const navigate = useNavigate();

  // ✅ INSIDE COMPONENT
  const {
    telegramDisconnected,
    hideNotification,
  } = useTelegramNotification();

  return (
//  PASTE THIS EXACT CODE INSTEAD:
<div style={{ padding: "30px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
  
 {/* Unified Header Row Inside a Matching White Card */}
  <div style={{ 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    backgroundColor: "#ffffff", 
    border: "1px solid #e0e0e0", 
    borderRadius: "12px", 
    padding: "24px", 
    marginBottom: "24px", 
    width: "100%", 
    maxWidth: "1000px",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
    boxSizing: "border-box"
  }}>
   <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1a1a1a", fontFamily: "sans-serif" }}>
      Settings
    </h2>
   <Button 
      variant="contained" 
      onClick={() => navigate("/ra/profile")}
      sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 500 }}
    >
      View Profile
    </Button>
  </div>

  {/* Notification Alert Container */}
  <div style={{ width: "100%", maxWidth: "1000px" }}>
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
  </div>




    

      <div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "24px", width: "100%", maxWidth: "1000px" }}>
  <ChangePassword />
</div>

<div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "24px", width: "100%", maxWidth: "1000px" }}>
  <RASettingsDisclaimer />
</div>

      {/* <div
        style={{
          marginBottom: "30px",
          width: "100%",
          maxWidth: "1000px",
        }}
      >
        <AddParticipant />
      </div> */}

<div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "24px", width: "100%", maxWidth: "1000px" }}>
  <RemoveParticipant />
</div>

<div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "24px", width: "100%", maxWidth: "1000px" }}>
  <TelegramConnection />
</div>
    </div>
  );
};

export default Settings;
