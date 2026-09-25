import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

// Icons for Sidebar Navigation
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

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

const EMAIL_FIELDS = new Set(["email", "authorized_person_email"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" && EMAIL_PATTERN.test(value.trim());

// ─── Component ────────────────────────────────────────────────────────────────
const EditPage = () => {
  const { id, type } = useParams();
  const [data, setData] = useState<Registration | null>(null);
  const [fields, setFields] = useState<Registration>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const [activeTab, setActiveTab] = useState("basic-info");
  const [associatedRAs, setAssociatedRAs] = useState<any[]>([]);

  const isRA = type?.toUpperCase() === "RA";

  // Normalise any truthy representation coming from DB
  const normalizeBool = (val: any): boolean =>
    val === true || val === "true" || val === 1 || val === "1";

  // ── Fetch Main Data & Associated RAs ─────────────────────────────────────
const fetchData = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const url = isRA
      ? `${import.meta.env.VITE_API_URL}/api/registration/ra/${id}`
      : `${import.meta.env.VITE_API_URL}/api/registration/broker/${id}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch profile");

    const result = await res.json();
    const payload = isRA
      ? result.data ?? result
      : result.broker ?? result.data ?? result;

    setData(payload);
    setFields(payload ?? {});

    // Fetch Associated RAs for Brokers using the exact endpoint
    if (!isRA) {
      try {
        const raRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/broker/${id}/ras`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (raRes.ok) {
          const raData = await raRes.json();
          const extracted = Array.isArray(raData)
            ? raData
            : raData.data || raData.ras || [];
          setAssociatedRAs(extracted);
        } else {
          setAssociatedRAs([]);
        }
      } catch (e) {
        console.error("Failed loading associated RAs:", e);
        setAssociatedRAs([]);
      }
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    setErrorMsg("Failed to load profile data");
  }
};

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  // ── Scroll to section ─────────────────────────────────────────────────────
  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 20;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // ── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const emailErrors: Record<string, string> = {};

    if (!isValidEmail(fields.email)) {
      emailErrors.email = "Enter a valid email address.";
    }

    if (
      !isRA &&
      fields.authorized_person_email &&
      !isValidEmail(fields.authorized_person_email)
    ) {
      emailErrors.authorized_person_email =
        "Enter a valid authorized person email address.";
    }

    if (Object.keys(emailErrors).length > 0) {
      setServerErrors((prev) => ({ ...prev, ...emailErrors }));
      setSuccessMsg("");
      setErrorMsg("Please correct the invalid email address.");
      return;
    }

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

      const url = isRA
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
          setSuccessMsg("");
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
    setServerErrors((prev) => ({ ...prev, [name]: "" }));
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

  const openFile = async (file?: string) => {
    if (!file) {
      alert("File not uploaded");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to view this file.");
      return;
    }

    const filesToOpen = file.split(",");

    for (const f of filesToOpen) {
      const clean = f.trim();
      if (!clean) continue;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/uploads/${encodeURIComponent(clean)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          alert("You are not authorized to view this file.");
          continue;
        }

        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        window.open(fileUrl, "_blank");
      } catch (error) {
        console.error("Error opening file:", error);
        alert("Unable to open file.");
      }
    }
  };

  if (!data) return <Box sx={{ p: 4 }}>Loading profile...</Box>;

  // ── Field Configurations ───────────────────────────────────────────────────
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
  const raBankFields = ["bank_name", "account_holder", "account_number", "ifsc_code"];
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

  const DATE_FIELDS = [
    "sebi_start_date",
    "sebi_expiry_date",
    "nism_valid_till",
    "incorporation_date",
    "registration_date",
    "registration_validity",
  ];

  // ── Navigation Items List for Sidebar ─────────────────────────────────────
  const navItems = isRA
    ? [
        { id: "basic-info", label: "Basic Info", icon: <PersonOutlineIcon /> },
        { id: "address-info", label: "Address", icon: <HomeOutlinedIcon /> },
        { id: "sebi-info", label: "SEBI & NISM", icon: <VerifiedUserOutlinedIcon /> },
        { id: "qualifications", label: "Qualifications", icon: <SchoolOutlinedIcon /> },
        { id: "bank-info", label: "Bank & Other", icon: <AccountBalanceOutlinedIcon /> },
        { id: "declarations", label: "Declarations", icon: <GavelOutlinedIcon /> },
        { id: "documents", label: "Documents", icon: <FolderSharedOutlinedIcon /> },
      ]
    : [
        { id: "basic-info", label: "Basic Info", icon: <PersonOutlineIcon /> },
        { id: "address-info", label: "Address", icon: <HomeOutlinedIcon /> },
        { id: "sebi-info", label: "SEBI & Exchanges", icon: <VerifiedUserOutlinedIcon /> },
        { id: "compliance-info", label: "Compliance & Auth", icon: <DescriptionOutlinedIcon /> },
        { id: "declarations", label: "Declarations", icon: <GavelOutlinedIcon /> },
        { id: "documents", label: "Uploaded Documents", icon: <FolderSharedOutlinedIcon /> },
        { id: "associated-ras", label: `Associated RAs (${associatedRAs.length})`, icon: <GroupOutlinedIcon /> },
      ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
          Edit {isRA ? "Research Analyst" : "Broker"} Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage registration information, compliance declarations, and verified credentials.
        </Typography>
      </Box>

      {/* Snackbar Notifications */}
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

      {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ── */}
      <Grid container spacing={4}>
        
        {/* Left Sidebar Navigation Menu */}
        <Grid item xs={12} md={3.5} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              position: { md: "sticky" },
              top: 24,
            }}
          >
            <List component="nav" disablePadding>
              {navItems.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <ListItemButton
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    sx={{
                      borderRadius: "10px",
                      mb: 0.5,
                      py: 1.2,
                      px: 2,
                      bgcolor: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#2563eb" : "#475569",
                      "&:hover": {
                        bgcolor: isSelected ? "#eff6ff" : "#f8fafc",
                        color: isSelected ? "#2563eb" : "#0f172a",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isSelected ? "#2563eb" : "#64748b",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Right Form Content Pane */}
        <Grid item xs={12} md={8.5} lg={9}>
          <Grid container spacing={3}>
            
            {/* ── BASIC INFORMATION ── */}
            <Grid item xs={12} id="basic-info">
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {(isRA ? raBasicFields : brokerBasicFields).map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        fullWidth
                        type={
                          DATE_FIELDS.includes(field)
                            ? "date"
                            : EMAIL_FIELDS.has(field)
                            ? "email"
                            : "text"
                        }
                        label={field.replace(/_/g, " ").toUpperCase()}
                        name={field}
                        value={fields[field] ?? ""}
                        onChange={handleChange}
                        error={!!serverErrors[field]}
                        helperText={serverErrors[field] || ""}
                        slotProps={{
                          inputLabel: {
                            shrink: DATE_FIELDS.includes(field) ? true : undefined,
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* ── ADDRESS INFORMATION ── */}
            <Grid item xs={12} id="address-info">
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Address
                </Typography>
                <Divider sx={{ mb: 3 }} />
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

            {/* ── SEBI & EXCHANGES / NISM ── */}
            <Grid item xs={12} id="sebi-info">
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  SEBI {isRA ? "& NISM Details" : "Registration Details"}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {(isRA ? raSebiFields : brokerSebiFields).map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        fullWidth
                        type={DATE_FIELDS.includes(field) ? "date" : "text"}
                        label={field.replace(/_/g, " ").toUpperCase()}
                        name={field}
                        value={fields[field] ?? ""}
                        onChange={handleChange}
                        error={!!serverErrors[field]}
                        helperText={serverErrors[field] || ""}
                        slotProps={{
                          inputLabel: {
                            shrink: DATE_FIELDS.includes(field) ? true : undefined,
                          },
                        }}
                      />
                    </Grid>
                  ))}

                  {/* NISM Details (RA Only) */}
                  {isRA &&
                    raNismFields.map((field) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <TextField
                          fullWidth
                          type={DATE_FIELDS.includes(field) ? "date" : "text"}
                          label={field.replace(/_/g, " ").toUpperCase()}
                          name={field}
                          value={fields[field] ?? ""}
                          onChange={handleChange}
                          error={!!serverErrors[field]}
                          helperText={serverErrors[field] || ""}
                          slotProps={{
                            inputLabel: {
                              shrink: DATE_FIELDS.includes(field) ? true : undefined,
                            },
                          }}
                        />
                      </Grid>
                    ))}
                </Grid>

                {/* Exchange & Segments Checkboxes (Broker Only) */}
                {!isRA && (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                      Exchanges & Segments
                    </Typography>
                    <Grid container spacing={1}>
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
                  </>
                )}
              </Paper>
            </Grid>

            {/* ── QUALIFICATIONS (RA Only) ── */}
            {isRA && (
              <Grid item xs={12} id="qualifications">
                <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Qualifications
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
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

            {/* ── COMPLIANCE & AUTHORIZED PERSON (Broker Only) ── */}
            {!isRA && (
              <Grid item xs={12} id="compliance-info">
                <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Compliance Officers & Financials
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
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

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 4 }} gutterBottom>
                    Authorized Person Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    {brokerAuthorizedFields.map((field) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <TextField
                          fullWidth
                          type={EMAIL_FIELDS.has(field) ? "email" : "text"}
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

            {/* ── BANK DETAILS (RA Only) ── */}
            {isRA && (
              <Grid item xs={12} id="bank-info">
                <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Bank Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
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

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 4 }} gutterBottom>
                    Other Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
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

            {/* ── DECLARATIONS ── */}
            <Grid item xs={12} id="declarations">
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Declarations & Terms
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {isRA
                    ? raDeclarations.map((item) => (
                        <Grid item xs={12} key={item.name}>
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
                        <Grid item xs={12} sm={6} key={field}>
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

                {/* Disclaimer Textbox (RA only) */}
                {isRA && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Research Analyst Disclaimer
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      name="additional_comments"
                      value={fields.additional_comments ?? ""}
                      onChange={handleChange}
                      placeholder="Enter Research Analyst Disclaimer Text..."
                    />
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* ── UPLOADED DOCUMENTS ── */}
            <Grid item xs={12} id="documents">
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Uploaded Documents
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {(isRA ? raFileFields : brokerFileFields).map((file) => (
                    <Grid item xs={12} sm={6} key={file.key}>
                      <Box
                        sx={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          p: 2,
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ textTransform: "none", borderRadius: "8px" }}
                          >
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
                            onClick={() => openFile(data[file.key])}
                            sx={{ textTransform: "none", borderRadius: "8px" }}
                          >
                            View
                          </Button>
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", wordBreak: "break-all" }}
                        >
                          {files[file.key]?.name ?? data[file.key] ?? "No file uploaded"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* ── ASSOCIATED RESEARCH ANALYSTS (Broker Only) ── */}
            {!isRA && (
              <Grid item xs={12} id="associated-ras">
                <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }} elevation={0}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Associated Research Analysts
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  {associatedRAs.length === 0 ? (
                    <Typography color="text.secondary">
                      No Research Analysts connected with this broker.
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          textAlign: "left",
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                            <th style={{ padding: "12px 8px" }}>Name</th>
                            <th style={{ padding: "12px 8px" }}>Email</th>
                            <th style={{ padding: "12px 8px" }}>SEBI Reg No</th>
                            <th style={{ padding: "12px 8px" }}>Mobile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {associatedRAs.map((ra: any, idx: number) => {
                            const name =
                              ra.full_name ||
                              ra.name ||
                              `${ra.first_name || ""} ${ra.surname || ""}`.trim() ||
                              ra.org_name ||
                              "N/A";

                            return (
                              <tr
                                key={ra.id || idx}
                                style={{ borderBottom: "1px solid #f1f5f9" }}
                              >
                                <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                                  {name}
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  {ra.email || "N/A"}
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  {ra.sebi_reg_no || ra.sebi_registration_no || ra.sebi_number || "N/A"}
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  {ra.mobile || ra.phone || "N/A"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}

            {/* ── SAVE BUTTON ── */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: "10px",
                    fontWeight: 700,
                    textTransform: "none",
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditPage;