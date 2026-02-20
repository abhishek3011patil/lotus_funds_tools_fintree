import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Paper,
  Grid,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Divider,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const RegistrationPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    salutation: "", firstName: "", middleName: "", surname: "",
    orgName: "", designation: "", shortBio: "", email: "",
    mobile: "", telephone: "", country: "", state: "",
    city: "", pincode: "", address1: "", address2: "",
    sebiRegNo: "", sebiStartDate: "", sebiExpiryDate: "",
    nismRegNo: "", nismValidTill: "",
    academicQual: "", profQual: "", expertise: "", markets: "",
    marketExp: "", // Added for Step 2
    bankName: "", accountHolder: "", accountNumber: "", ifscCode: "",
    panNumber: "", addressProofType: "",
    declare1: false, declare2: false,
    noGuaranteedReturns: false,
    conflictOfInterest: false,
    personalTrading: false,
    sebiCompliance: false,
    platformPolicy: false
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFileName, setProfileFileName] = useState("No file chosen");
  const [fileLabels, setFileLabels] = useState({
    sebiCert: "No file chosen",
    sebiReceipt: "No file chosen",
    nismCert: "No file chosen",
    cancelledCheque: "No file chosen",
    panCard: "No file chosen",
    addressProofDoc: "No file chosen"
  });

  // Data Lists
  const bankOptions = ["AU Small Finance Bank", "Axis Bank", "Bank of Baroda", "Bank of India", "Bank of Maharashtra", "Canara Bank", "Central Bank of India", "Citibank", "DBS Bank India", "Equitas Small Finance Bank", "Federal Bank", "HDFC Bank", "HSBC", "ICICI Bank", "IDFC First Bank", "Indian Bank", "Indian Overseas Bank", "IndusInd Bank", "Kotak Mahindra Bank", "Punjab & Sind Bank", "Punjab National Bank (PNB)", "RBL Bank", "South Indian Bank", "Standard Chartered", "State Bank of India (SBI)", "UCO Bank", "Ujjivan Small Finance Bank", "Union Bank of India", "Yes Bank"];

  const academicOptions = ["Graduate – Finance", "Graduate – Accountancy", "Graduate – Business Management", "Graduate – Commerce", "Graduate – Economics", "Graduate – Capital Markets", "Graduate – Banking", "Graduate – Insurance", "Graduate – Actuarial Science", "Graduate – Other Financial Services", "Post Graduate – Finance", "Post Graduate – Accountancy", "Post Graduate – Business Management", "Post Graduate – Commerce", "Post Graduate – Economics", "Post Graduate – Capital Markets", "Post Graduate – Banking", "Post Graduate – Insurance", "Post Graduate – Actuarial Science", "Post Graduate – Other Financial Services", "Diploma – Finance / Financial Services", "Diploma – Capital Markets / Securities Markets"];

  const professionalOptions = ["Chartered Accountant (CA)", "Company Secretary (CS)", "Cost & Management Accountant (CMA)", "FRM – Financial Risk Manager (GARP)", "NISM Series VIII – Equity Derivatives", "NISM Series XIII – Common Derivatives", "NISM Currency / Commodity Market Modules"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (type !== "checkbox" && value.trim() !== "") setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSelect = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    setFormData({ ...formData, [name]: e.target.value });
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const validateStep = () => {
    const newErrors: { [key: string]: boolean } = {};
    const step1Fields = ['salutation', 'firstName', 'middleName', 'surname', 'orgName', 'designation', 'shortBio', 'email', 'mobile', 'telephone', 'country', 'state', 'city', 'pincode', 'address1', 'address2'];
    const step2Fields = ['sebiRegNo', 'sebiStartDate', 'sebiExpiryDate', 'nismRegNo', 'nismValidTill', 'academicQual', 'profQual', 'expertise', 'markets', 'marketExp'];
    const step3Fields = ['bankName', 'accountHolder', 'accountNumber', 'ifscCode', 'panNumber', 'addressProofType'];

    let fieldsToValidate = currentStep === 1 ? step1Fields : currentStep === 2 ? step2Fields : step3Fields;
    fieldsToValidate.forEach(field => {
      const val = formData[field as keyof typeof formData];
      if (!val || (typeof val === 'string' && val.trim() === "")) newErrors[field] = true;
    });

    if (currentStep === 3) {
      if (!formData.declare1) newErrors.declare1 = true;
      if (!formData.declare2) newErrors.declare2 = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        console.log("Final Submission", formData);
      }
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof fileLabels) => {
    const file = e.target.files?.[0];
    if (file) setFileLabels(prev => ({ ...prev, [key]: file.name }));
  };

  const getDynamicUploadStyle = (fileName: string) => {
    const isUploaded = fileName !== "No file chosen";
    return {
      bgcolor: isUploaded ? "#2E7D32" : "#F0F2F5",
      color: isUploaded ? "#ffffff" : "#444",
      borderColor: isUploaded ? "#1B5E20" : "#C4C4C4",
      "&:hover": { bgcolor: isUploaded ? "#1B5E20" : "#E0E0E0" },
      border: "1px solid #C4C4C4", textTransform: "none", borderRadius: 2, fontSize: '0.9rem', fontWeight: 600, px: 2, py: 1
    };
  };

  const styles = {
    container: { bgcolor: "#F4F7FE", minHeight: "100vh", p: 4, display: "flex", justifyContent: "center", fontFamily: "'Inter', sans-serif" },
    paper: { width: "100%", maxWidth: 1300, p: 8, borderRadius: 6, boxShadow: "0px 20px 50px rgba(0,0,0,0.05)", bgcolor: "#ffffff" },
    stepperBox: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 6, gap: 2 },
    stepActive: { display: "flex", alignItems: "center", gap: 2, p: "18px 36px", background: "linear-gradient(90deg, #4F6CF8 0%, #637BFF 100%)", color: "#fff", borderRadius: "0 60px 60px 0", flex: 1 },
    stepDone: { display: "flex", alignItems: "center", gap: 2, color: "#4F6CF8", flex: 1, p: "18px 36px" },
    stepFuture: { display: "flex", alignItems: "center", gap: 2, color: "#B0BBD5", flex: 1, p: "18px 36px" },
    title: { color: "#4F6CF8", fontWeight: 800, fontSize: "2.4rem", mb: 4 },
    subTitle: { color: "#333", fontWeight: 700, fontSize: "1.3rem", mb: 3, mt: 3 },
    input: { "& .MuiOutlinedInput-root": { borderRadius: 3, fontSize: '1.1rem', "& fieldset": { borderColor: "#E0E7FF" } }, "& .MuiInputLabel-root": { fontSize: '1.1rem' } },
    saveBtn: { bgcolor: "#4F6CF8", color: "#fff", px: 8, py: 2.2, borderRadius: 3, fontWeight: 700, fontSize: '1.2rem', textTransform: "none", "&:hover": { bgcolor: "#3D56CA" } },
  };

  return (
    <Box sx={styles.container}>
      <Paper sx={styles.paper} elevation={0}>
        <Box sx={styles.stepperBox}>
          <Box sx={currentStep > 1 ? styles.stepDone : styles.stepActive}>
            {currentStep > 1 ? <CheckCircleIcon sx={{ fontSize: 40 }} /> : <Box sx={{ border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>01</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Personal info</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>General Details</Typography></Box>
          </Box>
          <Box sx={currentStep === 2 ? styles.stepActive : (currentStep > 2 ? styles.stepDone : styles.stepFuture)}>
            {currentStep > 2 ? <CheckCircleIcon sx={{ fontSize: 40 }} /> : <Box sx={{ border: '2px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>02</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Professional & SEBI</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Credentials</Typography></Box>
          </Box>
          <Box sx={currentStep === 3 ? styles.stepActive : (currentStep > 3 ? styles.stepDone : styles.stepFuture)}>
            {currentStep > 3 ? <CheckCircleIcon sx={{ fontSize: 40 }} /> : <Box sx={{ border: '1px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>03</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Platform KYC</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Verification</Typography></Box>
          </Box>
          <Box sx={currentStep === 4 ? styles.stepActive : styles.stepFuture}>
             <Box sx={{ border: '1px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>04</Box>
             <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Consent</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Declaration</Typography></Box>
          </Box>
        </Box>

        {currentStep === 1 && (
          <Box>
            <Typography sx={styles.title}>Step 1: Basic Profile & Contact Information</Typography>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography sx={styles.subTitle}>Personal Detail</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 3 }}><FormControl fullWidth sx={styles.input} error={errors.salutation}><InputLabel>Salutation</InputLabel><Select name="salutation" value={formData.salutation} label="Salutation" onChange={handleSelect}><MenuItem value="Mr">Mr.</MenuItem><MenuItem value="Ms">Ms.</MenuItem></Select>{errors.salutation && <FormHelperText>Required</FormHelperText>}</FormControl></Grid>
                  <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.firstName} name="firstName" label="First Name" sx={styles.input} onChange={handleChange} helperText={errors.firstName ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.middleName} name="middleName" label="Middle Name" sx={styles.input} onChange={handleChange} helperText={errors.middleName ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.surname} name="surname" label="Surname" sx={styles.input} onChange={handleChange} helperText={errors.surname ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth error={errors.orgName} name="orgName" label="Organization Name" sx={styles.input} onChange={handleChange} helperText={errors.orgName ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth error={errors.designation} name="designation" label="Designation" sx={styles.input} onChange={handleChange} helperText={errors.designation ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth error={errors.shortBio} multiline rows={4} name="shortBio" label="Short Bio" sx={styles.input} onChange={handleChange} helperText={errors.shortBio ? "Required" : ""}/></Grid>
                </Grid>
                <Typography sx={[styles.subTitle, { mt: 5 }]}>Contact Information</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 4 }}><TextField fullWidth error={errors.email} name="email" label="Email" sx={styles.input} onChange={handleChange} helperText={errors.email ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth error={errors.mobile} name="mobile" label="Mobile" sx={styles.input} onChange={handleChange} helperText={errors.mobile ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth error={errors.telephone} name="telephone" label="Telephone" sx={styles.input} onChange={handleChange} helperText={errors.telephone ? "Required" : ""}/></Grid>
                </Grid>
                <Typography sx={[styles.subTitle, { mt: 5 }]}>Address</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 3 }}><FormControl fullWidth sx={styles.input} error={errors.country}><InputLabel>Country</InputLabel><Select name="country" value={formData.country} label="Country" onChange={handleSelect}><MenuItem value="India">India</MenuItem></Select>{errors.country && <FormHelperText>Required</FormHelperText>}</FormControl></Grid>
                  <Grid size={{ xs: 3 }}><FormControl fullWidth sx={styles.input} error={errors.state}><InputLabel>State</InputLabel><Select name="state" value={formData.state} label="State" onChange={handleSelect}><MenuItem value="Maharashtra">Maharashtra</MenuItem></Select>{errors.state && <FormHelperText>Required</FormHelperText>}</FormControl></Grid>
                  <Grid size={{ xs: 3 }}><FormControl fullWidth sx={styles.input} error={errors.city}><InputLabel>City</InputLabel><Select name="city" value={formData.city} label="City" onChange={handleSelect}><MenuItem value="Mumbai">Mumbai</MenuItem></Select>{errors.city && <FormHelperText>Required</FormHelperText>}</FormControl></Grid>
                  <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.pincode} name="pincode" label="Pincode" sx={styles.input} onChange={handleChange} helperText={errors.pincode ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth error={errors.address1} name="address1" label="Address Line 1" sx={styles.input} onChange={handleChange} helperText={errors.address1 ? "Required" : ""}/></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth error={errors.address2} name="address2" label="Address Line 2" sx={styles.input} onChange={handleChange} helperText={errors.address2 ? "Required" : ""}/></Grid>
                </Grid>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 12 }}>
                <Avatar src={profileImage || ""} sx={{ width: 240, height: 240, bgcolor: "#F0F2F5", border: '2px solid #E0E7FF', mb: 4 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E0E7FF', borderRadius: 3, overflow: 'hidden' }}>
                  <Button component="label" sx={{ bgcolor: '#E5E7EB', color: '#333', py: 1.5, px: 3, borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>Choose File<input type="file" hidden accept="image/*" onChange={handleProfileChange} /></Button>
                  <Typography variant="body1" sx={{ px: 3, color: '#666' }}>{profileFileName}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {currentStep === 2 && (
          <Box>
            <Typography sx={styles.title}>Step 2: Professional & SEBI Information</Typography>
            <Typography sx={styles.subTitle}>SEBI Registration</Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 2.5 }}><TextField fullWidth error={errors.sebiRegNo} name="sebiRegNo" label="SEBI Reg. No" sx={styles.input} onChange={handleChange} helperText={errors.sebiRegNo ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 1.6 }}><TextField fullWidth error={errors.sebiStartDate} type="date" name="sebiStartDate" label="Start Date" InputLabelProps={{ shrink: true }} sx={styles.input} onChange={handleChange} helperText={errors.sebiStartDate ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 0.3 }} sx={{ textAlign: 'center', fontWeight: 700 }}>to</Grid>
              <Grid size={{ xs: 1.6 }}><TextField fullWidth error={errors.sebiExpiryDate} type="date" name="sebiExpiryDate" label="Expiry Date" InputLabelProps={{ shrink: true }} sx={styles.input} onChange={handleChange} helperText={errors.sebiExpiryDate ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>SEBI Certificate</Typography><Button component="label" variant="contained" startIcon={fileLabels.sebiCert !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.sebiCert)}>{fileLabels.sebiCert !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'sebiCert')} /></Button></Grid>
              <Grid size={{ xs: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>SEBI Receipt</Typography><Button component="label" variant="contained" startIcon={fileLabels.sebiReceipt !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.sebiReceipt)}>{fileLabels.sebiReceipt !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'sebiReceipt')} /></Button></Grid>
            </Grid>
            
            <Typography sx={[styles.subTitle, { mt: 6 }]}>NISM – Series XV: Research Analyst</Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.nismRegNo} name="nismRegNo" label="NISM Reg. No" sx={styles.input} onChange={handleChange} helperText={errors.nismRegNo ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 2 }}><TextField fullWidth error={errors.nismValidTill} type="date" name="nismValidTill" label="Valid Till" InputLabelProps={{ shrink: true }} sx={styles.input} onChange={handleChange} helperText={errors.nismValidTill ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 5 }} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>NISM Certificate</Typography><Button component="label" variant="contained" startIcon={fileLabels.nismCert !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.nismCert)}>{fileLabels.nismCert !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'nismCert')} /></Button><Typography variant="caption">{fileLabels.nismCert}</Typography></Grid>
            </Grid>

            <Typography sx={[styles.subTitle, { mt: 6 }]}>Professional Qualification</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.academicQual}><InputLabel>Academic Qualification</InputLabel>
                  <Select name="academicQual" value={formData.academicQual} label="Academic Qualification" onChange={handleSelect}>
                    {academicOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.profQual}><InputLabel>Professional Qualification</InputLabel>
                  <Select name="profQual" value={formData.profQual} label="Professional Qualification" onChange={handleSelect}>
                    {professionalOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.marketExp}><InputLabel>Market Experience</InputLabel>
                  <Select name="marketExp" value={formData.marketExp} label="Market Experience" onChange={handleSelect}>
                    {["0–1 Year", "1–3 Years", "3–5 Years", "5–10 Years", "10–15 Years", "15+ Years"].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.expertise}><InputLabel>Area of Expertise</InputLabel>
                  <Select name="expertise" value={formData.expertise} label="Area of Expertise" onChange={handleSelect}>
                    {["Stock/Equity", "Futures", "Options", "Long Term Trades", "Short Term Trades", "Intraday Trades"].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.markets}><InputLabel>Markets Covered</InputLabel>
                  <Select name="markets" value={formData.markets} label="Markets Covered" onChange={handleSelect}>
                    <MenuItem value="NSE">NSE</MenuItem>
                    <MenuItem value="BSE">BSE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {currentStep === 3 && (
          <Box>
            <Typography sx={styles.title}>Step 3: Platform KYC</Typography>
            <Typography sx={styles.subTitle}>Bank Account Details</Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid size={{ xs: 3 }}>
                <Autocomplete
                  freeSolo
                  options={bankOptions}
                  value={formData.bankName}
                  onInputChange={(_, newValue) => setFormData({ ...formData, bankName: newValue })}
                  renderInput={(params) => <TextField {...params} label="Bank Name" error={errors.bankName} sx={styles.input} />}
                />
              </Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.accountHolder} name="accountHolder" label="Account Holder Name" sx={styles.input} onChange={handleChange} helperText={errors.accountHolder ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.accountNumber} name="accountNumber" label="Account Number" sx={styles.input} onChange={handleChange} helperText={errors.accountNumber ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.ifscCode} name="ifscCode" label="IFSC Code" sx={styles.input} onChange={handleChange} helperText={errors.ifscCode ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>Cancelled Cheque</Typography><Button component="label" variant="contained" startIcon={fileLabels.cancelledCheque !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.cancelledCheque)}>{fileLabels.cancelledCheque !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'cancelledCheque')} /></Button><Typography variant="caption">{fileLabels.cancelledCheque}</Typography></Grid>
            </Grid>
            <Typography sx={[styles.subTitle, { mt: 6 }]}>Identity & Address Proof</Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 3 }}><TextField fullWidth error={errors.panNumber} name="panNumber" label="PAN Number" sx={styles.input} onChange={handleChange} helperText={errors.panNumber ? "Required" : ""}/></Grid>
              <Grid size={{ xs: 5 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>PAN Card Upload</Typography><Button component="label" variant="contained" startIcon={fileLabels.panCard !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.panCard)}>{fileLabels.panCard !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'panCard')} /></Button><Typography variant="caption">{fileLabels.panCard}</Typography></Grid>
            </Grid>
            <Grid container spacing={3} alignItems="center" sx={{ mt: 4 }}>
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth sx={styles.input} error={errors.addressProofType}><InputLabel>Address Proof</InputLabel>
                  <Select name="addressProofType" value={formData.addressProofType} label="Address Proof" onChange={handleSelect}>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="Voter ID Card">Voter ID Card</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                  </Select>
                  {errors.addressProofType && <FormHelperText>Required</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 5 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>Address Proof Upload</Typography><Button component="label" variant="contained" startIcon={fileLabels.addressProofDoc !== "No file chosen" ? <CheckCircleIcon /> : <CloudUploadIcon />} sx={getDynamicUploadStyle(fileLabels.addressProofDoc)}>{fileLabels.addressProofDoc !== "No file chosen" ? "Uploaded" : "Upload Media"}<input type="file" hidden onChange={(e) => handleDocUpload(e, 'addressProofDoc')} /></Button><Typography variant="caption">{fileLabels.addressProofDoc}</Typography></Grid>
            </Grid>
            <Typography sx={[styles.subTitle, { mt: 6 }]}>Declaration</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel control={<Checkbox checked={formData.declare1} onChange={handleChange} name="declare1" color="primary" />} label="I hereby declare that all information and documents provided by me are true, complete, and accurate to the best of my knowledge." sx={{ color: errors.declare1 ? 'error.main' : 'inherit' }} />
              <FormControlLabel control={<Checkbox checked={formData.declare2} onChange={handleChange} name="declare2" color="primary" />} label="I consent to the verification of the above details and documents by the platform or its authorized representatives." sx={{ color: errors.declare2 ? 'error.main' : 'inherit' }} />
            </Box>
          </Box>
        )}

        {currentStep === 4 && (
          <Box>
            <Typography sx={styles.title}>Step 4: Declarations, Disclosures & Consent</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 1. No Guaranteed Returns */}
              <Box>
                <Typography sx={styles.subTitle}>No Guaranteed Returns Declaration</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel 
                  control={<Checkbox checked={formData.noGuaranteedReturns} onChange={handleChange} name="noGuaranteedReturns" color="primary" />} 
                  label={<Typography sx={{ color: '#666' }}>I confirm that I do not offer, promise, or guarantee any assured or fixed returns on investments, directly or indirectly.</Typography>} 
                />
              </Box>

              {/* 2. Conflict of Interest */}
              <Box>
                <Typography sx={styles.subTitle}>Conflict of Interest Disclosure</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel 
                  control={<Checkbox checked={formData.conflictOfInterest} onChange={handleChange} name="conflictOfInterest" color="primary" />} 
                  label={<Typography sx={{ color: '#666' }}>I declare that I have disclosed all actual and potential conflicts of interest, including financial, personal, or professional interests that may influence my research or recommendations.</Typography>} 
                />
              </Box>

              {/* 3. Personal Trading */}
              <Box>
                <Typography sx={styles.subTitle}>Personal Trading Disclosure</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel 
                  control={<Checkbox checked={formData.personalTrading} onChange={handleChange} name="personalTrading" color="primary" />} 
                  label={<Typography sx={{ color: '#666' }}>I confirm that I have disclosed my personal trading positions in accordance with SEBI Research Analyst Regulations and that my personal trades do not conflict with client interests.</Typography>} 
                />
              </Box>

              {/* 4. SEBI Compliance */}
              <Box>
                <Typography sx={styles.subTitle}>SEBI Compliance Acceptance</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel 
                  control={<Checkbox checked={formData.sebiCompliance} onChange={handleChange} name="sebiCompliance" color="primary" />} 
                  label={<Typography sx={{ color: '#666' }}>I agree to comply with all applicable provisions of the SEBI (Research Analysts) Regulations, circulars, guidelines, and amendments issued from time to time.</Typography>} 
                />
              </Box>

              {/* 5. Platform Policy */}
              <Box>
                <Typography sx={styles.subTitle}>Platform Content Policy Acceptance</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel 
                  control={<Checkbox checked={formData.platformPolicy} onChange={handleChange} name="platformPolicy" color="primary" />} 
                  label={<Typography sx={{ color: '#666' }}>I have read and agree to abide by the Platform Content Policy, Research Publishing Guidelines, and Terms of Use.</Typography>} 
                />
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, fontWeight: 600, color: '#333' }}>
                Research Analyst's Disclaimer is not included
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: currentStep > 1 ? 'space-between' : 'flex-end', alignItems: 'flex-start', mt: 8 }}>
          {currentStep > 1 && (
            <Button variant="outlined" sx={{ borderRadius: 3, textTransform: 'none', px: 6, py: 2.2, fontWeight: 700, fontSize: '1.2rem', color: '#8E99AF', borderColor: '#8E99AF' }} onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
          )}
          <Box sx={{ textAlign: 'right' }}>
            <Button variant="contained" sx={styles.saveBtn} onClick={handleSave}>
              {currentStep === 4 ? "Continue" : "Save & Continue"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

//add 

export default RegistrationPage;