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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingPage from "../../common/LoadingPage";
import AuthBackdrop from "../../common/AuthBackdrop";
import { consumeAuthMessage, consumePostLoginPath } from "../../utils/authRedirect";

const LoginFormClient: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = String(
    (location.state as { registeredEmail?: string } | null)?.registeredEmail || ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState(consumeAuthMessage);
  const [loading, setLoading] = useState(false);
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    username: registeredEmail,
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
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to send OTP. Please try again."
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const openResetDialog = () => {
    setResetEmail(formData.username.trim());
    setResetMessage("");
    setResetError("");
    setResetDialogOpen(true);
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/request-password-reset`,
        {
          email: resetEmail.trim(),
          requestedRole: "CLIENT",
        }
      );
      setResetMessage(
        res.data.message ||
          "If an active Client account exists for that email, a password reset link has been sent."
      );
    } catch (err: unknown) {
      setResetError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Unable to request a password reset. Please try again."
          : "Unable to request a password reset. Please try again."
      );
    } finally {
      setResetLoading(false);
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
        requestedRole: "CLIENT",
      });

      // If backend asks for OTP and it hasn't been shown yet
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

      if (role === "CLIENT") {
        navigate(consumePostLoginPath("/client/dashboard", ["/client"]), { replace: true });
      } else {
        setMessage("Invalid role for Client login");
        localStorage.clear();
      }
    } catch (err: unknown) {
      setMessage(
        axios.isAxiosError(err)
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
        portal="Client Portal"
        accent="#16a34a"
        message="Follow credible research without losing sight of the bigger picture."
      />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 430 },
          bgcolor: "#ffffff",
          p: { xs: 3, sm: 4 },
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
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          Client Login
        </Typography>

        <TextField
          name="username"
          label="Username or email"
          placeholder="Username / Email"
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

        <Box sx={{ textAlign: "right", mt: -1, mb: 1.5 }}>
          <Link
            component="button"
            type="button"
            onClick={openResetDialog}
            underline="hover"
            sx={{
              color: "#4F6CF8",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Forgot password?
          </Link>
        </Box>

        {/* Dynamic OTP Section */}
        {isOtpRequired && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              name="otp"
              label="One-time password"
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
            to="/client/register"
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
            role="status"
            aria-live="polite"
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

      <Dialog
        open={resetDialogOpen}
        onClose={() => !resetLoading && setResetDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={handlePasswordResetRequest}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Reset your password
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "text.secondary", mb: 2 }}>
              Enter your registered Client email. We’ll send you a secure reset link.
            </Typography>
            <TextField
              autoFocus
              label="Registered email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              fullWidth
              required
              disabled={resetLoading || Boolean(resetMessage)}
              sx={inputStyles}
            />
            {resetMessage && <Alert severity="success">{resetMessage}</Alert>}
            {resetError && <Alert severity="error">{resetError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              type="button"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetLoading}
              sx={{ textTransform: "none" }}
            >
              {resetMessage ? "Close" : "Cancel"}
            </Button>
            {!resetMessage && (
              <Button
                type="submit"
                variant="contained"
                disabled={resetLoading || !resetEmail.trim()}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {resetLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Send reset link"
                )}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default LoginFormClient;
