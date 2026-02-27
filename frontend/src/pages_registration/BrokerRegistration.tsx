import React, { useRef, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  MenuItem,
  Select,
  Checkbox,
  FormControlLabel,
  Paper,
  Container,
  InputAdornment,
  Divider,
  Stack,
  Radio,
  RadioGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { StepIconProps } from "@mui/material/StepIcon";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

// ─────────────────────────────────────────────
// Qonto-style Stepper connector & icon
// ─────────────────────────────────────────────
const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: "calc(-50% + 16px)", right: "calc(50% + 16px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#2563EB" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#2563EB" } },
  [`& .${stepConnectorClasses.line}`]: { borderColor: "#E2E8F0", borderTopWidth: 3, borderRadius: 1 },
}));

const QontoStepIconRoot = styled("div")<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ ownerState }) => ({
    color: "#E2E8F0",
    display: "flex",
    height: 22,
    alignItems: "center",
    ...(ownerState.active && { color: "#2563EB" }),
    "& .QontoStepIcon-completedIcon": { color: "#2563EB", zIndex: 1, fontSize: 22 },
    "& .QontoStepIcon-circle": {
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "currentColor",
    },
  })
);

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;
  return (
    <QontoStepIconRoot ownerState={{ active, completed }} className={className}>
      {completed ? (
        <CheckCircleIcon className="QontoStepIcon-completedIcon" />
      ) : (
        <div className="QontoStepIcon-circle" />
      )}
    </QontoStepIconRoot>
  );
}

const steps = [
  "Basic Details",
  "SEBI & Exchange",
  "Compliance & Financials",
  "Authorized Person",
  "Review & Declare",
];

// ─────────────────────────────────────────────
// Shared sx helpers
// ─────────────────────────────────────────────
const inputSx = {
  "& .MuiInputBase-root": { height: 40, fontSize: "0.85rem", bgcolor: "#F8FAFC", borderRadius: "6px" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
  "& .MuiInputBase-input::placeholder": { color: "#94A3B8", opacity: 1 },
};

const inputSxErr = {
  "& .MuiInputBase-root": { height: 40, fontSize: "0.85rem", bgcolor: "#FFF5F5", borderRadius: "6px" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#EF4444" },
  "& .MuiInputBase-input::placeholder": { color: "#94A3B8", opacity: 1 },
};

const label = (text: string, required = false) => (
  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.8, display: "block", color: "#334155" }}>
    {text} {required && <span style={{ color: "#EF4444" }}>*</span>}
  </Typography>
);

const errMsg = (msg = "This field is required") => (
  <Box sx={{ height: "20px", mt: 0.5 }}> 
    <Typography variant="caption" sx={{ color: "#EF4444", fontSize: "0.72rem", display: 'block' }}>
      {msg}
    </Typography>
  </Box>
);

