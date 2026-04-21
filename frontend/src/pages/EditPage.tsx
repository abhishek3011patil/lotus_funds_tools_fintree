import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Checkbox, FormControlLabel } from "@mui/material";
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

const EditPage = () => {
  const { id, type } = useParams();
  const [data, setData] = useState<Registration | null>(null);
  const [fields, setFields] = useState<any>({});
  const [files, setFiles] = useState<any>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const normalizeBool = (val: any) =>
    val === true || val === "true" || val === 1 || val === "1";

  // ---------------- FETCH ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        let url = "";

        if (type?.toUpperCase() === "RA") {
          url = `${import.meta.env.VITE_API_URL}/api/registration/ra/${id}`;
        } else {
          url = `${import.meta.env.VITE_API_URL}/api/registration/broker/${id}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();

        let payload =
          type?.toUpperCase() === "RA"
            ? result.data || result
            : result.broker || result.data || result;

        setData(payload);
        setFields(payload || {});
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load data");
      }
    };

    fetchData();
  }, [id, type]);

  const handleSave = async () => {
  const formData = new FormData();

  // ✅ FIELD MAPPING
  const fieldMapping: any = {
    address_line1: "address1",
    address_line2: "address2",
    pan_number: "panNumber", // 🔥 VERY IMPORTANT
  };

  Object.keys(fields).forEach((key) => {
    if (fields[key] !== undefined && fields[key] !== null) {
      const newKey = fieldMapping[key] || key;
      formData.append(newKey, fields[key]);
    }
  });

  // ✅ FILE MAPPING
  const fileMapping: any = {
    profile_image: files.profile_image,
    sebi_certificate: files.sebi_certificate,
    sebi_receipt: files.sebi_receipt,
    nism_certificate: files.nism_certificate,
    cancelled_cheque: files.cancelled_cheque,

    // ⚠️ KEEP FILE NAME AS BACKEND EXPECTS
    pan_card: files.pan_card,
    address_proof_document: files.address_proof_document,
  };

  Object.entries(fileMapping).forEach(([key, file]) => {
    if (file instanceof File) {
      formData.append(key, file);
    }
  });

  // 🔍 DEBUG (run once)
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

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
      setErrorMsg(result.message || "Update failed");
      return;
    }

    setSuccessMsg("Updated successfully!");
  } catch (err) {
    console.error(err);
    setErrorMsg("Server error");
  }
};

  // ---------------- HANDLERS ----------------
  const handleChange = (e: any) => {
    const { name, type, value, checked } = e.target;

    setFields({
      ...fields,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const openFile = (file?: string) => {
    if (!file) return alert("File not uploaded");

    file.split(",").forEach((f) => {
      const cleanFile = f.trim();
      if (cleanFile) {
        const url = `${
          import.meta.env.VITE_API_URL
        }/uploads/${encodeURIComponent(cleanFile)}`;
        window.open(url, "_blank");
      }
    });
  };

  if (!data) return <div>Loading...</div>;

  // ---------------- FIELD LISTS ----------------
  const basicFieldsRA = [
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

  const raSeBIFields = ["sebi_reg_no", "sebi_start_date", "sebi_expiry_date"];

  const raNismFields = ["nism_reg_no", "nism_valid_till"];

  const raQualificationFields = [
    "academic_qualification",
    "professional_qualification",
    "market_experience",
    "expertise",
    "markets",
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
      label:
        "I declare that I have disclosed all actual and potential conflicts of interest.",
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

  const basicFieldsBroker = [
    "legal_name",
    "trade_name",
    "entity_type",
    "incorporation_date",
    "pan",
    "cin",
    "gstin",
    "registered_address",
    "correspondence_address",
    "email",
    "mobile",
    "website",
  ];

  const sebiFields = [
    "sebi_registration_no",
    "registration_category",
    "registration_date",
    "registration_validity",
    "membership_code",
  ];

  const exchangeFields = [
    "exchange_nse",
    "exchange_bse",
    "exchange_smi",
    "exchange_ncdex",
  ];

  const segmentFields = ["segment_cash", "segment_fo", "segment_currency"];

  const complianceFields = [
    "compliance_officer_name",
    "compliance_designation",
    "compliance_pan",
    "compliance_mobile",
    "net_worth",
    "auditor_name",
    "auditor_membership",
  ];

  const authorizedFields = [
    "authorized_person_name",
    "authorized_person_pan",
    "authorized_person_designation",
    "authorized_person_email",
    "authorized_person_aadhaar",
    "authorized_person_mobile",
  ];

  const declarationFields = [
    "no_disciplinary_action",
    "no_suspension",
    "no_criminal_case",
    "agree_sebi_circulars",
    "agree_code_of_conduct",
  ];

  const fileFieldsRA = [
    { key: "profile_image", label: "Profile Image" },
    { key: "pan_card", label: "PAN Card" },
    { key: "address_proof_document", label: "Address Proof" },
    { key: "sebi_certificate", label: "SEBI Certificate" },
    { key: "sebi_receipt", label: "SEBI Receipt" },
    { key: "nism_certificate", label: "NISM Certificate" },
    { key: "cancelled_cheque", label: "Cancelled Cheque" },
  ];

  const fileFieldsBroker = [
    { key: "sebi_certificate", label: "SEBI Certificate" },
    { key: "exchange_certificates", label: "Exchange Certificates" },
    { key: "appointment_letter", label: "Appointment Letter" },
    { key: "networth_certificate", label: "Networth Certificate" },
    { key: "financial_statements", label: "Financial Statements" },
    { key: "ca_certificate", label: "CA Certificate" },
  ];

  const formatLabel = (text: string) =>
    text.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toUpperCase();


  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
  Edit {type?.toUpperCase() === "RA" ? "Research Analyst" : "Broker"} Registration
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
    <Typography variant="h6" gutterBottom>
      Basic Information
    </Typography>
    <Divider sx={{ mb: 2 }} />

    <Grid container spacing={2}>
      {(type?.toUpperCase() === "RA"
        ? basicFieldsRA
        : basicFieldsBroker
      ).map((field) => (
        <Grid item xs={12} sm={6} key={field}>
          <TextField
            fullWidth
            label={field.replace(/_/g, " ").toUpperCase()}
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
      {(type?.toUpperCase() === "RA"
        ? ["address_line1", "address_line2", "city", "state", "country", "pincode"]
        : ["registered_address", "correspondence_address"]
      ).map((field) => (
        <Grid item xs={12} sm={6} key={field}>
          <TextField
            fullWidth
            label={field.replace(/_/g, " ").toUpperCase()}
            name={field}
            value={fields[field] || ""}
            onChange={handleChange}
          />
        </Grid>
      ))}
    </Grid>
  </Paper>
</Grid>


{/* new */}

{type?.toUpperCase() !== "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">SEBI Details</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {sebiFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() !== "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Exchange & Segments</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {[...exchangeFields, ...segmentFields].map((field) => (
          <Grid item xs={12} sm={4} key={field}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={fields[field] || false}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      [field]: e.target.checked,
                    })
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
)}

{type?.toUpperCase() !== "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Compliance & Financials</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {complianceFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() !== "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Authorized Person</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {authorizedFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() !== "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Declarations</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {declarationFields.map((field) => (
          <Grid item xs={12} sm={4} key={field}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={fields[field] || false}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      [field]: e.target.checked,
                    })
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
)}

{/* new */} 

{/* new  RA fields*/}
{type?.toUpperCase() === "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">SEBI Details</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {raSeBIFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() === "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">NISM Details</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {raNismFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() === "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Qualifications</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {raQualificationFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() === "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Other Details</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {raOtherFields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, " ").toUpperCase()}
              name={field}
              value={fields[field] || ""}
              onChange={handleChange}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Grid>
)}

{type?.toUpperCase() === "RA" && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Declarations</Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
       {raDeclarations.map((item) => (
  <Grid item xs={12} sm={6} key={item.name}>
    <FormControlLabel
      control={
        <Checkbox
          name={item.name}
          checked={normalizeBool(fields[item.name])}
          onChange={handleChange}
        />
      }
      label={item.label}
    />
  </Grid>
))}
      </Grid>
    </Paper>
  </Grid>
)}

{/*end*/}

        {/* Files */}
        <Grid item xs={12}>
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Uploaded Documents
    </Typography>
    <Divider sx={{ mb: 2 }} />

    <Grid container spacing={2}>
      {(type?.toUpperCase() === "RA"
        ? fileFieldsRA
        : fileFieldsBroker
      ).map((file) => (
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

export default EditPage;