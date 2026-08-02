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
import { getDefaultRouteForRole, normalizeRole } from "../utils/role.utils";


const LoginFormAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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
  }
);
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

      const normalizedRole = normalizeRole(role);
      if (["ADMIN", "SUPERADMIN", "EMPLOYEE"].includes(normalizedRole ?? "")) {
        navigate(getDefaultRouteForRole(normalizedRole), { replace: true });
      } else {
        setMessage("Please use the standard login page");
        localStorage.clear();
      }


    } catch (err: unknown) {
      setMessage(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        "Server error. Please try again."

      );
      if (axios.isAxiosError(err)) console.log(err.response?.data);
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
