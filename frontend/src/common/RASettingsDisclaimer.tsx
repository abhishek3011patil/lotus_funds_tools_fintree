import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";

const RASettingsDisclaimer = () => {
  const [disclaimer, setDisclaimer] = useState("");
  const [success, setSuccess] = useState("");

 useEffect(() => {
  fetch(
    `${import.meta.env.VITE_API_URL}/api/registration/research/disclaimer`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      setDisclaimer(data.disclaimer || "");
    });
}, []);

const saveDisclaimer = async () => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/registration/research/disclaimer`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        disclaimer,
      }),
    }
  );

  const data = await res.json();

  if (res.ok) {
    setSuccess("Disclaimer updated successfully");
    console.log("Saved:", data);
  } else {
    console.error(data);
  }
};

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Research Analyst Disclaimer
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={8}
          label="Disclaimer"
          value={disclaimer}
          onChange={(e) => setDisclaimer(e.target.value)}
        />

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={saveDisclaimer}
        >
          Save Disclaimer
        </Button>

        {success && (
          <Alert sx={{ mt: 2 }} severity="success">
            {success}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RASettingsDisclaimer;