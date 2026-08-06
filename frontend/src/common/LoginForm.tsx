import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingPage from "./LoadingPage";

const LoginForm: React.FC = () => {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
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

  const handleClickShowPassword = () =>
    setShowPassword((show) => !show);

  const handleClickShowOtp = () =>
  setShowOtp((show) => !show);


const handleSendOtp = async () => {
  if (!formData.username.trim()) {
    setMessage("Please enter your email first.");
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

    setMessage(
      res.data.message || "OTP has been sent to your registered email."
    );

  } catch (err: any) {
    setMessage(
      err.response?.data?.message ||
        "Failed to send OTP. Please try again."
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
          loginId: formData.username,   // ✅ FIX HERE
          password: formData.password,
          otp: formData.otp,
        }
      );
      if (res.data.requireOtp && !isOtpRequired) {
  setIsOtpRequired(true);
  setLoading(false);

  await handleSendOtp();

  return;
}
      const { token, role } = res.data;

      localStorage.setItem("token", token);

// ✅ ADD THIS
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

localStorage.setItem(
  "tokenExpiry",
  (Date.now() + THIRTY_DAYS).toString()
);

localStorage.setItem("username", res.data.username);

localStorage.setItem("role", role);

   
  if (role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN") {
  setMessage("Please use company login page");
  localStorage.clear();

  return;
}

     if (role === "RESEARCH_ANALYST") {
  navigate("/recommendations", {
    replace: true,
  });
} else if (role === "BROKER") {
        navigate("/broker/dashboard");
      } else if (role === "CLIENT") {
        navigate("/client/dashboard", { replace: true });
      } else {
        setMessage("Invalid role");
        localStorage.clear();
      }
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
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

  // Show shared full-page loader while login request is in progress.
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
          Login
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
                  {showPassword ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

{/* Dynamic OTP Section */}
{isOtpRequired && (
  <Box sx={{ mt: 2 }}>

    <TextField
      name="otp"
      placeholder="Enter OTP"
      value={formData.otp}
      onChange={handleChange}
      fullWidth
      sx={inputStyles}
    />

    <Button
      fullWidth
      variant="outlined"
      sx={{ mt: 1 }}
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
        {/* Submit Button */}
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
            href="/registration"
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
        onClick={() => navigate("/login-admin")} // Your company login route
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

export default LoginForm;
