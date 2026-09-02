import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import LoadingPage from "./LoadingPage";


const NewPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // from link

  // Step 1: Set password | Step 2: Verify OTP
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "error">("success");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isMismatch =
    formData.confirmPassword !== "" && formData.password !== formData.confirmPassword;

  // ---------------- STEP 1: Request OTP ----------------
  const requestOtp = async () => {
    if (isMismatch || !formData.password) return;

    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_URL}/api/auth/request-otp`, {
  token,
  password: formData.password,
});
      setStep(2);
      setOtpCooldown(60);
      setMessageSeverity("success");
      setMessage("OTP sent to your registered email!");
    } catch (err: unknown) {
      setMessageSeverity("error");
      setMessage(
        axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || "Verification failed."
          : "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp();
  };

  // ---------------- STEP 2: Verify OTP ----------------
 const handleVerifyAndSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    if (!token) throw new Error("Token missing from URL");

    const response = await axios.post(`${API_URL}/api/auth/verify-otp-and-set-password`, {
      token,       // ✅ send the reset token
      otp,         // ✅ 6-digit OTP
      password: formData.password, // ✅ new password
    });

    setMessage("Password successfully updated!");
    setMessageSeverity("success");
    const loginPath =
      response.data?.role === "CLIENT"
        ? "/client/login"
        : "/login";
    setTimeout(() => navigate(loginPath), 2000);
  } catch (err: unknown) {
    setMessageSeverity("error");
    setMessage(
      axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || "Invalid OTP or token."
        : err instanceof Error
          ? err.message
          : "Invalid OTP or token."
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

  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#F4F7FE", p: 2 }}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 480, bgcolor: "#fff", p: 4, borderRadius: 4, boxShadow: "0 15px 35px rgba(0,0,0,0.1)" }}>
          <Typography variant="h4" fontWeight={700}>Reset link is missing</Typography>
          <Alert severity="error">This password-reset link is incomplete or invalid. Request a new link from your login page.</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={() => navigate("/login")}>Analyst login</Button>
            <Button variant="outlined" onClick={() => navigate("/client/login")}>Client login</Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // Show shared full-page loader while OTP request or verification is in progress.
  if (loading) {
    return (
      <LoadingPage
        title="Processing request"
        subtitle="Please wait while we complete your password setup."
      />
    );
  }
 console.log("NEW PASSWORD PAGE OPENED", window.location.href, token);
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
        onSubmit={step === 1 ? handleRequestOTP : handleVerifyAndSave}
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
          sx={{ color: "#4F6CF8", textAlign: "center", mb: 3, fontWeight: 700 }}
        >
          {step === 1 ? "Set New Password" : "Verify OTP"}
        </Typography>

        {/* ---------------- STEP 1 ---------------- */}
        {step === 1 ? (
          <>
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
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

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
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        ) : (
          // ---------------- STEP 2 ----------------
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              Enter the 6-digit OTP sent to your email
            </Typography>
            <TextField
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
              required
              sx={inputStyles}
              inputProps={{
                maxLength: 6,
                style: { textAlign: "center", letterSpacing: "4px", fontWeight: "bold" },
              }}
            />
            <Button
              fullWidth
              variant="text"
              sx={{ mt: 1, textTransform: "none", color: "#4F6CF8" }}
              onClick={() => setStep(1)}
            >
              Change Password
            </Button>
            <Button
              fullWidth
              variant="text"
              disabled={otpCooldown > 0 || loading}
              onClick={() => void requestOtp()}
              sx={{ textTransform: "none" }}
            >
              {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : "Resend OTP"}
            </Button>
          </Box>
        )}

        {/* ---------------- SUBMIT BUTTON ---------------- */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={
            loading ||
            (step === 1 && (isMismatch || !formData.password)) ||
            (step === 2 && otp.length !== 6)
          }
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
          ) : step === 1 ? (
            "Get OTP"
          ) : (
            "Verify & Save"
          )}
        </Button>

        {message && <Alert severity={messageSeverity} sx={{ mt: 2 }}>{message}</Alert>}
        <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
          <Button size="small" onClick={() => navigate("/login")}>Analyst login</Button>
          <Button size="small" onClick={() => navigate("/client/login")}>Client login</Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default NewPassword;
