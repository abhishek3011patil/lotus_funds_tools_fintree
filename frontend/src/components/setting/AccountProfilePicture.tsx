import { useState } from "react";
import { Alert, Box } from "@mui/material";
import ProfilePictureUpload from "./ProfilePictureUpload";

type Props = {
  currentFilename?: string | null;
  name: string;
  onSaved?: (filename: string) => void;
};

export default function AccountProfilePicture({ currentFilename, name, onSaved }: Props) {
  const [savedFilename, setSavedFilename] = useState<string>();
  const [success, setSuccess] = useState(false);

  const save = async (file: File) => {
    setSuccess(false);
    const body = new FormData();
    body.append("profile_image", file);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/registration/profile-picture`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body,
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to save your picture.");
    setSavedFilename(result.profileImage);
    onSaved?.(result.profileImage);
    window.dispatchEvent(new CustomEvent("profile-picture-updated", { detail: result.profileImage }));
    setSuccess(true);
  };

  return (
    <Box>
      <ProfilePictureUpload
        currentFilename={savedFilename || currentFilename || undefined}
        name={name}
        onChange={() => {}}
        onSave={save}
        helperText="Picture changes are saved immediately."
      />
      {success && <Alert severity="success" onClose={() => setSuccess(false)}>Profile picture updated successfully.</Alert>}
    </Box>
  );
}
