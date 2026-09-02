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
import AuthBackdrop from "./AuthBackdrop";
import { consumeAuthMessage, consumePostLoginPath } from "../utils/authRedirect";


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
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState(consumeAuthMessage);
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
  if (!formData.username.trim()) {
    setMessage("Please enter your username first.");
    return;
  }

  setSendingOtp(true);
  setMessage("");

  try {
    const res = await axios.post(
      `${API_URL}/api/auth/send-otp`,
      {
        loginId: formData.username.trim(),
      }
    );

    setIsOtpSent(true);

    setMessage(res.data.message);

  } catch (err: unknown) {
    setMessage(
      (axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined) ||
      "Failed to send OTP."
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

if (res.data.requireOtp) {
  setIsOtpRequired(true);
  setLoading(false);
  return;
}

      const { token, role } = res.data;


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
      if (role === "ADMIN" || role === "SUPERADMIN") navigate(consumePostLoginPath("/admin", ["/admin", "/automation", "/morning-report-builder", "/morning-report-view", "/logo-theme", "/email-generator"]), { replace: true });
      if (role === "EMPLOYEE") navigate(consumePostLoginPath("/automation", ["/automation", "/morning-report-builder", "/morning-report-view", "/logo-theme", "/email-generator"]), { replace: true });


    } catch (err: unknown) {
      setMessage(
        (axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message
          : undefined) ||
        "Server error. Please try again."
      );
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
        position: "relative",
        overflow: "hidden",
        justifyContent: { xs: "center", md: "flex-end" },
        alignItems: "center",
        background: "#f8f9fd",
        p: { xs: 2, md: 4 },
        pr: { md: "8vw" },
      }}
    >
      <AuthBackdrop
        portal="Company Portal"
        accent="#14213d"
        message="A calm command centre for operations, governance and oversight."
      />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 430,
          bgcolor: "#ffffff",
          p: 4,
          borderRadius: 4,
          border: "1px solid #e7eaf2",
          boxShadow: "0 24px 65px rgba(27,42,82,0.12)",
          position: "relative",
          zIndex: 1,
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
          label="Username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          required
          sx={inputStyles}
        />

        <TextField
          name="password"
          label="Password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

      {/* Dynamic OTP Section */}
       {isOtpRequired && (
  <>
    <TextField
      name="otp"
      label="One-time password"
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
            <IconButton
              onClick={handleClickShowOtp}
              edge="end"
              size="small"
              aria-label={showOtp ? "Hide one-time password" : "Show one-time password"}
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

    <Button
      variant="outlined"
      fullWidth
      onClick={handleSendOtp}
      disabled={sendingOtp}
      sx={{
        mb: 2,
        mt: 1,
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
      ) : isOtpSent ? (
        "Resend OTP"
      ) : (
        "Send OTP"
      )}
    </Button>
  </>
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
            role="status"
            aria-live="polite"
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
