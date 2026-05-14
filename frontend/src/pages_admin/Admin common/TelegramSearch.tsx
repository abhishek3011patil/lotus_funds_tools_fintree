import {
  Box,
  TextField,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { useState } from "react";
import axios from "axios";

type TelegramSearchProps = {
  raId?: string; // ✅ optional now
  onSaved?: () => void;
};

export const TelegramSearch = ({ raId, onSaved }: TelegramSearchProps) => {
  const [username, setUsername] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [entityType, setEntityType] = useState("USER");

  const handleSave = async () => {
  // ✅ At least one field required
  if (!telegramId && !username && !phoneNumber) {
    alert("Enter at least one: Username, Telegram ID, or Phone");
    return;
  }

  if (phoneNumber && !phoneNumber.startsWith("+91")) {
    alert("Phone number must start with +91");
    return;
  }

  const cleanUsername = username.trim().replace(/^@/, "");

  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    // 🔥 COMMON PAYLOAD
    const payload = {
      telegram_user_id: telegramId || null,
      telegram_client_name: cleanUsername || null,
      phone_number: phoneNumber || null,
    };

    // =========================
    // ✅ ADMIN FLOW
    // =========================
    if (raId && raId.trim()) {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/save-user`,
        {
          ...payload,
          user_id: raId.trim(), // ✅ required for admin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    // =========================
    // ✅ RA FLOW (SELF)
    // =========================
    else {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/add-participant`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    alert("✅ Saved successfully");

    onSaved?.();

    // reset fields
    setUsername("");
    setTelegramId("");
    setPhoneNumber("");

  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message ||
      "Invalid Telegram details or server error";

    alert(`❌ Error: ${errorMsg}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{ p: 1, maxWidth: 1000 }}>
      <Paper
        elevation={0}
        sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 3,
          }}
        >

        {/* Entity Type */}
<Box sx={{ gridColumn: "1 / -1" }}>
  <Typography sx={{ mb: 1, fontWeight: 600 }}>
    Type
  </Typography>

  <RadioGroup
    row
    value={entityType}
    onChange={(e) =>
      setEntityType(e.target.value)
    }
  >
    <FormControlLabel
      value="USER"
      control={<Radio />}
      label="User"
    />

    <FormControlLabel
      value="GROUP"
      control={<Radio />}
      label="Group"
    />

    <FormControlLabel
      value="CHANNEL"
      control={<Radio />}
      label="Channel"
    />
  </RadioGroup>
</Box>
         {/* Username */}
<TextField
  fullWidth
  label={
    entityType === "USER"
      ? "Telegram Username"
      : entityType === "GROUP"
      ? "Group Username or Link"
      : "Channel Username or Link"
  }
  placeholder={
    entityType === "USER"
      ? "@username"
      : entityType === "GROUP"
      ? "@group_username"
      : "@channel_username"
  }
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

         {entityType === "USER" && (
  <>
    {/* Telegram ID */}
    <TextField
      fullWidth
      label="Telegram ID"
      placeholder="123456789"
      value={telegramId}
      onChange={(e) => setTelegramId(e.target.value)}
    />
  </>
)}

        {entityType === "USER" && (
  <>
    {/* Phone */}
    <TextField
      fullWidth
      label="Phone Number"
      placeholder="+919876543210"
      value={phoneNumber}
      error={!!phoneError}
      helperText={phoneError}
      onChange={(e) => {
        const value = e.target.value;
        setPhoneNumber(value);

        if (value && !value.startsWith("+91")) {
          setPhoneError(
            "Phone number must start with +91"
          );
        } else {
          setPhoneError("");
        }
      }}
    />
  </>
)}

          {/* Save Button */}
          <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                backgroundColor: "#22C55E",
                "&:hover": { backgroundColor: "#1a9d4b" },
                textTransform: "none",
                px: 4,
                fontWeight: "600",
              }}
            >
              {loading ? "Saving..." : "Save Details"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TelegramSearch;