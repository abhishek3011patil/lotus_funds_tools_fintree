import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";

type ClientRegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  aadhaarNumber: string;
  aadhaarKycStatus: string;
  aadhaarReferenceId: string;
  aadhaarVerificationToken: string;
};

const ClientRegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientRegistrationForm>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
      aadhaarNumber: "",
  aadhaarKycStatus: "",
  aadhaarReferenceId: "",
  aadhaarVerificationToken: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
const [aadhaarVerified, setAadhaarVerified] = useState(false);
const [aadhaarReferenceId, setAadhaarReferenceId] = useState("");
const [aadhaarChallengeToken, setAadhaarChallengeToken] = useState("");
const [aadhaarLoading, setAadhaarLoading] = useState(false);
const [aadhaarMessage, setAadhaarMessage] = useState("");

  const profilePreview = useMemo(
    () => (profilePicture ? URL.createObjectURL(profilePicture) : ""),
    [profilePicture]
  );

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const updateField = (field: keyof ClientRegistrationForm) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setNotice("");
    setError("");
    if (field === "email") resetAadhaarVerification();
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const resetAadhaarVerification = () => {
    setAadhaarVerified(false);
    setAadhaarOtpSent(false);
    setAadhaarOtp("");
    setAadhaarReferenceId("");
    setAadhaarChallengeToken("");
    setAadhaarMessage("");
    setForm((current) => ({ ...current, aadhaarKycStatus: "", aadhaarReferenceId: "", aadhaarVerificationToken: "" }));
  };

  const handlePicture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setNotice("");
    setError("");

    if (file && !file.type.startsWith("image/")) {
      setNotice("Please select an image file for the profile picture.");
      event.target.value = "";
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setNotice("Profile picture must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setProfilePicture(file);
  };

  const handleSendAadhaarOtp = async () => {
  setNotice("");
  setError("");
  setAadhaarMessage("");

  const aadhaar = form.aadhaarNumber.replace(/\D/g, "");

  if (!/^\d{12}$/.test(aadhaar)) {
    setError("Please enter a valid 12-digit Aadhaar number.");
    return;
  }

  setAadhaarLoading(true);
  resetAadhaarVerification();

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/aadhaar/send-otp`,
      {
        aadhaar_number: aadhaar,
        email: form.email,
        purpose: "client_registration",
      }
    );

    const referenceId =
      response.data?.reference_id ||
      response.data?.data?.reference_id ||
      "";

    if (!referenceId || !response.data?.challenge_token) {
      throw new Error("Aadhaar reference ID was not received.");
    }

    setAadhaarReferenceId(referenceId);
    setAadhaarChallengeToken(response.data.challenge_token);
    setAadhaarOtpSent(true);
    setAadhaarMessage("OTP sent successfully to your Aadhaar-linked mobile number.");
  } catch (requestError: unknown) {
    setError(
      axios.isAxiosError(requestError)
        ? requestError.response?.data?.message ||
            "Unable to send Aadhaar OTP."
        : "Unable to send Aadhaar OTP."
    );
  } finally {
    setAadhaarLoading(false);
  }
};
const handleVerifyAadhaarOtp = async () => {
  setNotice("");
  setError("");
  setAadhaarMessage("");

  const aadhaar = form.aadhaarNumber.replace(/\D/g, "");
  const otp = aadhaarOtp.replace(/\D/g, "");

  if (!/^\d{12}$/.test(aadhaar)) {
    setError("Please enter a valid 12-digit Aadhaar number.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    setError("Please enter a valid 6-digit OTP.");
    return;
  }

  if (!aadhaarReferenceId) {
    setError("Please request Aadhaar OTP first.");
    return;
  }

  setAadhaarLoading(true);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/aadhaar/verify-otp`,
      {
        aadhaar_number: aadhaar,
        reference_id: aadhaarReferenceId,
        otp,
        email: form.email,
        purpose: "client_registration",
        challenge_token: aadhaarChallengeToken,
      }
    );

    if (response.data?.success && response.data?.verification_token) {
      setAadhaarVerified(true);
      setAadhaarOtpSent(false);

      setForm((current) => ({
        ...current,
        aadhaarNumber: aadhaar,
        aadhaarKycStatus: "VERIFIED",
        aadhaarReferenceId: aadhaarReferenceId,
        aadhaarVerificationToken: response.data.verification_token,
      }));

      setAadhaarMessage(
        "Aadhaar KYC verified successfully."
      );
    } else {
      setError(
        response.data?.message ||
          "Aadhaar verification failed."
      );
    }
  } catch (requestError: unknown) {
    setError(
      axios.isAxiosError(requestError)
        ? requestError.response?.data?.message ||
            "Aadhaar verification failed."
        : "Aadhaar verification failed."
    );
  } finally {
    setAadhaarLoading(false);
  }
};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (
  form.aadhaarKycStatus !== "VERIFIED" ||
  !form.aadhaarNumber ||
  !form.aadhaarReferenceId ||
  !form.aadhaarVerificationToken
) {
  setError("Please complete Aadhaar KYC verification before creating your account.");
  return;
}

setSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (profilePicture) payload.append("profilePicture", profilePicture);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/client/register`,
        payload
      );

      setNotice(response.data.message || "Registration completed. You can now sign in.");
      window.setTimeout(() => {
        navigate("/client/login", {
          replace: true,
          state: { registeredEmail: form.email.trim().toLowerCase() },
        });
      }, 900);
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError) && requestError.response?.data?.field === "aadhaarNumber") {
        resetAadhaarVerification();
      }
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message || "Unable to complete registration."
          : "Unable to complete registration."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F4F7FE", p: { xs: 2, sm: 3.5 } }}>
      <Box sx={{ maxWidth: 920, mx: "auto" }}>
        <Button
          component={RouterLink}
          to="/client/login"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ mb: 2, textTransform: "none", color: "#4159CC", fontWeight: 700 }}
        >
          Back to client login
        </Button>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 18px 50px rgba(47, 62, 121, 0.12)" }}
        >
          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 3.5 }, color: "#fff", background: "linear-gradient(115deg, #5271FF 0%, #6B81F8 70%, #22C55E 170%)" }}>
            <Stack direction="row" spacing={1.6} alignItems="center">
              <Box sx={{ p: 1.2, bgcolor: "rgba(255,255,255,.16)", borderRadius: 2.5, display: "flex" }}>
                <PersonAddAltRoundedIcon sx={{ fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.55rem", sm: "1.9rem" } }}>
                  Create your client profile
                </Typography>
                <Typography sx={{ mt: 0.35, opacity: 0.9 }}>
                  Tell us a little about yourself to get started.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }} mb={3.5}>
              <Avatar src={profilePreview || undefined} sx={{ width: 88, height: 88, bgcolor: "#E9EDFF", color: "#5271FF", fontSize: 30, fontWeight: 800 }}>
                {form.firstName.charAt(0).toUpperCase() || "C"}
              </Avatar>
              <Box>
                <Button component="label" variant="outlined" startIcon={<AddAPhotoOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Add profile picture
                  <input hidden type="file" accept="image/*" onChange={handlePicture} />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.8}>
                  JPG, PNG or WEBP, up to 5 MB.
                </Typography>
                {profilePicture && (
                  <Stack direction="row" spacing={0.5} alignItems="center" mt={0.4}>
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profilePicture.name}
                    </Typography>
                    <IconButton size="small" aria-label="Remove profile picture" onClick={() => setProfilePicture(null)}>×</IconButton>
                  </Stack>
                )}
              </Box>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2.2 }}>
              <TextField label="First name" value={form.firstName} onChange={updateField("firstName")} required autoComplete="given-name" />
              <TextField label="Last name" value={form.lastName} onChange={updateField("lastName")} required autoComplete="family-name" />
              <TextField label="Email address" type="email" value={form.email} onChange={updateField("email")} disabled={aadhaarLoading} required autoComplete="email" sx={{ gridColumn: { sm: "1 / -1" } }} />
              <TextField
                label="Phone number"
                value={form.phoneNumber}
                onChange={updateField("phoneNumber")}
                required
                autoComplete="tel"
                inputProps={{ inputMode: "tel", pattern: "[0-9+() -]{7,20}" }}
                helperText="Include your country code when applicable."
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />

              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
  <Stack spacing={1.5}>
    <TextField
      label="Aadhaar Number"
      value={form.aadhaarNumber}
      onChange={(event) => {
        const value = event.target.value
          .replace(/\D/g, "")
          .slice(0, 12);

        setNotice("");
        setError("");
        setAadhaarMessage("");
        resetAadhaarVerification();
        setForm((current) => ({
          ...current,
          aadhaarNumber: value,
          aadhaarKycStatus: "",
          aadhaarReferenceId: "",
        }));

        setAadhaarVerified(false);
      }}
      required
      disabled={aadhaarVerified || aadhaarLoading}
      inputProps={{
        maxLength: 12,
        inputMode: "numeric",
      }}
      helperText="Enter your 12-digit Aadhaar number."
    />

    {!aadhaarVerified && !aadhaarOtpSent && (
      <Button
        type="button"
        variant="outlined"
        onClick={handleSendAadhaarOtp}
        disabled={
          aadhaarLoading ||
          form.aadhaarNumber.replace(/\D/g, "").length !== 12
        }
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontWeight: 700,
        }}
      >
        {aadhaarLoading ? (
          <CircularProgress size={20} />
        ) : (
          "Send OTP"
        )}
      </Button>
    )}

    {aadhaarOtpSent && !aadhaarVerified && (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "flex-start" }}
      >
        <TextField
          label="Enter OTP"
          value={aadhaarOtp}
          onChange={(event) => {
            const value = event.target.value
              .replace(/\D/g, "")
              .slice(0, 6);

            setAadhaarOtp(value);
            setError("");
            setAadhaarMessage("");
          }}
          inputProps={{
            maxLength: 6,
            inputMode: "numeric",
          }}
          sx={{ flex: 1 }}
        />

        <Button
          type="button"
          variant="contained"
          onClick={handleVerifyAadhaarOtp}
          disabled={aadhaarLoading || aadhaarOtp.length !== 6}
          sx={{
            minWidth: 130,
            py: 1.7,
            textTransform: "none",
            fontWeight: 700,
            bgcolor: "#5271FF",
          }}
        >
          {aadhaarLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Verify OTP"
          )}
        </Button>
        <Button type="button" onClick={handleSendAadhaarOtp} disabled={aadhaarLoading}>
          Resend OTP
        </Button>
      </Stack>
    )}

    {aadhaarMessage && (
      <Alert severity={aadhaarVerified ? "success" : "info"}>
        {aadhaarMessage}
      </Alert>
    )}
  </Stack>
</Box>

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField("password")}
                required
                autoComplete="new-password"
                helperText="At least 8 characters with one letter and one number."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                required
                autoComplete="new-password"
                error={Boolean(form.confirmPassword && form.password !== form.confirmPassword)}
                helperText={
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "Passwords do not match."
                    : " "
                }
              />
            </Box>

            {notice && <Alert severity="success" sx={{ mt: 3 }}>{notice}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} mt={3.5}>
              <Typography variant="body2" color="text.secondary">
                Already registered?{" "}
                <Box component={RouterLink} to="/client/login" sx={{ color: "#4159CC", fontWeight: 750, textDecoration: "none" }}>
                  Sign in
                </Box>
              </Typography>
              <Button disabled={submitting} type="submit" variant="contained" sx={{ minWidth: 190, py: 1.15, textTransform: "none", bgcolor: "#5271FF", fontWeight: 750 }}>
                {submitting ? <CircularProgress size={22} color="inherit" /> : "Create account"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ClientRegistrationPage;
