import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    password: "",
    role: ""
  });

  const [message, setMessage] = useState("");

  // ✅ handleChange for TextField inputs only
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(
      `Welcome ${formData.fname} ${formData.lname}! You are logged in as ${formData.role}.`
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
        p: 2
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 380,
          bgcolor: "rgba(255,255,255,0.95)",
          p: 4,
          borderRadius: 4,
          boxShadow: "0 15px 35px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.15)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#246aed",
            textAlign: "center",
            mb: 3,
            fontWeight: 600,
            letterSpacing: 1
          }}
        >
          Sign Up
        </Typography>

        {/* First + Last Name */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <TextField
            id="fname"
            placeholder="First Name"
            value={formData.fname}
            onChange={handleChange}
            fullWidth
            required
            sx={{
              "& .MuiInputBase-root": {
                borderRadius: 2,
                backgroundColor: "#F8FBFF",
                "&:hover fieldset": { borderColor: "#6495ED" },
                "&.Mui-focused fieldset": {
                  borderColor: "#246aed",
                  boxShadow: "0 0 0 4px rgba(100,149,237,0.1)"
                }
              }
            }}
          />
          <TextField
            id="lname"
            placeholder="Last Name"
            value={formData.lname}
            onChange={handleChange}
            fullWidth
            required
            sx={{
              "& .MuiInputBase-root": {
                borderRadius: 2,
                backgroundColor: "#F8FBFF",
                "&:hover fieldset": { borderColor: "#6495ED" },
                "&.Mui-focused fieldset": {
                  borderColor: "#246aed",
                  boxShadow: "0 0 0 4px rgba(100,149,237,0.1)"
                }
              }
            }}
          />
        </Box>

        {/* Email */}
        <TextField
          id="email"
          type="email"
          placeholder="Email ID"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
          sx={{
            mb: 2,
            "& .MuiInputBase-root": {
              borderRadius: 2,
              backgroundColor: "#F8FBFF",
              "&:hover fieldset": { borderColor: "#6495ED" },
              "&.Mui-focused fieldset": {
                borderColor: "#246aed",
                boxShadow: "0 0 0 4px rgba(100,149,237,0.1)"
              }
            }
          }}
        />

        {/* Phone */}
        <TextField
          id="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          required
          sx={{
            mb: 2,
            "& .MuiInputBase-root": {
              borderRadius: 2,
              backgroundColor: "#F8FBFF",
              "&:hover fieldset": { borderColor: "#246aed" },
              "&.Mui-focused fieldset": {
                borderColor: "#246aed",
                boxShadow: "0 0 0 4px rgba(100,149,237,0.1)"
              }
            }
          }}
        />

        {/* Password */}
        <TextField
          id="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={{
            mb: 2,
            "& .MuiInputBase-root": {
              borderRadius: 2,
              backgroundColor: "#F8FBFF",
              "&:hover fieldset": { borderColor: "#6495ED" },
              "&.Mui-focused fieldset": {
                borderColor: "#246aed",
                boxShadow: "0 0 0 4px rgba(100,149,237,0.1)"
              }
            }
          }}
        />

        {/* Role Select */}
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            sx={{
              borderRadius: 2,
              backgroundColor: "#F8FBFF",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E6F0FF" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6495ED" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6495ED" }
            }}
          >
            <MenuItem value=""><em>Select Role</em></MenuItem>
            <MenuItem value="Client">Individual</MenuItem>
            <MenuItem value="RA">Research Analyst</MenuItem>
            <MenuItem value="Broker">Broker</MenuItem>
          </Select>
        </FormControl>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          sx={{
            py: 1.5,
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #6495ED 0%, #246aed 100%)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            borderRadius: 2,
            boxShadow: "0 4px 15px rgba(100,149,237,0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #246aed 0%, #1E90FF 100%)",
              boxShadow: "0 6px 20px rgba(100,149,237,0.5)"
            },
            "&:active": {
              transform: "translateY(-1px)",
              boxShadow: "0 3px 10px rgba(100,149,237,0.4)"
            }
          }}
        >
          Sign Up
        </Button>

        {/* Message */}
        {message && (
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              color: "#246aed",
              fontWeight: 500,
              p: 1,
              borderRadius: 1,
              backgroundColor: "#E6F0FF"
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Signup;
