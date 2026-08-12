import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import axios from "axios";
import { updateClientPassword } from "../api";

const ChangePasswordPanel = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      const result = await updateClientPassword(currentPassword, newPassword);
      setSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message || "Unable to change password."
          : "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  const visibilityAdornment = (
    <InputAdornment position="end">
      <IconButton aria-label={showPasswords ? "Hide passwords" : "Show passwords"} onClick={() => setShowPasswords((value) => !value)} edge="end">
        {showPasswords ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ borderRadius: 3, borderColor: "#E5EAF2", p: { xs: 2.25, sm: 3 }, maxWidth: 680 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
        <Box sx={{ p: 1.1, borderRadius: 2, bgcolor: "#EEF1FF", color: "#5271FF", display: "flex" }}><LockOutlinedIcon /></Box>
        <Box><Typography variant="h6" fontWeight={800}>Change password</Typography><Typography variant="body2" color="text.secondary">Use at least 8 characters for your new password.</Typography></Box>
      </Stack>

      <Stack spacing={2.1} mt={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="Current password" type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required fullWidth InputProps={{ endAdornment: visibilityAdornment }} />
        <TextField label="New password" type={showPasswords ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required fullWidth inputProps={{ minLength: 8 }} />
        <TextField label="Confirm new password" type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required fullWidth />
        <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: { sm: "flex-start" }, minWidth: 170, py: 1.15, bgcolor: "#5271FF", textTransform: "none", fontWeight: 750 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : "Update password"}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ChangePasswordPanel;
