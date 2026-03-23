import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

type Registration = {
  [key: string]: any;
};

const EditRA = () => {
  const { id } = useParams();
  const [data, setData] = useState<Registration | null>(null);
  const [fields, setFields] = useState<any>({});
  const [files, setFiles] = useState<any>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/registration/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setData(result);
        setFields(result);
      } catch (err) {
        console.error("Failed to fetch RA:", err);
        setErrorMsg("Failed to load data");
      }
    };
    fetchData();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const openFile = (file?: string) => {
    if (!file) return alert("File not uploaded");
    const url = `http://localhost:3000/uploads/${encodeURIComponent(file)}`;
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    const formData = new FormData();

    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined && fields[key] !== null) {
        formData.append(key, fields[key]);
      }
    });

    Object.keys(files).forEach((key) => {
      formData.append(key, files[key]);
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMsg("Authorization token missing. Please login again.");
        return;
      }

      const res = await fetch(`http://localhost:3000/api/registration/edit/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setSuccessMsg("Registration updated successfully!");
      } else {
        setErrorMsg(result.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error");
    }
  };

  const fileFields = [
    { key: "profile_image", label: "Profile Image" },
    { key: "pan_card", label: "PAN Card" },
    { key: "address_proof_document", label: "Address Proof" },
    { key: "sebi_certificate", label: "SEBI Certificate" },
    { key: "sebi_receipt", label: "SEBI Receipt" },
    { key: "nism_certificate", label: "NISM Certificate" },
    { key: "cancelled_cheque", label: "Cancelled Cheque" },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Edit Research Analyst Registration
      </Typography>

      {/* Snackbar for Success */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccessMsg("")} severity="success" sx={{ width: "100%" }}>
          {successMsg}
        </Alert>
      </Snackbar>

      {/* Snackbar for Error */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setErrorMsg("")} severity="error" sx={{ width: "100%" }}>
          {errorMsg}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[
                "salutation",
                "first_name",
                "middle_name",
                "surname",
                "org_name",
                "designation",
                "short_bio",
                "email",
                "mobile",
                "telephone",
              ].map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace("_", " ").toUpperCase()}
                    name={field}
                    value={fields[field] || ""}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Address</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {["address_line1", "address_line2", "city", "state", "country", "pincode"].map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace("_", " ").toUpperCase()}
                    name={field}
                    value={fields[field] || ""}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Bank */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Bank Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {["bank_name", "account_holder", "account_number", "ifsc_code"].map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace("_", " ").toUpperCase()}
                    name={field}
                    value={fields[field] || ""}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Files */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {fileFields.map((file) => (
                <Grid item xs={12} sm={6} key={file.key} sx={{ display: "flex", alignItems: "center" }}>
                  <Button variant="outlined" component="label">
                    Upload {file.label}
                    <input type="file" hidden name={file.key} onChange={handleFileChange} />
                  </Button>
                  <Button variant="outlined" sx={{ ml: 1 }} onClick={() => openFile(data[file.key])}>
                    View
                  </Button>
                  <Typography sx={{ ml: 2, fontSize: 12, color: "gray" }}>
                    {files[file.key]?.name || data[file.key]}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Status & Save */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Typography>Status: {fields.status || "Pending"}</Typography>
            <Button variant="contained" color="primary" onClick={handleSave}>Save Changes</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditRA;