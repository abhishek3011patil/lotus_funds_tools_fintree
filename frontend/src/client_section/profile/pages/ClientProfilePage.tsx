import { useEffect, useRef, useState } from "react";
import { Alert, Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { useNavigate } from "react-router-dom";
import ProfileOverview from "../components/ProfileOverview";
import ChangePasswordPanel from "../components/ChangePasswordPanel";
import { fetchClientProfile } from "../api";
import type { ClientProfile } from "../types";
import { getLoginRoute } from "../../../utils/authRedirect";
import { ClientProfileSkeleton } from "../../components/ClientPageSkeletons";
import ProfilePictureUpload from "../../../components/setting/ProfilePictureUpload";

type Section = "profile" | "password";

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchClientProfile(controller.signal)
      .then(setProfile)
      .catch((requestError) => {
        if (requestError?.name !== "CanceledError") setError("Unable to load your profile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const logout = () => {
    const role = localStorage.getItem("role");
    localStorage.clear();
    navigate(getLoginRoute(role, ["CLIENT"]), { replace: true });
  };

  const navButtonSx = (active: boolean) => ({
    justifyContent: "flex-start",
    textTransform: "none",
    fontWeight: active ? 750 : 600,
    color: active ? "#344FC7" : "#526078",
    bgcolor: active ? "#EEF1FF" : "transparent",
    px: 1.5,
    py: 1.15,
    "&:hover": { bgcolor: active ? "#E6EAFF" : "#F5F7FA" },
  });

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="#18213A" sx={{ fontSize: { xs: "1.65rem", sm: "2rem" } }}>
          Profile & account
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          View your account details and manage account security.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#E5EAF2", p: 1.2 }}>
          <Stack direction={{ xs: "row", md: "column" }} spacing={0.5} sx={{ overflowX: "auto" }}>
            <Button startIcon={<PersonOutlineRoundedIcon />} onClick={() => setSection("profile")} sx={navButtonSx(section === "profile")}>
              View profile
            </Button>
            <Button startIcon={<LockOutlinedIcon />} onClick={() => setSection("password")} sx={navButtonSx(section === "password")}>
              Change password
            </Button>
            <Button startIcon={<LogoutRoundedIcon />} onClick={logout} sx={{ ...navButtonSx(false), color: "#D14343", mt: { md: 1 } }}>
              Log out
            </Button>
          </Stack>
        </Paper>

        <Box>
          {loading && <ClientProfileSkeleton />}
          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && section === "profile" && profile && (
            <Stack spacing={2.5}>
              {/* Profile Picture Card matching UI exactly */}
<ProfilePictureUpload
  currentFilename={profile.avatarUrl || undefined}
  name={profile.name}
  onChange={(file) => {
    if (file) {
      const imageUrl = URL.createObjectURL(file);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: imageUrl,
            }
          : prev
      );
    }
  }}
  onSave={async (file) => {
    const body = new FormData();
    body.append("profile_image", file);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/registration/profile-picture`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to save your picture."
      );
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            avatarUrl: result.profileImage,
          }
        : prev
    );
  }}
  helperText="Picture changes are saved immediately. No admin approval is needed."
/>

              {/* Existing Profile Overview Component */}
              <ProfileOverview profile={profile} />
            </Stack>
          )}

          {!loading && !error && section === "password" && <ChangePasswordPanel />}
        </Box>
      </Box>
    </Stack>
  );
};

export default ClientProfilePage;