import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper
} from '@mui/material';

import { Send as SendIcon } from '@mui/icons-material';
import { useState } from "react";
import axios from "axios";

type TelegramSearchProps = {
  onSaved?: (telegramUserId?: string) => void;
};

export const TelegramSearch = ({ onSaved }: TelegramSearchProps) => {

  const [username, setUsername] = useState("");
  const [telegramId, setTelegramId] = useState("");

  const handleSave = async () => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/telegram/save-user`, // ✅ CORRECT
      {
        telegram_user_id: telegramId,
        telegram_client_name: username,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("✅ Saved successfully");
    onSaved?.(telegramId);
  } catch (err: any) {
    alert("❌ Invalid Telegram ID or user didn't start bot");
  }
};
  return (
    <Box sx={{ p: 4, maxWidth: 800 }}>
      {/* <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
        Telegram Configuration
      </Typography> */}
      
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          <Box>
            <TextField
              fullWidth
              label="Telegram Username"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Telegram ID"
              placeholder="123456789"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSave}
              sx={{ 
                backgroundColor: '#22C55E', 
                '&:hover': { backgroundColor: '#1a9d4b' },
                textTransform: 'none',
                px: 4,
                fontWeight: '600'
              }}
            >
              Save Details
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TelegramSearch;