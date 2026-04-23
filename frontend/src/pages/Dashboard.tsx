import { useState } from "react";
import { Typography, Paper, TextField, InputAdornment, Stack, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RecommendationHistory from "./common/RecommendationHistory";
// import axios from "axios";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // // Telegram state (moved to TelegramConnection component)
  // const [step, setStep] = useState<"phone" | "otp" | "connected">("phone");
  // const [phone, setPhone] = useState("");
  // const [otp, setOtp] = useState("");
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");
  // const [cooldown, setCooldown] = useState(0);

  // useEffect(() => {
  //   if (cooldown > 0) {
  //     const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [cooldown]);

  // useEffect(() => {
  //   const checkTelegram = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const res = await axios.get(
  //         import.meta.env.VITE_API_URL + "/api/telegram/status",
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       if (res.data.connected) {
  //         setStep("connected");
  //       }
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   checkTelegram();
  // }, []);

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: "none", border: "1px solid #E9E9EE" }}>
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome to Fintree
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            This is your dashboard.
          </Typography>
        </Box>

        <TextField
          placeholder="Search symbols..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            width: { xs: "100%", sm: 300 },
            "& .MuiInputBase-root": { borderRadius: "8px", fontSize: "0.85rem" }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* Passing searchQuery to the child component */}
      <RecommendationHistory searchQuery={searchQuery} />

      {/* =========================================================
       🔥 TELEGRAM CONNECT UI — moved to ../common/TelegramConnection.tsx
       ========================================================= */}
      {/* <TelegramConnection /> */}
    </Paper>
  );
};

export default Dashboard;