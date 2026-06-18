import { useEffect, useState, ChangeEvent } from "react";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";

type Registration = {
  [key: string]: any;
};

const BOOLEAN_FIELDS = new Set([
  "declare_info_true",
  "consent_verification",
  "no_guaranteed_returns",
  "conflict_of_interest",
  "personal_trading",
  "sebi_compliance",
  "platform_policy",
]);

const RAProfileEditRequest = () => {
  const [data, setData] = useState<Registration | null>(null);
  const [fields, setFields] = useState<Registration>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const normalizeBool = (val: any): boolean =>
    val === true || val === "true" || val === 1 || val === "1";

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registration/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.message || "Failed to load profile");
        return;
      }

      setData(result.data);
      setFields(result.data ?? {});
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, type, value, checked } = target;

    setFields((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckbox = (name: string, checked: boolean) => {
    setFields((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({
        ...prev,
        [e.target.name]: e.target.files![0],
      }));
    }
  };

  const openFile = (file?: string) => {
    if (!file) return alert("File not uploaded");

    window.open(
      `${import.meta.env.VITE_API_URL}/uploads/${encodeURIComponent(file)}`,
      "_blank"
    );
  };

  const handleSave = async () => {
    const formData = new FormData();

    Object.keys(fields).forEach((key) => {
      const val = fields[key];

      if (val !== undefined && val !== null) {
        if (BOOLEAN_FIELDS.has(key)) {
          formData.append(key, normalizeBool(val) ? "true" : "false");
        } else {
          formData.append(key, String(val));
        }
      }
    });

    const fileKeys = [
      "profile_image",
      "pan_card",
      "address_proof_document",
      "sebi_certificate",
      "sebi_receipt",
      "nism_certificate",
      "cancelled_cheque",
    ];

    fileKeys.forEach((key) => {
      if (files[key] instanceof File) {
        formData.append(key, files[key]);
      }
    });

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registration/ra/profile-update-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.message || "Request failed");
        return;
      }

      setSuccessMsg("Profile update request sent to admin");
      setFiles({});
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error");
    }
  };

  if (!data) return <div>Loading...</div>;

  const raBasicFields = [
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
  ];

  const raAddressFields = [
    "address_line1",
    "address_line2",
    "city",
    "state",
    "country",
    "pincode",
  ];

  const raSebiFields = ["sebi_reg_no", "sebi_start_date", "sebi_expiry_date"];

  const raNismFields = ["nism_reg_no", "nism_valid_till"];

  const raQualificationFields = [
    "academic_qualification",
    "professional_qualification",
    "market_experience",
    "expertise",
    "markets",
  ];

  const raBankFields = [
    "bank_name",
    "account_holder",
    "account_number",
    "ifsc_code",
  ];

  const raOtherFields = ["pan_number", "address_proof_type"];

  const raDeclarations = [
    "declare_info_true",
    "consent_verification",
    "no_guaranteed_returns",
    "conflict_of_interest",
    "personal_trading",
    "sebi_compliance",
    "platform_policy",
  ];

  const raFileFields = [
    { key: "profile_image", label: "Profile Image" },
    { key: "pan_card", label: "PAN Card" },
    { key: "address_proof_document", label: "Address Proof" },
    { key: "sebi_certificate", label: "SEBI Certificate" },
    { key: "sebi_receipt", label: "SEBI Receipt" },
    { key: "nism_certificate", label: "NISM Certificate" },
    { key: "cancelled_cheque", label: "Cancelled Cheque" },
  ];

  const renderFields = (fieldList: string[]) =>
    fieldList.map((field) => (
      <Grid item xs={12} sm={6} key={field}>
        <TextField
          fullWidth
          label={field.replace(/_/g, " ").toUpperCase()}
          name={field}
          value={fields[field] ?? ""}
          onChange={handleChange}
        />
      </Grid>
    ));

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Request RA Profile Update
      </Typography>

      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg("")}>
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>

      <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg("")}>
        <Alert severity="error">{errorMsg}</Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raBasicFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Address</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raAddressFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">SEBI Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raSebiFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">NISM Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raNismFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Qualifications</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raQualificationFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Bank Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raBankFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Other Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>{renderFields(raOtherFields)}</Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Declarations</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {raDeclarations.map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={normalizeBool(fields[field])}
                        onChange={(e) =>
                          handleCheckbox(field, e.target.checked)
                        }
                      />
                    }
                    label={field.replace(/_/g, " ").toUpperCase()}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Research Analyst Disclaimer</Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={8}
              name="additional_comments"
              label="Disclaimer Text"
              value={fields.additional_comments ?? ""}
              onChange={handleChange}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Uploaded Documents</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {raFileFields.map((file) => (
                <Grid item xs={12} sm={6} key={file.key}>
                  <Button variant="outlined" component="label">
                    Upload {file.label}
                    <input
                      type="file"
                      hidden
                      name={file.key}
                      onChange={handleFileChange}
                    />
                  </Button>

                  <Button
                    variant="outlined"
                    sx={{ ml: 1 }}
                    onClick={() => openFile(data[file.key])}
                  >
                    View
                  </Button>

                  <Typography sx={{ mt: 1, fontSize: 12, color: "gray" }}>
                    {files[file.key]?.name ?? data[file.key] ?? ""}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: "flex", justifyContent: "space-between" }}>
            <Typography>Status: Request will be sent to Admin</Typography>
            <Button variant="contained" onClick={handleSave}>
              Send Request
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RAProfileEditRequest;