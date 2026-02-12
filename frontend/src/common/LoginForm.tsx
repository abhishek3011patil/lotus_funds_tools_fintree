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
  Select
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

// Icons
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    designation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fixed the event type here
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsOther(true);
      setFormData((prev) => ({ ...prev, designation: "" }));
    } else {
      setFormData((prev) => ({ ...prev, designation: val }));
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(`Login successful for ${formData.username}!`);
  };

  const inputStyles = {
    mb: 2,
    "& .MuiInputBase-root": {
      borderRadius: 2,
      backgroundColor: "#F8FBFF",
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F4F7FE", p: 2 }}>
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ width: "100%", maxWidth: 400, bgcolor: "#ffffff", p: 4, borderRadius: 4, boxShadow: "0 15px 35px rgba(0,0,0,0.1)" }}
      >
        <Typography variant="h4" sx={{ color: "#4F6CF8", textAlign: "center", mb: 3, fontWeight: 700 }}>
          Login
        </Typography>

        <TextField name="username" placeholder="Username" value={formData.username} onChange={handleChange} fullWidth required sx={inputStyles} />
        
        <TextField name="email" type="email" placeholder="Email ID" value={formData.email} onChange={handleChange} fullWidth required sx={inputStyles} />

        <TextField
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={inputStyles}
          // Using InputProps for broader compatibility
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

        {!isOther ? (
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="designation-label">Designation</InputLabel>
            <Select
              labelId="designation-label"
              value={formData.designation}
              label="Designation"
              onChange={handleSelectChange}
              sx={{ borderRadius: 2, backgroundColor: "#F8FBFF" }}
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Research Analyst">Research Analyst</MenuItem>
              <MenuItem value="Other">+ Other Designation</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <TextField
            name="designation"
            placeholder="Enter Designation"
            value={formData.designation}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setIsOther(false)} size="small" title="Back to list">
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontWeight: 600, backgroundColor: "#4F6CF8", borderRadius: 2, mt: 1 }}>
          Login
        </Button>

        {message && (
          <Typography sx={{ mt: 2, textAlign: "center", color: "#4F6CF8", bgcolor: "#EEF2FF", p: 1, borderRadius: 1 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoginForm;