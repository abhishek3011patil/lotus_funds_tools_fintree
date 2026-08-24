import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingPage from "../../common/LoadingPage";

const LoginFormBroker: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpRequired, setIsOtpRequired] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSendOtp = async () => {
    if (!formData.username.trim()) {
      setMessage("Please enter your email first.");
      return;
    }

    setSendingOtp(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, {
        loginId: formData.username.trim(),
      });

      setIsOtpSent(true);
      setMessage(
        res.data.message || "OTP has been sent to your registered email."
      );
    } catch (err: unknown) {
      setMessage(
        axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || "Failed to send OTP. Please try again."
          : "Failed to send OTP. Please try again."
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
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        loginId: formData.username,
        password: formData.password,
        otp: formData.otp,
        requestedRole: "BROKER",
      });

      // Dynamic check for OTP requirement
      if (res.data.requireOtp && !isOtpRequired) {
        setIsOtpRequired(true);
        setLoading(false);
        await handleSendOtp();
        return;
      }

      const { token, role } = res.data;

      localStorage.setItem("token", token);

      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        "tokenExpiry",
        (Date.now() + THIRTY_DAYS).toString()
      );

      localStorage.setItem("username", res.data.username);
      localStorage.setItem("role", role);

      // Save OTP Expiry timestamp (1 minute test / 1 month prod)
      const OTP_EXPIRY_DURATION = 1 * 60 * 1000; // 🧪 1 min testing
      // const OTP_EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000; // 📅 1 month production
      localStorage.setItem(
        `otpExpiry_${formData.username}`,
        (Date.now() + OTP_EXPIRY_DURATION).toString()
      );

      if (role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN") {
        setMessage("Please use company login page");
        localStorage.clear();
        return;
      }

      if (role === "BROKER") {
        navigate("/broker/dashboard");
      } else {
        setMessage("Invalid role for Broker login");
        localStorage.clear();
      }
    } catch (err: unknown) {
      setMessage(
        axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || "Server error. Please try again."
          : "Server error. Please try again."
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
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 400 },
          bgcolor: "#ffffff",
          p: { xs: 3, sm: 4 },
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
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          Broker Login
        </Typography>

        <TextField
          name="username"
          placeholder="Username / Email"
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
                <IconButton onClick={handleClickShowPassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Dynamic OTP Section */}
        {isOtpRequired && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleChange}
              fullWidth
              required={isOtpRequired}
              sx={inputStyles}
            />

            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2, textTransform: "none", color: "#4F6CF8", borderColor: "#4F6CF8" }}
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? (
                <CircularProgress size={18} />
              ) : isOtpSent ? (
                "Resend OTP"
              ) : (
                "Send OTP"
              )}
            </Button>
          </Box>
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
            textTransform: "none",
          }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Login"}
        </Button>

        <Typography
          sx={{
            mt: 2,
            textAlign: "center",
            color: "#555",
            fontSize: "14px",
          }}
        >
          Don’t have an account?{" "}
          <Link
            component={RouterLink}
            to="/register/broker"
            underline="none"
            sx={{
              color: "#4F6CF8",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Register Now
          </Link>
        </Typography>

        {message && (
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              bgcolor: "#EEF2FF",
              p: 1,
              borderRadius: 1,
            }}
          >
            {message === "Please use company login page" ? (
              <Link
                component="button"
                underline="hover"
                onClick={() => navigate("/login-admin")}
                sx={{ color: "#4F6CF8", fontWeight: 600 }}
              >
                Please use company login page
              </Link>
            ) : (
              <Typography component="span" sx={{ color: "#4F6CF8" }}>
                {message}
              </Typography>
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoginFormBroker;
