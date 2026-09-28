import { useEffect, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import ProfilePictureUpload from "./ProfilePictureUpload";

type Profile = { first_name?: string; surname?: string; profile_image?: string };
export default function RAProfilePicture({ profile, onSaved }: { profile?: Profile; onSaved?: (filename: string) => void }) {
  const [loadedProfile, setLoadedProfile] = useState<Profile>();
  const [savedFilename, setSavedFilename] = useState<string>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (profile) return;
    const controller = new AbortController();
    setError("");
    fetch(`${import.meta.env.VITE_API_URL || ""}/api/registration/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(); const result = await r.json(); if (!controller.signal.aborted) setLoadedProfile(result.data); })
      .catch(() => { if (!controller.signal.aborted) setError("Unable to load your profile picture."); });
    return () => controller.abort();
  }, [profile, attempt]);
  const current = profile || loadedProfile;
  const save = async (file: File) => {
    setSuccess(false);
    const body = new FormData(); body.append("profile_image", file);
    const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/registration/profile-picture`, { method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to save your picture.");
    setSavedFilename(result.profileImage); onSaved?.(result.profileImage); setSuccess(true);
  };
  return <Box>
    {error && <Alert severity="error" action={<Button onClick={() => setAttempt(n => n + 1)}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <ProfilePictureUpload currentFilename={savedFilename || current?.profile_image} name={[current?.first_name, current?.surname].filter(Boolean).join(" ")} onChange={() => {}} onSave={save} helperText="Picture changes are saved immediately. No admin approval is needed." />
    {success && <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 3 }}>Profile picture updated successfully.</Alert>}
  </Box>;
}
