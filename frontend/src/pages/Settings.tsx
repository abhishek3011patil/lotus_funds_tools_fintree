import ChangePassword from "../common/ChangePassword";
import TelegramConnection from "../pages/common/TelegramConnection";
import AddParticipant from "./common/AddParticipant";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import IconButton from "@mui/material/IconButton";

import CloseIcon from "@mui/icons-material/Close";

import { useTelegramNotification } from "../hooks/useTelegramNotification";

const Settings = () => {

  // ✅ INSIDE COMPONENT
  const {
    telegramDisconnected,
    hideNotification,
  } = useTelegramNotification();

  return (
    <div style={{ padding: "20px" }}>
      <h3>Settings</h3>

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
          marginBottom: "30px",
          width: "100%",
          maxWidth: "1000px",
        }}
      >
        <AddParticipant />
      </div>

      <div style={{ width: "100%", maxWidth: "1000px" }}>
        <TelegramConnection />
      </div>
    </div>
  );
};

export default Settings;