import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Select,
  CircularProgress
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginForm: React.FC = () => {
  const roles = ["Broker", "Research Analyst"];
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;

    if (val === "Other") {
      setIsOther(true);
      setFormData((prev) => ({ ...prev, role: "" }));
    } else {
      setFormData((prev) => ({ ...prev, role: val }));
    }
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
          username: formData.username,
          password: formData.password,
        }
      );

      const { token, role } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("username", res.data.username);

      // Role-based redirect
      if (role === "Admin") {
        navigate("/dashboard");
      } else {
        navigate("/recommendations");
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

        {!isOther ? (
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              value={formData.role}
              label="Role"
              onChange={handleSelectChange}
              sx={{
                borderRadius: 2,
                backgroundColor: "#F8FBFF",
              }}
            >
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            name="role"
            placeholder="Enter Role"
            value={formData.role}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setIsOther(false)}
                    size="small"
                    title="Back to list"
                  >
                    <RestartAltIcon fontSize="small" />
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

export default LoginForm;
