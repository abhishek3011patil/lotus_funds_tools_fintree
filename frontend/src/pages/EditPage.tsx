import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Checkbox, FormControlLabel } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

// ─── Types ────────────────────────────────────────────────────────────────────
type Registration = {
  [key: string]: any;
};

// ─── Boolean fields that must be serialised as "true"/"false" in FormData ────
const BOOLEAN_FIELDS = new Set([
  // RA declarations
  "declare_info_true",
  "consent_verification",
  "no_guaranteed_returns",
  "conflict_of_interest",
  "personal_trading",
  "sebi_compliance",
  "platform_policy",
  // Broker exchanges & segments
  "exchange_nse",
  "exchange_bse",
  "exchange_smi",
  "exchange_ncdex",
  "segment_cash",
  "segment_fo",
  "segment_currency",
  // Broker declarations
  "no_disciplinary_action",
  "no_suspension",
  "no_criminal_case",
  "agree_sebi_circulars",
  "agree_code_of_conduct",
]);

// ─── Component ────────────────────────────────────────────────────────────────
const EditPage = () => {
  const { id, type } = useParams();
  const [data, setData] = useState<Registration | null>(null);
  const [fields, setFields] = useState<Registration>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  // Normalise any truthy representation coming from the DB / FormData round-trip
  const normalizeBool = (val: any): boolean =>
    val === true || val === "true" || val === 1 || val === "1";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const url =
        type?.toUpperCase() === "RA"
          ? `${import.meta.env.VITE_API_URL}/api/registration/ra/${id}`
          : `${import.meta.env.VITE_API_URL}/api/registration/broker/${id}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();

      const payload =
        type?.toUpperCase() === "RA"
          ? result.data ?? result
          : result.broker ?? result.data ?? result;

      setData(payload);
      setFields(payload ?? {});
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const formData = new FormData();

    // Append all scalar fields; booleans serialised to "true"/"false"
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

    // All file fields across both RA and Broker
    const fileKeys = [
      // RA
      "profile_image",
      "pan_card",
      "address_proof_document",
      "sebi_certificate",
      "sebi_receipt",
      "nism_certificate",
      "cancelled_cheque",
      // Broker
      "exchange_certificates",
      "appointment_letter",
      "networth_certificate",
      "financial_statements",
      "ca_certificate",
    ] as const;

    fileKeys.forEach((key) => {
      if (files[key] instanceof File) {
        formData.append(key, files[key]);
      }
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMsg("No token found");
        return;
      }

      const url =
        type?.toUpperCase() === "RA"
          ? `${import.meta.env.VITE_API_URL}/api/registration/edit/ra/${id}`
          : `${import.meta.env.VITE_API_URL}/api/registration/edit/broker/${id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();

 if (!res.ok) {
  if (res.status === 409 && result.field) {
    setServerErrors((prev) => ({
      ...prev,
      [result.field]: result.message,
    }));

    setSuccessMsg("");      // Clear any previous success message
    setErrorMsg(result.message);

    return;
  }

  setSuccessMsg("");
  setErrorMsg(result.message || "Update failed");
  return;
}
      setSuccessMsg("Updated successfully!");
      setServerErrors({});
setErrorMsg("");
      // Re-fetch so View buttons and displayed filenames are current
      await fetchData();
      setFiles({});
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error");
    }
  };

  // ── Field handlers ─────────────────────────────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type: inputType, value, checked } = target;
    setFields((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));
    setServerErrors((prev) => ({
  ...prev,
  [name]: "",
}));
  };

 const handleCheckbox = (name: string, checked: boolean) => {
  setFields((prev) => ({ ...prev, [name]: checked }));
  setServerErrors((prev) => ({ ...prev, [name]: "" }));
};

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [e.target.name]: e.target.files![0] }));
    }
  };

  const openFile = (file?: string) => {
    if (!file) return alert("File not uploaded");
    file.split(",").forEach((f) => {
      const clean = f.trim();
      if (clean) {
        window.open(
          `${import.meta.env.VITE_API_URL}/uploads/${encodeURIComponent(clean)}`,
          "_blank"
        );
      }
    });
  };

  if (!data) return <div>Loading...</div>;

  // ── Field lists (must mirror DB columns & controller allowedFields) ─────────

  // RA -----------------------------------------------------------------------
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

  // Bank details — present in DB schema & controller allowedFields
  const raBankFields = [
    "bank_name",
    "account_holder",
    "account_number",
    "ifsc_code",
  ];

  const raOtherFields = ["pan_number", "address_proof_type"];

  const raDeclarations = [
    {
      name: "declare_info_true",
      label:
        "I hereby declare that all information and documents provided by me are true, complete, and accurate to the best of my knowledge.",
    },
    {
      name: "consent_verification",
      label:
        "I consent to the verification of the above details and documents by the platform or its authorized representatives.",
    },
    {
      name: "no_guaranteed_returns",
      label:
        "I confirm that I do not offer, promise, or guarantee any assured or fixed returns on investments, directly or indirectly.",
    },
    {
      name: "conflict_of_interest",
      label: "I declare that I have disclosed all actual and potential conflicts of interest.",
    },
    {
      name: "personal_trading",
      label: "I confirm that I have disclosed my personal trading positions.",
    },
    {
      name: "sebi_compliance",
      label: "I agree to comply with all SEBI (Research Analysts) Regulations.",
    },
    {
      name: "platform_policy",
      label: "I have read and agree to Platform Content Policy and Terms of Use.",
    },
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

  // Broker -------------------------------------------------------------------
  const brokerBasicFields = [
    "legal_name",
    "trade_name",
    "entity_type",
    "incorporation_date",
    "pan",
    "cin",
    "gstin",
    "email",
    "mobile",
    "website",
  ];

  // Broker address lives in its own fields (not duplicated in basicFields)
  const brokerAddressFields = ["registered_address", "correspondence_address"];

  const brokerSebiFields = [
    "sebi_registration_no",
    "registration_category",
    "registration_date",
    "registration_validity",
    "membership_code",
  ];

  const brokerExchangeFields = [
    "exchange_nse",
    "exchange_bse",
    "exchange_smi",
    "exchange_ncdex",
  ];

  const brokerSegmentFields = ["segment_cash", "segment_fo", "segment_currency"];

  const brokerComplianceFields = [
    "compliance_officer_name",
    "compliance_designation",
    "compliance_pan",
    "compliance_mobile",
    "net_worth",
    "auditor_name",
    "auditor_membership",
  ];

  const brokerAuthorizedFields = [
    "authorized_person_name",
    "authorized_person_pan",
    "authorized_person_designation",
    "authorized_person_email",
    "authorized_person_aadhaar",
    "authorized_person_mobile",
  ];

  const brokerDeclarationFields = [
    "no_disciplinary_action",
    "no_suspension",
    "no_criminal_case",
    "agree_sebi_circulars",
    "agree_code_of_conduct",
  ];

  const brokerFileFields = [
    { key: "sebi_certificate", label: "SEBI Certificate" },
    { key: "exchange_certificates", label: "Exchange Certificates" },
    { key: "appointment_letter", label: "Appointment Letter" },
    { key: "networth_certificate", label: "Networth Certificate" },
    { key: "financial_statements", label: "Financial Statements" },
    { key: "ca_certificate", label: "CA Certificate" },
  ];

  const isRA = type?.toUpperCase() === "RA";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Edit {isRA ? "Research Analyst" : "Broker"} Registration
      </Typography>

      {/* Success Snackbar */}
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

      {/* Error Snackbar */}
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

        {/* ── BASIC INFORMATION ─────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {(isRA ? raBasicFields : brokerBasicFields).map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace(/_/g, " ").toUpperCase()}
                    name={field}
                    value={fields[field] ?? ""}
                    onChange={handleChange}
                    error={!!serverErrors[field]}
  helperText={serverErrors[field] || ""}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* ── ADDRESS ───────────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Address</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {(isRA ? raAddressFields : brokerAddressFields).map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace(/_/g, " ").toUpperCase()}
                    name={field}
                    value={fields[field] ?? ""}
                    onChange={handleChange}
                    error={!!serverErrors[field]}
                    helperText={serverErrors[field] || ""}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* ── SEBI DETAILS ──────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>SEBI Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {(isRA ? raSebiFields : brokerSebiFields).map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace(/_/g, " ").toUpperCase()}
                    name={field}
                    value={fields[field] ?? ""}
                    onChange={handleChange}
                    error={!!serverErrors[field]}
                    helperText={serverErrors[field] || ""}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* ── NISM DETAILS (RA only) ─────────────────────────────────────── */}
        {isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>NISM Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {raNismFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                      error={!!serverErrors[field]}
                      helperText={serverErrors[field] || ""}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── QUALIFICATIONS (RA only) ───────────────────────────────────── */}
        {isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Qualifications</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {raQualificationFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                  error={!!serverErrors[field]}
  helperText={serverErrors[field] || ""}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── BANK DETAILS (RA only) — mapped to allowedFields in controller ─ */}
        {isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Bank Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {raBankFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                      error={!!serverErrors[field]}
                      helperText={serverErrors[field] || ""}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── OTHER DETAILS (RA only) ────────────────────────────────────── */}
        {isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Other Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {raOtherFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                        error={!!serverErrors[field]}
  helperText={serverErrors[field] || ""}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── EXCHANGE & SEGMENTS (Broker only) ─────────────────────────── */}
        {!isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Exchange &amp; Segments</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[...brokerExchangeFields, ...brokerSegmentFields].map((field) => (
                  <Grid item xs={12} sm={4} key={field}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={normalizeBool(fields[field])}
                          onChange={(e) => handleCheckbox(field, e.target.checked)}
                        />
                      }
                      label={field.replace(/_/g, " ").toUpperCase()}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── COMPLIANCE & FINANCIALS (Broker only) ─────────────────────── */}
        {!isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Compliance &amp; Financials</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {brokerComplianceFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                      error={!!serverErrors[field]}
  helperText={serverErrors[field] || ""}  
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── AUTHORIZED PERSON (Broker only) ───────────────────────────── */}
        {!isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Authorized Person</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {brokerAuthorizedFields.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.replace(/_/g, " ").toUpperCase()}
                      name={field}
                      value={fields[field] ?? ""}
                      onChange={handleChange}
                      error={!!serverErrors[field]}
  helperText={serverErrors[field] || ""}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── DECLARATIONS ──────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Declarations</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {isRA
                ? raDeclarations.map((item) => (
                    <Grid item xs={12} sm={6} key={item.name}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name={item.name}
                            checked={normalizeBool(fields[item.name])}
                            onChange={(e) => handleCheckbox(item.name, e.target.checked)}
                          />
                        }
                        label={item.label}
                      />
                    </Grid>
                  ))
                : brokerDeclarationFields.map((field) => (
                    <Grid item xs={12} sm={4} key={field}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={normalizeBool(fields[field])}
                            onChange={(e) => handleCheckbox(field, e.target.checked)}
                          />
                        }
                        label={field.replace(/_/g, " ").toUpperCase()}
                      />
                    </Grid>
                  ))}
            </Grid>
          </Paper>
        </Grid>

        {/* ── RA DISCLAIMER (RA only) ────────────────────────────────────── */}
        {isRA && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Research Analyst Disclaimer</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    name="additional_comments"
                    label="Disclaimer Text"
                    value={fields.additional_comments ?? ""}
                    onChange={handleChange}
                    placeholder="Enter Research Analyst Disclaimer"
                  
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* ── UPLOADED DOCUMENTS ────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {(isRA ? raFileFields : brokerFileFields).map((file) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={file.key}
                  sx={{ display: "flex", alignItems: "center" }}
                >
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

                  <Typography sx={{ ml: 2, fontSize: 12, color: "gray" }}>
                    {files[file.key]?.name ?? data[file.key] ?? ""}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* ── STATUS & SAVE ─────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default EditPage;
