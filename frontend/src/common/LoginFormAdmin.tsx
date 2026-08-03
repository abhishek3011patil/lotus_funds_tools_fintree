import React, { useState } from "react";
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
import LoadingPage from "./LoadingPage";


const LoginFormAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = () =>
    setShowPassword((show) => !show);

  const handleClickShowOtp = () =>
    setShowOtp((show) => !show);

  const handleSendOtp = async () => {
  if (!formData.username) {
    setMessage("Please enter your username first to get an OTP");
    return;
  }

  setSendingOtp(true);
  setMessage("");

  try {
    // Replace with your actual Send OTP backend endpoint
    await axios.post(`${API_URL}/api/auth/send-otp`, {
      loginId: formData.username,
    });
    
    setIsOtpSent(true);
    setMessage("OTP sent successfully!");
  } catch (err: any) {
    setMessage(
      err.response?.data?.message || "Failed to send OTP. Please try again."
    );
  } finally {
    setSendingOtp(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
     const res = await axios.post(
  `${API_URL}/api/auth/login`,
  {
    loginId: formData.username, // send loginId instead of username
    password: formData.password,
    otp: formData.otp,
  }
);
      const { token, role, username } = res.data;


      //console.log("LOGIN RESPONSE:", res.data);

      localStorage.setItem("token", token);

// ✅ ADD THIS
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

localStorage.setItem(
  "tokenExpiry",
  (Date.now() + THIRTY_DAYS).toString()
);

localStorage.setItem("username", res.data.username);

localStorage.setItem("role", role);

      // Redirect based on role
      if (role === "ADMIN" || role === "SUPERADMIN") navigate("/admin");
      if (role === "EMPLOYEE") navigate("/automation");


    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
        "Server error. Please try again."

      );
      console.log(err.response?.data);
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

 // Show shared full-page loader while admin login request is in progress.
 if (loading) {
  return (
    <LoadingPage
      title="Signing you in"
      subtitle="Please wait while we verify your credentials."
    />
  );
}


  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F4F7FE",
        p: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#ffffff",
          p: 4,
          borderRadius: 4,
          boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#4F6CF8",
            textAlign: "center",
            mb: 3,
            fontWeight: 700,
          }}
        >
          Company Login
        </Typography>

        <TextField
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          required
          sx={inputStyles}
        />

        <TextField
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={inputStyles}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

      {/* Dynamic OTP Section */}
        {/* Dynamic OTP Section */}
        {!isOtpSent ? (
          <Button
            variant="outlined"
            fullWidth
            onClick={handleSendOtp}
            disabled={sendingOtp}
            sx={{
              mb: 2,
              py: 1.2,
              borderRadius: 2,
              textTransform: "none",
              borderColor: "#4F6CF8",
              color: "#4F6CF8",
              fontWeight: 600,
            }}
          >
            {sendingOtp ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Send OTP"
            )}
          </Button>
        ) : (
          <TextField
            name="otp"
            type={showOtp ? "text" : "password"}
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={handleChange}
            fullWidth
            required
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ gap: 0.5 }}>
                  <Button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    size="small"
                    sx={{
                      textTransform: "none",
                      color: "#4F6CF8",
                      fontWeight: 600,
                      minWidth: "auto",
                      p: "2px 6px",
                    }}
                  >
                    {sendingOtp ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      "Resend"
                    )}
                  </Button>
                  <IconButton
                    onClick={handleClickShowOtp}
                    edge="end"
                    size="small"
                  >
                    {showOtp ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            py: 1.5,
            fontWeight: 600,
            backgroundColor: "#4F6CF8",
            borderRadius: 2,
            mt: 1,
          }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Login"
          )}
        </Button>

        {message && (
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              color: "#4F6CF8",
              bgcolor: "#EEF2FF",
              p: 1,
              borderRadius: 1,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoginFormAdmin;