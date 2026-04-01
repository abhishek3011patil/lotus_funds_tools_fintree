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
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";

const NewPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Step 1: Password Entry | Step 2: OTP Entry
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:3000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
  // 🚨 Remove old login session
  localStorage.removeItem("token");
}, []);

  const isMismatch = formData.confirmPassword !== "" && formData.password !== formData.confirmPassword;

  // STEP 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMismatch) return;

    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_URL}/api/auth/request-otp`, {
        token,
        password: formData.password,
      });
      setStep(2);
      setMessage("OTP sent to your registered email!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Save
  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/verify-otp-and-set-password`, {
        token,
        otp,
        password: formData.password,
      });
      setMessage("Password successfully updated!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Invalid OTP.");
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F4F7FE", p: 2 }}>
      <Box component="form" onSubmit={step === 1 ? handleRequestOTP : handleVerifyAndSave} sx={{ width: "100%", maxWidth: 400, bgcolor: "#ffffff", p: 4, borderRadius: 4, boxShadow: "0 15px 35px rgba(0,0,0,0.1)" }}>
        
        <Typography variant="h4" sx={{ color: "#4F6CF8", textAlign: "center", mb: 3, fontWeight: 700 }}>
          {step === 1 ? "Set New Password" : "Verify Email"}
        </Typography>

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
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        ) : (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Please enter the 6-digit code sent to your email to confirm your new password.
            </Typography>
            <TextField
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
              required
              sx={inputStyles}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' } }}
            />
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || (step === 1 && (isMismatch || !formData.password)) || (step === 2 && otp.length < 4)}
          sx={{ py: 1.5, fontWeight: 600, backgroundColor: "#4F6CF8", borderRadius: 2, mt: 1 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : (step === 1 ? "Get OTP" : "Verify & Save")}
        </Button>

        {step === 2 && (
            <Button fullWidth variant="text" sx={{ mt: 1, textTransform: 'none', color: '#4F6CF8' }} onClick={() => setStep(1)}>
                Change Password
            </Button>
        )}

        {message && (
          <Typography sx={{ mt: 2, textAlign: "center", color: "#4F6CF8", bgcolor: "#EEF2FF", p: 1, borderRadius: 1, fontSize: '0.9rem' }}>
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NewPassword;