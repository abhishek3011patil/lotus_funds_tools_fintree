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
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import { Link as RouterLink } from "react-router-dom";

type ClientRegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

const ClientRegistrationPage = () => {
  const [form, setForm] = useState<ClientRegistrationForm>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [notice, setNotice] = useState("");

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
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handlePicture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setNotice("");

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNotice(
      "The form is ready, but client registration submission is not connected to the backend yet. No information has been saved."
    );
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
              <TextField label="Email address" type="email" value={form.email} onChange={updateField("email")} required autoComplete="email" sx={{ gridColumn: { sm: "1 / -1" } }} />
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
            </Box>

            {notice && <Alert severity="info" sx={{ mt: 3 }}>{notice}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} mt={3.5}>
              <Typography variant="body2" color="text.secondary">
                Already registered?{" "}
                <Box component={RouterLink} to="/client/login" sx={{ color: "#4159CC", fontWeight: 750, textDecoration: "none" }}>
                  Sign in
                </Box>
              </Typography>
              <Button type="submit" variant="contained" sx={{ minWidth: 190, py: 1.15, textTransform: "none", bgcolor: "#5271FF", fontWeight: 750 }}>
                Submit registration
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ClientRegistrationPage;
