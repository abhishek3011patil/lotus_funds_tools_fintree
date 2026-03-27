import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid 
} from '@mui/material';

import { Send as SendIcon } from '@mui/icons-material';
import { useState } from "react";
import axios from "axios";

const AdminDashboard = () => {

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
  } catch (err: any) {
    alert("❌ Invalid Telegram ID or user didn't start bot");
  }
};
  return (
    <Box sx={{ p: 4, maxWidth: 800 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
        Telegram Configuration
      </Typography>
      
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telegram Username"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telegram ID"
              placeholder="123456789"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
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
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;