import ChangePassword from "../common/ChangePassword";
import TelegramConnection from "../pages/common/TelegramConnection";
import AddParticipant from "./common/RAProfileEditRequest";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import IconButton from "@mui/material/IconButton";

import CloseIcon from "@mui/icons-material/Close";

import { useTelegramNotification } from "../hooks/useTelegramNotification";
import Button from "@mui/material/Button";
import RASettingsDisclaimer from "../common/RASettingsDisclaimer";
import RemoveParticipant from "../components/setting/RA_setting_component/ManageParticipants";

import { useNavigate } from "react-router-dom";



const Settings = () => {

  const navigate = useNavigate();

  // ✅ INSIDE COMPONENT
  const {
    telegramDisconnected,
    hideNotification,
  } = useTelegramNotification();

  return (
    <div style={{ padding: "20px" }}>
      <h3>Settings</h3>


      <div
  style={{
    marginTop: "30px",
    width: "100%",
    maxWidth: "1000px",
  }}
>

    {telegramDisconnected && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "#ffebee",
            border: "1px solid #ef9a9a",
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
          <AlertTitle>
            Telegram Not Connected
          </AlertTitle>

          You are not connected to Telegram.
          Please connect before generating calls.
        </Alert>
      )}
  <Button
    variant="contained"
    onClick={() => navigate("/ra/profile")}
  >
    View Profile
  </Button>
</div>




    

      <div
        style={{
          marginBottom: "30px",
          width: "100%",
          maxWidth: "1000px",
        }}
      >
        <ChangePassword />
      </div>

     <div
  style={{
    marginTop: "30px",
    width: "100%",
    maxWidth: "1000px",
  }}
>
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

      <div
  style={{
    marginBottom: "30px",
    width: "100%",
    maxWidth: "1000px",
  }}
>
  <RemoveParticipant />
</div>

      <div style={{ width: "100%", maxWidth: "1000px" }}>
        <TelegramConnection />
      </div>
    </div>
  );
};

export default Settings;