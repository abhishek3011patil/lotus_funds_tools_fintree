import { Box, TextField, Button, Paper } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { useState } from "react";
import axios from "axios";

type TelegramSearchProps = {
  raId: string; // REQUIRED
  onSaved?: () => void;
};

export const TelegramSearch = ({ raId, onSaved }: TelegramSearchProps) => {
  const [username, setUsername] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // ✅ RA validation
    if (!raId) {
      alert("RA ID missing. Please reload.");
      return;
    }

    // ✅ At least one field required
    if (!telegramId && !username && !phoneNumber) {
      alert("Enter at least one: Username, Telegram ID, or Phone");
      return;
    }

    // ✅ Normalize username (remove @)
    const cleanUsername = username.trim().replace(/^@/, "");

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/save-user`,
        {
          telegram_user_id: telegramId || null,
          telegram_client_name: cleanUsername || null,
          phone_number: phoneNumber || null,
          user_id: raId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("✅ Saved successfully");

      // refresh parent list
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
          {/* Username */}
          <TextField
            fullWidth
            label="Telegram Username"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Telegram ID */}
          <TextField
            fullWidth
            label="Telegram ID"
            placeholder="123456789"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
          />

          {/* Phone */}
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

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