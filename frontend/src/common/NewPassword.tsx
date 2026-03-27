import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NewPassword: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Separate states for each "eye" toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check before submission
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        password: formData.password,
      });
      setMessage("Password successfully updated!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Server error.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    mb: 2,
    "& .MuiInputBase-root": {
      borderRadius: 2,
      backgroundColor: "#F8FBFF",
    },
  };

  // Logic to check if passwords match for UI feedback
  const isMismatch = formData.confirmPassword !== "" && formData.password !== formData.confirmPassword;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F4F7FE", p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 400, bgcolor: "#ffffff", p: 4, borderRadius: 4, boxShadow: "0 15px 35px rgba(0,0,0,0.1)" }}>
        
        <Typography variant="h4" sx={{ color: "#4F6CF8", textAlign: "center", mb: 3, fontWeight: 700 }}>
          Set New Password
        </Typography>

        {/* First Password Field */}
        <TextField
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={inputStyles}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirm Password Field */}
        <TextField
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          required
          error={isMismatch}
          helperText={isMismatch ? "Passwords do not match" : ""}
          sx={inputStyles}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || isMismatch || !formData.password}
          sx={{ py: 1.5, fontWeight: 600, backgroundColor: "#4F6CF8", borderRadius: 2, mt: 1 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Reset Password"}
        </Button>

        {message && (
          <Typography sx={{ mt: 2, textAlign: "center", color: "#4F6CF8", bgcolor: "#EEF2FF", p: 1, borderRadius: 1 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NewPassword;