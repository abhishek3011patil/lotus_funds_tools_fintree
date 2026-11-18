import { useEffect, useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { DEFAULT_RA_DISCLAIMER } from "../utils/researchCallTemplate.utils";

type Props = { onSaved?: (disclaimer: string) => void };

const RASettingsDisclaimer = ({ onSaved }: Props) => {
  const [disclaimer, setDisclaimer] = useState(DEFAULT_RA_DISCLAIMER);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_API_URL}/api/registration/research/disclaimer`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the disclaimer.");
        return response.json();
      })
      .then((data) => setDisclaimer(data.disclaimer || DEFAULT_RA_DISCLAIMER))
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(cause.message);
      });
    return () => controller.abort();
  }, []);

  const saveDisclaimer = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registration/research/disclaimer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ disclaimer }),
      });
      if (!response.ok) throw new Error("Could not save the disclaimer.");
      setMessage("Disclaimer saved.");
      onSaved?.(disclaimer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the disclaimer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2, mt: 2, borderRadius: 2.5, bgcolor: "#FFFFFF", border: "1px solid #C7D2FE" }}>
      <Typography fontWeight={800}>Research Analyst disclaimer</Typography>
      <Typography color="text.secondary" fontSize="0.75rem" sx={{ mb: 1.5 }}>
        Save your disclaimer here, then insert the Disclaimer value into your message layout.
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Disclaimer"
        value={disclaimer}
        onChange={(event) => { setDisclaimer(event.target.value); setMessage(""); }}
      />
      <Button sx={{ mt: 1.5, textTransform: "none" }} variant="contained" onClick={saveDisclaimer} disabled={saving || !disclaimer.trim()}>
        {saving ? "Saving..." : "Save disclaimer"}
      </Button>
      {message && <Alert sx={{ mt: 1.5 }} severity="success">{message}</Alert>}
      {error && <Alert sx={{ mt: 1.5 }} severity="error">{error}</Alert>}
    </Box>
  );
};

export default RASettingsDisclaimer;