// ─────────────────────────────────────────────
// FileUploadBox
// ─────────────────────────────────────────────
const FileUploadBox = ({
  fieldLabel,
  file,
  onChange,
  error,
}: {
  fieldLabel: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Box sx={{ width: "100%" }}>
      {label(fieldLabel)}
      <Box
        onClick={() => ref.current?.click()}
        sx={{
          border: `1px dashed ${error ? "#EF4444" : "#CBD5E1"}`,
          borderRadius: "8px",
          px: 2,
          py: 1.5,
          bgcolor: error ? "#FFF5F5" : "#F8FAFC",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 2,
          "&:hover": { borderColor: "#2563EB", bgcolor: "#F0F6FF" },
        }}
      >
        <input type="file" hidden ref={ref} onChange={(e) => onChange(e.target.files?.[0] || null)} />
        <Box sx={{ width: 34, height: 34, borderRadius: "6px", bgcolor: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CloudUploadIcon sx={{ fontSize: 18, color: "#475569" }} />
        </Box>
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {file ? file.name : "Drag & drop or click to browse"}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#94A3B8" }}>PDF • Max 5 MB</Typography>
        </Box>
      </Box>
      {error && errMsg("Please upload a file")}
    </Box>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const BrokerRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Step 1 starts here - state
  const [s1, setS1] = useState({
    legalName: "", tradeName: "", entityType: "", incDay: "", incMonthYear: "",
    pan: "", cin: "", gstin: "",
    registeredAddress: "", correspondenceAddress: "", sameAsRegistered: true,
    email: "", mobile: "", website: "",
  });
  const [s1Err, setS1Err] = useState<Record<string, boolean>>({});

  // Step 2 starts here - state
  const [s2, setS2] = useState({
    sebiRegNo: "", regCategory: "", regDate: "", regValidity: "",
    exchangeNSE: false, exchangeBSE: false, exchangeSMI: false, exchangeNCDEX: false,
    membershipCode: "", segCash: false, segFO: false, segCurrency: false,
  });
  const [sebiCertFile, setSebiCertFile] = useState<File | null>(null);
  const [s2Err, setS2Err] = useState<Record<string, boolean>>({});
  // --- STATE ---
const [exchangeCertFiles, setExchangeCertFiles] = useState<File[]>([]);

const handleFileUpload = (data: any) => {
  // Logic to handle both standard input events and direct file arrays
  const incomingFiles = data?.target?.files ? data.target.files : data;
  
  if (incomingFiles) {
    const filesArray = Array.from(incomingFiles) as File[];
    setExchangeCertFiles((prev) => [...prev, ...filesArray]);
    
    // Clear error
    if (s2Err.exchangeCertFiles) {
      setS2Err((prev) => ({ ...prev, exchangeCertFiles: false }));
    }
  }
};

const handleRemoveFile = (indexToRemove: number) => {
  setExchangeCertFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
};

const FileUploadBox = ({
  fieldLabel,
  files,
  onChange,
  error,
  multiple = false,
}: {
  fieldLabel: string;
  files: File | File[] | null;
  onChange: (f: any) => void;
  error?: boolean;
  multiple?: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  
  const getDisplayName = () => {
    if (!files) return "Drag & drop or click to browse";
    if (Array.isArray(files)) {
      return files.length > 0 ? `${files.length} files selected` : "Drag & drop or click to browse";
    }
    // @ts-ignore
    return files.name;
  };

  return (
    <Box sx={{ width: "100%" }}>
      {label(fieldLabel)}
      <Box
        onClick={() => ref.current?.click()}
        sx={{
          border: `1px dashed ${error ? "#EF4444" : "#CBD5E1"}`,
          borderRadius: "8px", px: 2, py: 1.5,
          bgcolor: error ? "#FFF5F5" : "#F8FAFC",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
          "&:hover": { borderColor: "#2563EB", bgcolor: "#F0F6FF" },
        }}
      >
        <input 
          type="file" 
          hidden 
          ref={ref} 
          multiple={multiple} 
          onChange={(e) => onChange(e.target.files)} 
        />
        <Box sx={{ width: 34, height: 34, borderRadius: "6px", bgcolor: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CloudUploadIcon sx={{ fontSize: 18, color: "#475569" }} />
        </Box>
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block" }}>
            {getDisplayName()}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#94A3B8" }}>PDF • Max 5 MB</Typography>
        </Box>
      </Box>
    </Box>
  );
};

  // Step 3 starts here - state
  const [s3, setS3] = useState({
    coName: "", coDesignation: "", coPan: "", coMobile: "",
    netWorth: "", auditorName: "", auditorMembership: "",
  });
  const [appointmentFile, setAppointmentFile] = useState<File | null>(null);
  const [networthFile, setNetworthFile] = useState<File | null>(null);
  const [financialFile, setFinancialFile] = useState<File | null>(null);
  const [caFile, setCaFile] = useState<File | null>(null);
  const [s3Err, setS3Err] = useState<Record<string, boolean>>({});

  // Step 4 starts here - state
const [s4, setS4] = useState({
  fullName: "", 
  pan: "", 
  designation: "", 
  email: "", 
  aadhaar: "", 
  mobile: "",
  // Keep these as hidden defaults so the backend doesn't crash
  role: "Super Admin",
  segments: { equity: true, fno: true, currency: true, commodity: true },
  permissions: { createCall: true, modifyCall: true, uploadResearch: true, viewReports: true },
});

// Since the upload UI is removed, you can likely remove this too:
// const [authFile, setAuthFile] = useState<File | null>(null); 

const [s4Err, setS4Err] = useState<Record<string, boolean>>({});

  // Step 5 starts here - state
  const [declarations, setDeclarations] = useState({
    noDisciplinary: false, noSuspension: false, noCriminal: false,
    agreeCirculars: false, agreeConduct: false,
  });
  const [s5Err, setS5Err] = useState<Record<string, boolean>>({});

  // ────────────────────────────────────────────
  // Validation per step
  // ────────────────────────────────────────────
  const validateStep1 = () => {
    const errs: Record<string, boolean> = {};
    if (!s1.legalName.trim()) errs.legalName = true;
    if (!s1.entityType) errs.entityType = true;
    if (!s1.pan.trim()) errs.pan = true;
    if (!s1.registeredAddress.trim()) errs.registeredAddress = true;
    if (!s1.sameAsRegistered && !s1.correspondenceAddress.trim()) errs.correspondenceAddress = true;
    if (!s1.email.trim()) errs.email = true;
    if (!s1.mobile.trim()) errs.mobile = true;
    setS1Err(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, boolean> = {};
    if (!s2.sebiRegNo.trim()) errs.sebiRegNo = true;
    if (!s2.regCategory) errs.regCategory = true;
    if (!s2.regDate) errs.regDate = true;
    if (!sebiCertFile) errs.sebiCertFile = true;
    if (!s2.exchangeNSE && !s2.exchangeBSE && !s2.exchangeSMI && !s2.exchangeNCDEX) errs.exchange = true;
    if (exchangeCertFiles.length === 0) errs.exchangeCertFiles = true;
    setS2Err(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, boolean> = {};
    if (!s3.coName.trim()) errs.coName = true;
    if (!s3.coDesignation) errs.coDesignation = true;
    if (!s3.coPan.trim()) errs.coPan = true;
    if (!s3.coMobile.trim()) errs.coMobile = true;
    if (!appointmentFile) errs.appointmentFile = true;
    if (!s3.netWorth.trim()) errs.netWorth = true;
    if (!s3.auditorName.trim()) errs.auditorName = true;
    setS3Err(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs: Record<string, boolean> = {};
    if (!s4.fullName.trim()) errs.fullName = true;
    if (!s4.email.trim()) errs.email = true;
    if (!s4.mobile.trim()) errs.mobile = true;
    if (!s4.aadhaar.trim()) errs.aadhaar = true;
    setS4Err(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep5 = () => {
    const errs: Record<string, boolean> = {};
    (Object.keys(declarations) as Array<keyof typeof declarations>).forEach((k) => {
      if (!declarations[k]) errs[k] = true;
    });
    setS5Err(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    const validators = [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5];
    if (validators[activeStep]()) {
      if (activeStep < 4) { setActiveStep((s) => s + 1); window.scrollTo(0, 0); }
      else { alert("Application Submitted Successfully!"); }
    }
  };

  const handleBack = () => { if (activeStep > 0) { setActiveStep((s) => s - 1); window.scrollTo(0, 0); } };

  // Checkbox toggle for s1 same-address
  const handleSameAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setS1({ ...s1, sameAsRegistered: checked, correspondenceAddress: checked ? s1.registeredAddress : "" });
  };

  // ────────────────────────────────────────────
  // RENDER STEPS
  // ────────────────────────────────────────────

  // Step 1 starts here - UI
  const renderStep1 = () => (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: "#1E293B" }}>Basic Details</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          {label("Legal Name of Entity", true)}
          <TextField fullWidth sx={s1Err.legalName ? inputSxErr : inputSx}
            value={s1.legalName} onChange={(e) => setS1({ ...s1, legalName: e.target.value })} />
          {s1Err.legalName && errMsg()}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {label("Trade Name (if any)")}
          <TextField fullWidth sx={inputSx} value={s1.tradeName} onChange={(e) => setS1({ ...s1, tradeName: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {label("Type of Entity", true)}
          <Select fullWidth displayEmpty value={s1.entityType} onChange={(e) => setS1({ ...s1, entityType: e.target.value })}
            sx={{ ...(s1Err.entityType ? inputSxErr : inputSx), height: 40, fontSize: "0.85rem" }}>
            <MenuItem value="" disabled><span style={{ color: "#94A3B8" }}>Select Entity Type</span></MenuItem>
            <MenuItem value="A">A</MenuItem>
            <MenuItem value="B">B</MenuItem>
            <MenuItem value="C">C</MenuItem>
            <MenuItem value="D">D</MenuItem>
            <MenuItem value="C">C</MenuItem>
          </Select>
          {s1Err.entityType && errMsg()}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {label("Date of Incorporation")}
          <TextField fullWidth type="date" sx={inputSx} value={s1.incDay}
            onChange={(e) => setS1({ ...s1, incDay: e.target.value })}
            InputProps={{ endAdornment: <InputAdornment position="end"><CalendarMonthIcon sx={{ fontSize: 18, color: "#94A3B8" }} /></InputAdornment> }}
            InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {label("PAN of Entity", true)}
          <TextField fullWidth placeholder="AAAAA9999A" sx={s1Err.pan ? inputSxErr : inputSx}
            value={s1.pan} onChange={(e) => setS1({ ...s1, pan: e.target.value.toUpperCase() })} />
          {s1Err.pan && errMsg()}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {label("CIN / LLPIN")}
          <TextField fullWidth sx={inputSx} value={s1.cin} onChange={(e) => setS1({ ...s1, cin: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {label("GSTIN")}
          <TextField fullWidth placeholder="Enter GSTIN" sx={inputSx} value={s1.gstin} onChange={(e) => setS1({ ...s1, gstin: e.target.value })} />
        </Grid>

        {/* Addresses */}
        <Grid item xs={12} md={6}>
          {label("Registered Office Address", true)}
          <TextField fullWidth multiline rows={4} placeholder="Enter registered office address"
            value={s1.registeredAddress}
            onChange={(e) => {
              const val = e.target.value;
              setS1((prev) => ({
                ...prev, registeredAddress: val,
                correspondenceAddress: prev.sameAsRegistered ? val : prev.correspondenceAddress,
              }));
            }}
            sx={{
              "& .MuiInputBase-root": { bgcolor: "#F8FAFC", fontSize: "0.85rem", borderRadius: "8px", alignItems: "flex-start", border: s1Err.registeredAddress ? "1px solid #EF4444" : undefined },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: s1Err.registeredAddress ? "#EF4444" : "#CBD5E1" },
            }} />
          {s1Err.registeredAddress && errMsg()}
        </Grid>
        <Grid item xs={12} md={6}>
          {label("Correspondence Address", true)}
          <TextField fullWidth multiline rows={4} placeholder="Enter correspondence address"
            disabled={s1.sameAsRegistered}
            value={s1.sameAsRegistered ? s1.registeredAddress : s1.correspondenceAddress}
            onChange={(e) => setS1({ ...s1, correspondenceAddress: e.target.value })}
            sx={{
              "& .MuiInputBase-root": { bgcolor: s1.sameAsRegistered ? "#F1F5F9" : "#F8FAFC", fontSize: "0.85rem", borderRadius: "8px", alignItems: "flex-start" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
            }} />
          <FormControlLabel
            control={<Checkbox checked={s1.sameAsRegistered} onChange={handleSameAddress} size="small" sx={{ color: "#CBD5E1", p: "4px", "&.Mui-checked": { color: "#2563EB" } }} />}
            label={<Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>Same as Registered Address</Typography>}
            sx={{ mt: 0.5, ml: 0 }} />
          {s1Err.correspondenceAddress && errMsg()}
        </Grid>

        {/* Contact */}
        <Grid item xs={12}><Divider sx={{ borderColor: "#F1F5F9" }} /><Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 2, color: "#1E293B" }}>Contact Information</Typography></Grid>
        <Grid item xs={12} sm={6} md={4}>
          {label("Official Email ID", true)}
          <TextField fullWidth placeholder="name@company.com" sx={s1Err.email ? inputSxErr : inputSx}
            value={s1.email} onChange={(e) => setS1({ ...s1, email: e.target.value })} />
          {s1Err.email && errMsg()}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {label("Official Mobile Number", true)}
          <TextField fullWidth placeholder="+91 XXXXX XXXXX" sx={s1Err.mobile ? inputSxErr : inputSx}
            value={s1.mobile} onChange={(e) => setS1({ ...s1, mobile: e.target.value })} />
          {s1Err.mobile && errMsg()}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {label("Website URL")}
          <TextField fullWidth placeholder="https://" sx={inputSx}
            value={s1.website} onChange={(e) => setS1({ ...s1, website: e.target.value })} />
        </Grid>
      </Grid>
    </Box>
  );

  // Step 2 starts here - UI
  const renderStep2 = () => (
  <Box>
    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#1E293B", letterSpacing: '-0.02em' }}>
      SEBI & Exchange Details
    </Typography>

    <Grid container spacing={5}>
      {/* --- SEBI SECTION --- */}
<Grid item xs={12}>
  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: "#475569", textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
      SEBI Registration Information
    </Typography>
    
    <Grid container spacing={4}>
      {/* Left Column: Form Fields (Takes 8/12 of the space) */}
      <Grid item xs={12} md={8.5}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 1.2 }}>{label("SEBI Registration Number", true)}</Box>
            <TextField 
              fullWidth 
              placeholder="INZ0123456789" 
              sx={s2Err.sebiRegNo ? inputSxErr : inputSx}
              value={s2.sebiRegNo} 
              onChange={(e) => setS2({ ...s2, sebiRegNo: e.target.value })} 
            />
            <Box sx={{ height: 20 }}>{s2Err.sebiRegNo && errMsg()}</Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 1.2 }}>{label("Registration Category", true)}</Box>
            <Select 
              fullWidth 
              displayEmpty 
              value={s2.regCategory} 
              onChange={(e) => setS2({ ...s2, regCategory: e.target.value })}
              sx={{ ...(s2Err.regCategory ? inputSxErr : inputSx), height: 40, fontSize: "0.85rem" }}
            >
              <MenuItem value="" disabled><span style={{ color: "#94A3B8" }}>Select Category</span></MenuItem>
              <MenuItem value="Stock Broker">Stock Broker</MenuItem>
              <MenuItem value="Sub Broker">Sub Broker</MenuItem>
              <MenuItem value="Depository Participant">Depository Participant</MenuItem>
            </Select>
            <Box sx={{ height: 20 }}>{s2Err.regCategory && errMsg()}</Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 1.2 }}>{label("Registration Date", true)}</Box>
            <TextField 
              fullWidth 
              type="date" 
              sx={s2Err.regDate ? inputSxErr : inputSx}
              value={s2.regDate} 
              onChange={(e) => setS2({ ...s2, regDate: e.target.value })}
              InputLabelProps={{ shrink: true }} 
            />
            <Box sx={{ height: 20 }}>{s2Err.regDate && errMsg()}</Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 1.2 }}>{label("Validity of Registration")}</Box>
            <TextField 
              fullWidth 
              placeholder="Perpetual" 
              sx={inputSx}
              value={s2.regValidity} 
              onChange={(e) => setS2({ ...s2, regValidity: e.target.value })} 
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Right Column: Upload (Takes 3.5/12 of the space) */}
      <Grid item xs={12} md={3.5}>
        <Box sx={{ mb: 1.2 }}>{label("Upload Certificate", true)}</Box>
        <FileUploadBox 
  fieldLabel="SEBI Certificate (PDF)" 
  files={sebiCertFile} // Changed from 'file' to 'files'
  onChange={(files) => setSebiCertFile(files[0])} // Just take the first one
  error={s2Err.sebiCertFile} 
/>
        <Box sx={{ height: 20 }}>{s2Err.sebiCertFile && errMsg("Certificate required")}</Box>
      </Grid>
    </Grid>
  </Paper>
</Grid>

      {/* --- EXCHANGE SECTION --- */}
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: "#475569", textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Stock Exchange Membership
          </Typography>

          <Grid container spacing={3}>
            {/* Row 1: Select Exchanges */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>{label("Select Exchange(s)", true)}</Box>
              <Box sx={{ p: 1, border: '1px solid #E2E8F0', borderRadius: 1, minHeight: 42, display: 'flex', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {(["NSE", "BSE", "SMI", "NCDEX"] as const).map((ex) => {
                    const key = `exchange${ex}` as keyof typeof s2;
                    return (
                      <FormControlLabel 
                        key={ex}
                        control={
                          <Checkbox 
                            size="small" 
                            checked={!!s2[key]} 
                            onChange={(e) => setS2({ ...s2, [key]: e.target.checked })} 
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{ex}</Typography>} 
                      />
                    );
                  })}
                </Stack>
              </Box>
              <Box sx={{ height: 18 }}>{s2Err.exchange && errMsg("Please select at least one")}</Box>
            </Grid>

            {/* Row 1: Membership Code */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>{label("Membership Code")}</Box>
              <TextField 
                fullWidth 
                placeholder="INB1223456789" 
                sx={inputSx}
                value={s2.membershipCode} 
                onChange={(e) => setS2({ ...s2, membershipCode: e.target.value })} 
              />
            </Grid>

            {/* Row 1: Segments */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>{label("Segments")}</Box>
              <Stack direction="row" sx={{ flexWrap: "wrap", pt: 0.5 }}>
                {["Cash", "F&O", "Currency"].map((seg) => {
                  const keyMap: any = { "Cash": "segCash", "F&O": "segFO", "Currency": "segCurrency" };
                  const k = keyMap[seg];
                  return (
                    <FormControlLabel 
                      key={seg} 
                      control={
                        <Checkbox 
                          size="small" 
                          checked={!!s2[k as keyof typeof s2]} 
                          onChange={(e) => setS2({ ...s2, [k]: e.target.checked })} 
                        />
                      } 
                      label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{seg}</Typography>} 
                    />
                  );
                })}
              </Stack>
            </Grid>

           {/* Row 2: Multi-File Upload */}
<Grid item xs={12}>
  <Box sx={{ mb: 1.5 }}>
    {label("Upload Exchange Membership Certificate(s)", true)}
  </Box>

  {/* CALL the component, don't paste its internal code here */}
  <FileUploadBox 
    fieldLabel="Click to upload or drag multiple files" 
    files={exchangeCertFiles} 
    onChange={handleFileUpload} 
    multiple={true}
    error={s2Err.exchangeCertFiles}
  />

  {/* This is what shows the files once uploaded */}
  {exchangeCertFiles.length > 0 && (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1.5 }}>
      {exchangeCertFiles.map((file: File, index: number) => (
        <Chip
          key={`${file.name}-${index}`}
          label={file.name}
          onDelete={() => handleRemoveFile(index)}
          variant="outlined"
          size="small"
          sx={{ 
            borderRadius: "4px", 
            bgcolor: "#F8FAFC",
            fontSize: "0.72rem",
            fontWeight: 500,
            border: "1px solid #E2E8F0"
          }}
        />
      ))}
    </Stack>
  )}
  <Box sx={{ height: 18 }}>
    {s2Err.exchangeCertFiles && errMsg("File upload is required")}
  </Box>
</Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

  // Step 3 starts here - UI
  const renderStep3 = () => (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: "#1E293B" }}>Compliance & Financials</Typography>
      <Accordion defaultExpanded elevation={0} sx={{ borderRadius: "10px!important", border: "1px solid #E2E8F0", mb: 3, "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", px: 3 }}>
          <Typography sx={{ fontWeight: 700 }}>Compliance Officer Details</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 4, py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {label("Name of Compliance Officer", true)}
              <TextField fullWidth placeholder="Full Name" sx={s3Err.coName ? inputSxErr : inputSx}
                value={s3.coName} onChange={(e) => setS3({ ...s3, coName: e.target.value })} />
              {s3Err.coName && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6}>
              {label("Designation", true)}
              <Select fullWidth displayEmpty value={s3.coDesignation} onChange={(e) => setS3({ ...s3, coDesignation: e.target.value })}
                sx={{ ...(s3Err.coDesignation ? inputSxErr : inputSx), height: 40, fontSize: "0.85rem" }}>
                <MenuItem value="" disabled><span style={{ color: "#94A3B8" }}>Select Designation</span></MenuItem>
                <MenuItem value="Compliance Officer">Compliance Officer</MenuItem>
                <MenuItem value="Director">Director</MenuItem>
                <MenuItem value="Partner">Partner</MenuItem>
              </Select>
              {s3Err.coDesignation && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6}>
              {label("PAN of Compliance Officer", true)}
              <TextField fullWidth placeholder="Enter PAN" sx={s3Err.coPan ? inputSxErr : inputSx}
                value={s3.coPan} onChange={(e) => setS3({ ...s3, coPan: e.target.value.toUpperCase() })} />
              {s3Err.coPan && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6}>
              {label("Mobile Number", true)}
              <TextField fullWidth placeholder="Enter Mobile" sx={s3Err.coMobile ? inputSxErr : inputSx}
                value={s3.coMobile} onChange={(e) => setS3({ ...s3, coMobile: e.target.value })} />
              {s3Err.coMobile && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FileUploadBox fieldLabel="Upload Appointment Letter (PDF)" file={appointmentFile} onChange={setAppointmentFile} error={s3Err.appointmentFile} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded elevation={0} sx={{ borderRadius: "10px!important", border: "1px solid #E2E8F0", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", px: 3 }}>
          <Typography sx={{ fontWeight: 700 }}>Financial Information</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 4, py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              {label("Net Worth (Latest Audited ₹)", true)}
              <TextField fullWidth placeholder="e.g. 5,00,00,000" sx={s3Err.netWorth ? inputSxErr : inputSx}
                value={s3.netWorth} onChange={(e) => setS3({ ...s3, netWorth: e.target.value })} />
              {s3Err.netWorth && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {label("Name of Auditor", true)}
              <TextField fullWidth placeholder="Auditor Name" sx={s3Err.auditorName ? inputSxErr : inputSx}
                value={s3.auditorName} onChange={(e) => setS3({ ...s3, auditorName: e.target.value })} />
              {s3Err.auditorName && errMsg()}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {label("Auditor Membership No.")}
              <TextField fullWidth placeholder="Membership No." sx={inputSx}
                value={s3.auditorMembership} onChange={(e) => setS3({ ...s3, auditorMembership: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FileUploadBox fieldLabel="Upload Networth Certificate (PDF)" file={networthFile} onChange={setNetworthFile} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FileUploadBox fieldLabel="Upload Financial Statements (PDF)" file={financialFile} onChange={setFinancialFile} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FileUploadBox fieldLabel="Upload CA Certificate (PDF)" file={caFile} onChange={setCaFile} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  // Step 4 starts here - UI (Roles & Permissions removed)
const renderStep4 = () => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#1E293B", letterSpacing: '-0.02em' }}>
        Authorized Person Setup
      </Typography>

      <Accordion 
        defaultExpanded 
        elevation={0} 
        sx={{ 
          borderRadius: "10px!important", 
          border: "1px solid #E2E8F0", 
          mb: 3, 
          "&:before": { display: "none" } 
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />} 
          sx={{ bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", px: 3 }}
        >
          <Typography sx={{ fontWeight: 700 }}>Authorized Person Details</Typography>
        </AccordionSummary>
        
        <AccordionDetails sx={{ px: 4, py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {label("Full Name", true)}
              <TextField 
                fullWidth 
                placeholder="Enter Full Name" 
                sx={s4Err.fullName ? inputSxErr : inputSx}
                value={s4.fullName} 
                onChange={(e) => setS4({ ...s4, fullName: e.target.value })} 
              />
              <Box sx={{ height: 20 }}>{s4Err.fullName && errMsg()}</Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              {label("PAN(Optional)")}
              <TextField 
                fullWidth 
                placeholder="Enter PAN" 
                sx={inputSx}
                value={s4.pan} 
                onChange={(e) => setS4({ ...s4, pan: e.target.value.toUpperCase() })} 
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {label("Designation")}
              <TextField 
                fullWidth 
                placeholder="Enter Designation" 
                sx={inputSx}
                value={s4.designation} 
                onChange={(e) => setS4({ ...s4, designation: e.target.value })} 
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {label("Official Email ID", true)}
              <TextField 
                fullWidth 
                placeholder="Enter Email" 
                sx={s4Err.email ? inputSxErr : inputSx}
                value={s4.email} 
                onChange={(e) => setS4({ ...s4, email: e.target.value })} 
              />
              <Box sx={{ height: 20 }}>{s4Err.email && errMsg()}</Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              {label("Aadhaar", true)}
              <TextField 
                fullWidth 
                placeholder="XXXX XXXX XXXX" 
                sx={s4Err.aadhaar ? inputSxErr : inputSx}
                value={s4.aadhaar} 
                onChange={(e) => setS4({ ...s4, aadhaar: e.target.value })} 
              />
              <Box sx={{ height: 20 }}>{s4Err.aadhar && errMsg()}</Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              {label("Mobile Number", true)}
              <TextField 
                fullWidth 
                placeholder="Enter Mobile" 
                sx={s4Err.mobile ? inputSxErr : inputSx}
                value={s4.mobile} 
                onChange={(e) => setS4({ ...s4, mobile: e.target.value })} 
              />
              <Box sx={{ height: 20 }}>{s4Err.mobile && errMsg()}</Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

  // Step 5 starts here - UI
  const sectionHdrSx = { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, pb: 1, borderBottom: "1px solid #F1F5F9" };
  const lbSx = { fontWeight: 600, color: "#64748B", fontSize: "0.8rem", minWidth: "140px" };
  const vlSx = { fontWeight: 600, color: "#1E293B", fontSize: "0.8rem" };

  const renderStep5 = () => (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: "#1E293B" }}>Review & Declaration</Typography>
      <Grid container spacing={3}>
        {/* Entity Details */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "10px", height: "100%" }}>
            <Box sx={sectionHdrSx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Entity Details</Typography>
              <Button size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none" }} onClick={() => setActiveStep(0)}>Edit</Button>
            </Box>
            <Stack spacing={1}>
              <Stack direction="row"><Typography sx={lbSx}>Legal Name:</Typography><Typography sx={vlSx}>{s1.legalName || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Trade Name:</Typography><Typography sx={vlSx}>{s1.tradeName || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Entity Type:</Typography><Typography sx={vlSx}>{s1.entityType || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>PAN:</Typography><Typography sx={vlSx}>{s1.pan || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>CIN / LLPIN:</Typography><Typography sx={vlSx}>{s1.cin || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>GSTIN:</Typography><Typography sx={vlSx}>{s1.gstin || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Inc. Date:</Typography><Typography sx={vlSx}>{s1.incDay || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Email:</Typography><Typography sx={vlSx}>{s1.email || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Mobile:</Typography><Typography sx={vlSx}>{s1.mobile || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Website:</Typography><Typography sx={vlSx}>{s1.website || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Reg. Address:</Typography><Typography sx={vlSx}>{s1.registeredAddress || "—"}</Typography></Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* SEBI Details */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "10px", height: "100%" }}>
            <Box sx={sectionHdrSx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>SEBI & Exchange Details</Typography>
              <Button size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none" }} onClick={() => setActiveStep(1)}>Edit</Button>
            </Box>
            <Stack spacing={1}>
              <Stack direction="row"><Typography sx={lbSx}>SEBI Reg. No:</Typography><Typography sx={vlSx}>{s2.sebiRegNo || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Category:</Typography><Typography sx={vlSx}>{s2.regCategory || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Reg. Date:</Typography><Typography sx={vlSx}>{s2.regDate || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Validity:</Typography><Typography sx={vlSx}>{s2.regValidity || "—"}</Typography></Stack>
              <Stack direction="row">
                <Typography sx={lbSx}>Exchange(s):</Typography>
                <Typography sx={vlSx}>{[s2.exchangeNSE && "NSE", s2.exchangeBSE && "BSE", s2.exchangeSMI && "SMI", s2.exchangeNCDEX && "NCDEX"].filter(Boolean).join(", ") || "—"}</Typography>
              </Stack>
              <Stack direction="row"><Typography sx={lbSx}>Membership Code:</Typography><Typography sx={vlSx}>{s2.membershipCode || "—"}</Typography></Stack>
              {sebiCertFile && (
                <Stack direction="row" alignItems="center">
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: "#64748B", mr: 0.5 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "#2563EB" }}>{sebiCertFile.name}</Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Compliance Officer */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "10px", height: "100%" }}>
            <Box sx={sectionHdrSx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Compliance & Financials</Typography>
              <Button size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none" }} onClick={() => setActiveStep(2)}>Edit</Button>
            </Box>
            <Stack spacing={1}>
              <Stack direction="row"><Typography sx={lbSx}>CO Name:</Typography><Typography sx={vlSx}>{s3.coName || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Designation:</Typography><Typography sx={vlSx}>{s3.coDesignation || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>CO PAN:</Typography><Typography sx={vlSx}>{s3.coPan || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>CO Mobile:</Typography><Typography sx={vlSx}>{s3.coMobile || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Net Worth:</Typography><Typography sx={vlSx}>{s3.netWorth || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Auditor:</Typography><Typography sx={vlSx}>{s3.auditorName || "—"}</Typography></Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Authorized Person */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "10px", height: "100%" }}>
            <Box sx={sectionHdrSx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Authorized Person</Typography>
              <Button size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none" }} onClick={() => setActiveStep(3)}>Edit</Button>
            </Box>
            <Stack spacing={1}>
              <Stack direction="row"><Typography sx={lbSx}>Full Name:</Typography><Typography sx={vlSx}>{s4.fullName || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>PAN:</Typography><Typography sx={vlSx}>{s4.pan || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Designation:</Typography><Typography sx={vlSx}>{s4.designation || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Email:</Typography><Typography sx={vlSx}>{s4.email || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Mobile:</Typography><Typography sx={vlSx}>{s4.mobile || "—"}</Typography></Stack>
              <Stack direction="row"><Typography sx={lbSx}>Role:</Typography><Typography sx={vlSx}>{s4.role}</Typography></Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Regulatory Declarations */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: "10px" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Regulatory Declarations</Typography>
            <Typography variant="caption" sx={{ color: "#EF4444", mb: 1, display: "block" }}>
              {Object.keys(s5Err).length > 0 && "Please accept all declarations to proceed."}
            </Typography>
            <Grid container spacing={1}>
              {(
                [
                  ["noDisciplinary", "No SEBI disciplinary action pending against the entity"],
                  ["noSuspension", "No Exchange suspension or default history"],
                  ["noCriminal", "No securities market-related criminal proceedings"],
                  ["agreeCirculars", "Agree to comply with all SEBI & Exchange circulars"],
                  ["agreeConduct", "Agree to platform code of conduct and terms of use"],
                ] as [keyof typeof declarations, string][]
              ).map(([key, text]) => (
                <Grid item xs={12} md={6} key={key}>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={declarations[key]}
                      onChange={(e) => setDeclarations({ ...declarations, [key]: e.target.checked })}
                      sx={{ color: s5Err[key] ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#2563EB" } }} />}
                    label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: s5Err[key] ? "#EF4444" : "#374151" }}>{text}</Typography>} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const stepContent = [renderStep1(), renderStep2(), renderStep3(), renderStep4(), renderStep5()];

  // ────────────────────────────────────────────
  // LAYOUT
  // ────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", pb: 10 }}>
      {/* Utility Header */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: { xs: 2, md: 4 }, py: 1, bgcolor: "white", borderBottom: "1px solid #E2E8F0" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />} sx={{ color: "#64748B", textTransform: "none", fontWeight: 500 }}>Help</Button>
          <Button variant="contained" sx={{ bgcolor: "#2563EB", textTransform: "none", boxShadow: "none", borderRadius: "6px", px: 3 }}>Save Draft</Button>
          <Button sx={{ color: "#64748B", textTransform: "none", fontWeight: 500 }}>Exit Registration</Button>
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Stepper */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center", mb: 3, color: "#1E293B" }}>
            Step {activeStep + 1} of {steps.length} — {steps[activeStep]}
          </Typography>
          <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
            {steps.map((stepLabel) => (
              <Step key={stepLabel}>
                <StepLabel StepIconComponent={QontoStepIcon}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B" }}>{stepLabel}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Form Content */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          {stepContent[activeStep]}
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mt: 4 }}>
          <Button variant="contained" startIcon={<ChevronLeftIcon />}
            onClick={handleBack}
            disabled={activeStep === 0}
            sx={{ textTransform: "none", color: "#64748B", bgcolor: "#E2E8F0", boxShadow: "none", px: 4, "&:hover": { bgcolor: "#CBD5E1" }, "&.Mui-disabled": { bgcolor: "#F1F5F9", color: "#CBD5E1" } }}>
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" sx={{ textTransform: "none", color: "#64748B", borderColor: "#E2E8F0", bgcolor: "white", px: 4, fontWeight: 600 }}>
              Save as Draft
            </Button>
            <Button variant="contained" endIcon={<ChevronRightIcon />}
              onClick={handleNext}
              sx={{ textTransform: "none", bgcolor: "#2563EB", px: 4, boxShadow: "none", fontWeight: 600 }}>
              {activeStep === 4 ? "Submit Application" : "Save & Continue"}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default BrokerRegistration;