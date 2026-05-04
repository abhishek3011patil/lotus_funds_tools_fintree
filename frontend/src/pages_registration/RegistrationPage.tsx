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
import axios from "axios";
import type { SelectChangeEvent } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';



const RegistrationPage: React.FC = () => {

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
  salutation: "",
  first_name: "",
  middle_name: "",
  surname: "",

  org_name: "",
  designation: "",
  short_bio: "",

  email: "",
  mobile: "",
  telephone: "",

  country: "",
  state: "",
  city: "",
  pincode: "",

  address_line1: "",
  address_line2: "",

  sebi_reg_no: "",
  sebi_start_date: "",
  sebi_expiry_date: "",

  nism_reg_no: "",
  nism_valid_till: "",

  academic_qualification: "",
  professional_qualification: "",

  market_experience: "",
  expertise: "",
  markets: "",

  bank_name: "",
  account_holder: "",
  account_number: "",
  ifsc_code: "",

  pan_number: "",
  address_proof_type: "",

  declare_info_true: false,
  consent_verification: false,

  no_guaranteed_returns: false,
  conflict_of_interest: false,
  personal_trading: false,
  sebi_compliance: false,
  platform_policy: false,

  additional_comments: ""
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

  const [files, setFiles] = useState<any>({
    profileImage: null,
    sebiCert: null,
    sebiReceipt: null,
    nismCert: null,
    cancelledCheque: null,
    panCard: null,
    addressProofDoc: null
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
    const step1Fields = ['salutation', 'first_name', 'middle_name', 'surname', 'org_name', 'designation', 'short_bio', 'email', 'mobile', 'telephone', 'country', 'state', 'city', 'pincode', 'address_line1', 'address_line2'];
    const step2Fields = ['sebi_reg_no', 'sebi_start_date', 'sebi_expiry_date', 'nism_reg_no', 'nism_valid_till', 'academic_qualification', 'professional_qualification', 'expertise', 'markets', 'market_experience'];
    const step3Fields = ['bank_name', 'account_holder', 'account_number', 'ifsc_code', 'pan_number', 'address_proof_type'];

    let fieldsToValidate = currentStep === 1 ? step1Fields : currentStep === 2 ? step2Fields : step3Fields;
    fieldsToValidate.forEach(field => {
      const val = formData[field as keyof typeof formData];
      if (!val || (typeof val === 'string' && val.trim() === "")) newErrors[field] = true;
    });

    if (currentStep === 3) {
      if (!formData.declare_info_true) newErrors.declare1 = true;
      if (!formData.consent_verification) newErrors.consent_verification = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSave = async () => {
  if (!validateStep()) return;

  if (currentStep < 4) {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
    return;
  }

  try {
    const form = new FormData();

Object.keys(formData).forEach((key) => {
  const value = (formData as any)[key];

  if (value !== undefined && value !== null && value !== "") {
    form.append(
      key,
      typeof value === "boolean" ? value.toString() : value
    );
  }
});

// ✅ append files (SAFE + CLEAN + MATCH BACKEND)
const fileMapping: any = {
  profile_image: files.profileImage,
  sebi_certificate: files.sebiCert,
  sebi_receipt: files.sebiReceipt,
  nism_certificate: files.nismCert,
  cancelled_cheque: files.cancelledCheque,
  pan_card: files.panCard,
  address_proof_document: files.addressProofDoc,
};

Object.entries(fileMapping).forEach(([key, file]) => {
  if (file instanceof File) {
    form.append(key, file);
  }
});

    // ✅ API call
  const token = localStorage.getItem("token");


    const response = await axios.post(
      `${API_URL}/api/registration/register-ra`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`, // ⭐ ADD THIS
        },
      }
    );

    if (response.data.success) {
      alert("✅ Registration submitted successfully!");
    }

  } catch (error: any) {
    if (error.response) {
      console.error("Backend error:", error.response.data);
      alert(error.response.data.message);
    } else {
      console.error("Network error:", error);
      alert("Network error");
    }
  }
};

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setProfileFileName(file.name);

      setFiles((prev: any) => ({
        ...prev,
        profileImage: file
      }));

      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof fileLabels
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setFileLabels(prev => ({ ...prev, [key]: file.name }));

      setFiles((prev: any) => ({
        ...prev,
        [key]: file
      }));
    }
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
  container: {
    bgcolor: "#F4F7FE",
    minHeight: "100vh",
    p: { xs: 2, md: 4 }, // 🔥 responsive padding
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif"
  },

  paper: {
    width: "100%",
    maxWidth: 1300,
    p: { xs: 2, sm: 4, md: 8 }, // 🔥 responsive padding
    borderRadius: { xs: 3, md: 6 },
    boxShadow: "0px 20px 50px rgba(0,0,0,0.05)",
    bgcolor: "#ffffff"
  },

  stepperBox: {
    display: "flex",
    flexDirection: { xs: "column", md: "row" }, // 🔥 main fix
    justifyContent: "space-between",
    alignItems: { xs: "stretch", md: "center" },
    mb: { xs: 3, md: 6 },
    gap: 2
  },

  stepActive: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    p: { xs: "10px 12px", md: "18px 36px" }, // 🔥 smaller on mobile
    background: "linear-gradient(90deg, #4F6CF8 0%, #637BFF 100%)",
    color: "#fff",
    borderRadius: { xs: 2, md: "0 60px 60px 0" },
    flex: 1,
    width: "100%"
  },

  stepDone: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    color: "#4F6CF8",
    flex: 1,
    p: { xs: "10px 12px", md: "18px 36px" },
    width: "100%"
  },

  stepFuture: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    color: "#B0BBD5",
    flex: 1,
    p: { xs: "10px 12px", md: "18px 36px" },
    width: "100%"
  },

  title: {
    color: "#4F6CF8",
    fontWeight: 800,
    fontSize: { xs: "1.5rem", md: "2.4rem" }, // 🔥 responsive text
    mb: { xs: 2, md: 4 }
  },

  subTitle: {
    color: "#333",
    fontWeight: 700,
    fontSize: { xs: "1rem", md: "1.3rem" },
    mb: 3,
    mt: 3
  },

  input: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      fontSize: { xs: "0.9rem", md: "1.1rem" },
      "& fieldset": { borderColor: "#E0E7FF" }
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: "0.9rem", md: "1.1rem" }
    }
  },

  saveBtn: {
    bgcolor: "#4F6CF8",
    color: "#fff",
    px: { xs: 3, md: 8 },
    py: { xs: 1.5, md: 2.2 },
    borderRadius: 3,
    fontWeight: 700,
    fontSize: { xs: "1rem", md: "1.2rem" },
    textTransform: "none",
    width: { xs: "100%", sm: "auto" }, // 🔥 full width mobile
    "&:hover": { bgcolor: "#3D56CA" }
  },
};

  return (
    <Box sx={styles.container}>
      <Paper sx={styles.paper} elevation={0}>
        <Box sx={styles.stepperBox}>
          <Box sx={currentStep > 1 ? styles.stepDone : styles.stepActive}>
            {currentStep > 1 ? <CheckCircleIcon sx={{ fontSize: { xs: 22, md: 40 } }} />: <Box sx={{ border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>01</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Personal info</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>General Details</Typography></Box>
          </Box>
          <Box sx={currentStep === 2 ? styles.stepActive : (currentStep > 2 ? styles.stepDone : styles.stepFuture)}>
            {currentStep > 2 ? <CheckCircleIcon sx={{ fontSize: { xs: 22, md: 40 } }} />: <Box sx={{ border: '2px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>02</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Professional & SEBI</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Credentials</Typography></Box>
          </Box>
          <Box sx={currentStep === 3 ? styles.stepActive : (currentStep > 3 ? styles.stepDone : styles.stepFuture)}>
            {currentStep > 3 ? <CheckCircleIcon sx={{ fontSize: { xs: 22, md: 40 } }} />: <Box sx={{ border: '1px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>03</Box>}
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Platform KYC</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Verification</Typography></Box>
          </Box>
          <Box sx={currentStep === 4 ? styles.stepActive : styles.stepFuture}>
            <Box sx={{ border: '1px solid', borderRadius: '50%', width: 35, height: 35, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>04</Box>
            <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Consent</Typography><Typography variant="caption" sx={{ fontSize: '0.9rem' }}>Declaration</Typography></Box>
          </Box>
        </Box>

         {/* STEP 1 */}
      {currentStep === 1 && (
  <Box>
    <Typography sx={styles.title}>
      Step 1: Basic Profile & Contact Information
    </Typography>

    <Grid container spacing={5}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography sx={styles.subTitle}>Personal Detail</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth sx={styles.input} error={errors.salutation}>
              <InputLabel>Salutation</InputLabel>
              <Select
                name="salutation"
                value={formData.salutation || ""}
                label="Salutation"
                onChange={handleSelect}
              >
                <MenuItem value="Mr">Mr.</MenuItem>
                <MenuItem value="Ms">Ms.</MenuItem>
              </Select>
              {errors.salutation && <FormHelperText>Required</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              name="first_name"
              label="First Name"
              sx={styles.input}
              value={formData.first_name || ""}
              onChange={handleChange}
              error={errors.first_name}
              helperText={errors.first_name ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              name="middle_name"
              label="Middle Name"
              sx={styles.input}
              value={formData.middle_name || ""}
              onChange={handleChange}
              error={errors.middle_name}
              helperText={errors.middle_name ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              name="surname"
              label="Surname"
              sx={styles.input}
              value={formData.surname || ""}
              onChange={handleChange}
              error={errors.surname}
              helperText={errors.surname ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              name="org_name"
              label="Organization Name"
              sx={styles.input}
              value={formData.org_name || ""}
              onChange={handleChange}
              error={errors.org_name}
              helperText={errors.org_name ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              name="designation"
              label="Designation"
              sx={styles.input}
              value={formData.designation || ""}
              onChange={handleChange}
              error={errors.designation}
              helperText={errors.designation ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="short_bio"
              label="Short Bio"
              sx={styles.input}
              value={formData.short_bio || ""}
              onChange={handleChange}
              error={errors.short_bio}
              helperText={errors.short_bio ? "Required" : ""}
            />
          </Grid>
        </Grid>

        <Typography sx={[styles.subTitle, { mt: 5 }]}>
          Contact Information
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              sx={styles.input}
              value={formData.email || ""}
              onChange={handleChange}
              error={errors.email}
              helperText={errors.email ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              name="mobile"
              label="Mobile"
              sx={styles.input}
              value={formData.mobile || ""}
              onChange={handleChange}
              error={errors.mobile}
              helperText={errors.mobile ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              name="telephone"
              label="Telephone"
              sx={styles.input}
              value={formData.telephone || ""}
              onChange={handleChange}
              error={errors.telephone}
              helperText={errors.telephone ? "Required" : ""}
            />
          </Grid>
        </Grid>

        <Typography sx={[styles.subTitle, { mt: 5 }]}>Address</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth sx={styles.input} error={errors.country}>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={formData.country || ""}
                label="Country"
                onChange={handleSelect}
              >
                <MenuItem value="India">India</MenuItem>
              </Select>
              {errors.country && <FormHelperText>Required</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth sx={styles.input} error={errors.state}>
              <InputLabel>State</InputLabel>
              <Select
                name="state"
                value={formData.state || ""}
                label="State"
                onChange={handleSelect}
              >
                <MenuItem value="Maharashtra">Maharashtra</MenuItem>
              </Select>
              {errors.state && <FormHelperText>Required</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth sx={styles.input} error={errors.city}>
              <InputLabel>City</InputLabel>
              <Select
                name="city"
                value={formData.city || ""}
                label="City"
                onChange={handleSelect}
              >
                <MenuItem value="Mumbai">Mumbai</MenuItem>
              </Select>
              {errors.city && <FormHelperText>Required</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              name="pincode"
              label="Pincode"
              sx={styles.input}
              value={formData.pincode || ""}
              onChange={handleChange}
              error={errors.pincode}
              helperText={errors.pincode ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              name="address_line1"
              label="Address Line 1"
              sx={styles.input}
              value={formData.address_line1 || ""}
              onChange={handleChange}
              error={errors.address_line1}
              helperText={errors.address_line1 ? "Required" : ""}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              name="address_line2"
              label="Address Line 2"
              sx={styles.input}
              value={formData.address_line2 || ""}
              onChange={handleChange}
              error={errors.address_line2}
              helperText={errors.address_line2 ? "Required" : ""}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* RIGHT SIDE (UNCHANGED) */}
      <Grid
        size={{ xs: 12, md: 4 }}
        sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 12 }}
      >
        <Avatar
          src={profileImage || ""}
          sx={{
            width: 240,
            height: 240,
            bgcolor: "#F0F2F5",
            border: "2px solid #E0E7FF",
            mb: 4,
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #E0E7FF",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Button
            component="label"
            sx={{
              bgcolor: "#E5E7EB",
              color: "#333",
              py: 1.5,
              px: 3,
              borderRadius: 0,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Choose File
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleProfileChange}
            />
          </Button>
          <Typography variant="body1" sx={{ px: 3, color: "#666" }}>
            {profileFileName}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Box>
)} 
        {currentStep === 2 && (
          <Box>
           <Typography sx={styles.title}>
  Step 2: Professional & SEBI Information
</Typography>

<Typography sx={styles.subTitle}>SEBI Registration</Typography>

<Grid container spacing={3} alignItems="center">

  <Grid size={{ xs: 12, md: 3 }}>
    <TextField
      fullWidth
      name="sebi_reg_no"
      label="SEBI Reg. No"
      sx={styles.input}
      value={formData.sebi_reg_no|| ""}
      onChange={handleChange}
      error={errors.sebi_reg_no}
      helperText={errors.sebi_reg_no ? "Required" : ""}
    />
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <TextField
      fullWidth
      type="date"
      name="sebi_start_date"
      label="Start Date"
      InputLabelProps={{ shrink: true }}
      sx={styles.input}
      value={formData.sebi_start_date || ""}
      onChange={handleChange}
      error={errors.sebi_start_date}
      helperText={errors.sebi_start_date ? "Required" : ""}
    />
  </Grid>

  <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'center' }}>
    to
  </Grid>

 <Grid size={{ xs: 12, md: 2 }}>
    <TextField
      fullWidth
      type="date"
      name="sebi_expiry_date"
      label="Expiry Date"
      InputLabelProps={{ shrink: true }}
      sx={styles.input}
      value={formData.sebi_expiry_date|| ""}
      onChange={handleChange}
      error={errors.sebi_expiry_date}
      helperText={errors.sebi_expiry_date ? "Required" : ""}
    />
  </Grid>

  {/* SEBI CERT */}
  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
      SEBI Certificate
    </Typography>

    <Button
      component="label"
      variant="contained"
      startIcon={
        fileLabels.sebiCert !== "No file chosen"
          ? <CheckCircleIcon />
          : <CloudUploadIcon />
      }
      sx={getDynamicUploadStyle(fileLabels.sebiCert)}
    >
      {fileLabels.sebiCert !== "No file chosen" ? "Uploaded" : "Upload Media"}

      <input
        type="file"
        hidden
        onChange={(e) => handleDocUpload(e, "sebiCert")}
      />
    </Button>

    <Typography variant="caption">
      {fileLabels.sebiCert}
    </Typography>
  </Grid>

  {/* SEBI RECEIPT */}
  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
      SEBI Receipt
    </Typography>

    <Button
      component="label"
      variant="contained"
      startIcon={
        fileLabels.sebiReceipt !== "No file chosen"
          ? <CheckCircleIcon />
          : <CloudUploadIcon />
      }
      sx={getDynamicUploadStyle(fileLabels.sebiReceipt)}
    >
      {fileLabels.sebiReceipt !== "No file chosen" ? "Uploaded" : "Upload Media"}

      <input
        type="file"
        hidden
        onChange={(e) => handleDocUpload(e, "sebiReceipt")}
      />
    </Button>

    <Typography variant="caption">
      {fileLabels.sebiReceipt}
    </Typography>
  </Grid>

</Grid>

{/* NISM */}

<Typography sx={[styles.subTitle, { mt: 6 }]}>
  NISM – Series XV: Research Analyst
</Typography>

<Grid container spacing={3} alignItems="center">

 <Grid size={{ xs: 12, md: 3 }}>
    <TextField
      fullWidth
      name="nism_reg_no"
      label="NISM Reg. No"
      sx={styles.input}
      value={formData.nism_reg_no || ""}
      onChange={handleChange}
      error={errors.nism_reg_no}
      helperText={errors.nism_reg_no ? "Required" : ""}
    />
  </Grid>
  
<Grid size={{ xs: 12, md: 3 }}>
    <TextField
      fullWidth
      type="date"
      name="nism_valid_till"
      label="Valid Till"
      InputLabelProps={{ shrink: true }}
      sx={styles.input}
      value={formData.nism_valid_till || ""}
      onChange={handleChange}
      error={errors.nism_valid_till}
      helperText={errors.nism_valid_till ? "Required" : ""}
    />
  </Grid>

  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
      NISM Certificate
    </Typography>

    <Button
      component="label"
      variant="contained"
      startIcon={
        fileLabels.nismCert !== "No file chosen"
          ? <CheckCircleIcon />
          : <CloudUploadIcon />
      }
      sx={getDynamicUploadStyle(fileLabels.nismCert)}
    >
      {fileLabels.nismCert !== "No file chosen" ? "Uploaded" : "Upload Media"}

      <input
        type="file"
        hidden
        onChange={(e) => handleDocUpload(e, "nismCert")}
      />
    </Button>

    <Typography variant="caption">
      {fileLabels.nismCert}
    </Typography>
  </Grid>

</Grid>

{/* PROFESSIONAL QUALIFICATION */}

<Typography sx={[styles.subTitle, { mt: 6 }]}>
  Professional Qualification
</Typography>

<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 4 }}>
    <FormControl fullWidth sx={styles.input} error={errors.academic_qualification}>
      <InputLabel>Academic Qualification</InputLabel>

      <Select
        name="academic_qualification"
        value={formData.academic_qualification || ""}
        label="Academic Qualification"
        onChange={handleSelect}
      >
        {academicOptions.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.professional_qualification}><InputLabel>Professional Qualification</InputLabel>
                  <Select name="professional_qualification" value={formData.professional_qualification} label="Professional Qualification" onChange={handleSelect}>
                    {professionalOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.market_experience}><InputLabel>Market Experience</InputLabel>
                  <Select name="market_experience" value={formData.market_experience} label="Market Experience" onChange={handleSelect}>
                    {["0–1 Year", "1–3 Years", "3–5 Years", "5–10 Years", "10–15 Years", "15+ Years"].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth sx={styles.input} error={errors.expertise}><InputLabel>Area of Expertise</InputLabel>
                  <Select name="expertise" value={formData.expertise} label="Area of Expertise" onChange={handleSelect}>
                    {["Stock/Equity", "Futures", "Options", "Long Term Trades", "Short Term Trades", "Intraday Trades"].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
    <Grid container spacing={3}>

      {/* BANK NAME */}
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
  <Autocomplete
    freeSolo
    options={bankOptions}
    
    value={formData.bank_name || ""} // always string
    
    onChange={(_, newValue) => {
      setFormData(prev => ({
        ...prev,
        bank_name: newValue || ""
      }));
      setErrors(prev => ({ ...prev, bank_name: false }));
    }}

    onInputChange={(_, newInputValue, reason) => {
      if (reason === "input") {
        setFormData(prev => ({
          ...prev,
          bank_name: newInputValue
        }));
      }
    }}

    renderInput={(params) => (
      <TextField
        {...params}
        name="bank_name"
        label="Bank Name"
        sx={styles.input}
        error={errors.bank_name}
        helperText={errors.bank_name ? "Required" : ""}
      />
    )}
  />
</Grid>

      {/* ACCOUNT HOLDER */}
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          name="account_holder"
          label="Account Holder Name"
          value={formData.account_holder || ""}
          onChange={handleChange}
          error={errors.account_holder}
          helperText={errors.account_holder ? "Required" : ""}
          sx={styles.input}
        />
      </Grid>

      {/* ACCOUNT NUMBER */}
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          name="account_number"
          label="Account Number"
          value={formData.account_number || ""}
          onChange={handleChange}
          error={errors.account_number}
          helperText={errors.account_number ? "Required" : ""}
          sx={styles.input}
        />
      </Grid>

      {/* IFSC */}
     
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          name="ifsc_code"
          label="IFSC Code"
          value={formData.ifsc_code || ""}
          onChange={handleChange}
          error={errors.ifsc_code}
          helperText={errors.ifsc_code ? "Required" : ""}
          sx={styles.input}
        />
      </Grid>

      {/* CANCELLED CHEQUE */}
      <Grid 
  size={{ xs: 12, md: 6 }} 
  sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' }, 
    alignItems: { xs: 'flex-start', sm: 'center' }, 
    gap: 2 
  }}
>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
          Cancelled Cheque
        </Typography>

        <Button
          component="label"
          variant="contained"
          startIcon={
            fileLabels.cancelledCheque !== "No file chosen"
              ? <CheckCircleIcon />
              : <CloudUploadIcon />
          }
          sx={getDynamicUploadStyle(fileLabels.cancelledCheque)}
        >
          {fileLabels.cancelledCheque !== "No file chosen"
            ? "Uploaded"
            : "Upload Media"}

          <input
            type="file"
            hidden
            onChange={(e) => handleDocUpload(e, "cancelledCheque")}
          />
        </Button>

        <Typography variant="caption">
          {fileLabels.cancelledCheque}
        </Typography>
      </Grid>
    </Grid>

    {/* ================= PAN ================= */}
    <Typography sx={[styles.subTitle, { mt: 6 }]}>
      Identity & Address Proof
    </Typography>

    <Grid container spacing={3} alignItems="center">

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          name="pan_number"
          label="PAN Number"
          value={formData.pan_number || ""}
          onChange={handleChange}
          error={errors.pan_number}
          helperText={errors.pan_number ? "Required" : ""}
          sx={styles.input}
        />
      </Grid>

      {/* PAN CARD */}
      <Grid 
  size={{ xs: 12, md: 6 }} 
  sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' }, 
    alignItems: { xs: 'flex-start', sm: 'center' }, 
    gap: 2 
  }}
>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
          PAN Card Upload
        </Typography>

        <Button
          component="label"
          variant="contained"
          startIcon={
            fileLabels.panCard !== "No file chosen"
              ? <CheckCircleIcon />
              : <CloudUploadIcon />
          }
          sx={getDynamicUploadStyle(fileLabels.panCard)}
        >
          {fileLabels.panCard !== "No file chosen"
            ? "Uploaded"
            : "Upload Media"}

          <input
            type="file"
            hidden
            onChange={(e) => handleDocUpload(e, "panCard")}
          />
        </Button>

        <Typography variant="caption">{fileLabels.panCard}</Typography>
      </Grid>
    </Grid>

    {/* ================= ADDRESS ================= */}
    <Grid container spacing={3} alignItems="center" sx={{ mt: 4 }}>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth sx={styles.input} error={errors.address_proof_type}>
          <InputLabel>Address Proof</InputLabel>

          <Select
            name="address_proof_type"
            value={formData.address_proof_type || ""}
            label="Address Proof"
            onChange={handleSelect}
          >
            <MenuItem value="Passport">Passport</MenuItem>
            <MenuItem value="Voter ID Card">Voter ID Card</MenuItem>
            <MenuItem value="Driving License">Driving License</MenuItem>
          </Select>

          {errors.address_proof_type  && <FormHelperText>Required</FormHelperText>}
        </FormControl>
      </Grid>

      {/* ADDRESS PROOF FILE */}
      <Grid 
  size={{ xs: 12, md: 6 }} 
  sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' }, 
    alignItems: { xs: 'flex-start', sm: 'center' }, 
    gap: 2 
  }}
>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
          Address Proof Upload
        </Typography>

        <Button
          component="label"
          variant="contained"
          startIcon={
            fileLabels.addressProofDoc !== "No file chosen"
              ? <CheckCircleIcon />
              : <CloudUploadIcon />
          }
          sx={getDynamicUploadStyle(fileLabels.addressProofDoc)}
        >
          {fileLabels.addressProofDoc !== "No file chosen"
            ? "Uploaded"
            : "Upload Media"}

          <input
            type="file"
            hidden
            onChange={(e) => handleDocUpload(e, "addressProofDoc")}
          />
        </Button>

        <Typography variant="caption">
          {fileLabels.addressProofDoc}
        </Typography>
      </Grid>
    </Grid>

    {/* ================= DECLARATION ================= */}
    <Typography sx={[styles.subTitle, { mt: 6 }]}>Declaration</Typography>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.declare_info_true || false}
            onChange={handleChange}
            name="declare_info_true"
          />
        }
        label="I hereby declare that all information and documents provided by me are true, complete, and accurate."
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.consent_verification|| false}
            onChange={handleChange}
           name="consent_verification"
          />
        }
        label="I consent to verification by the platform."
      />
    </Box>
  </Box>
)}
       {currentStep === 4 && (
  <Box>
    <Typography sx={styles.title}>
      Step 4: Declarations, Disclosures & Consent
    </Typography>

    {/* ================= DECLARATIONS ================= */}
   <Box sx={{ mt: 6 }}>
  {[
    {
      name: "no_guaranteed_returns",
      title: "No Guaranteed Returns Declaration",
      label:
        "I confirm that I do not offer, promise, or guarantee any assured or fixed returns on investments, directly or indirectly."
    },
    {
      name: "conflict_of_interest",
      title: "Conflict of Interest Disclosure",
      label:
        "I declare that I have disclosed all actual and potential conflicts of interest, including financial, personal, or professional interests that may influence my research or recommendations."
    },
    {
      name: "personal_trading",
      title: "Personal Trading Disclosure",
      label:
        "I confirm that I have disclosed my personal trading positions in accordance with SEBI Research Analyst Regulations and that my personal trades do not conflict with client interests."
    },
    {
      name: "sebi_compliance",
      title: "SEBI Compliance Acceptance",
      label:
        "I agree to comply with all applicable provisions of the SEBI (Research Analysts) Regulations, circulars, guidelines, and amendments issued from time to time."
    },
    {
      name: "platform_policy",
      title: "Platform Content Policy Acceptance",
      label:
        "I have read and agree to abide by the Platform Content Policy, Research Publishing Guidelines, and Terms of Use."
    }
  ].map((item, index) => (
    <Box key={item.name} sx={{ mb: 3 }}>
      
      <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", md: "1.2rem" } }}>
        {item.title}
      </Typography>

      <FormControlLabel
        sx={{ mt: 1, alignItems: "flex-start" }}
        control={
          <Checkbox
            name={item.name}
            checked={
              formData[item.name as keyof typeof formData] === true ||
              formData[item.name as keyof typeof formData] === "true"
            }
            onChange={handleChange}
          />
        }
        label={
          <Typography sx={{ color: "#666", fontSize: "0.9rem" }}>
            {item.label}
          </Typography>
        }
      />

      {index !== 4 && <Divider sx={{ mt: 2 }} />}
    </Box>
  ))}
</Box>

    {/* ================= DISCLAIMER ================= */}
    <Typography
      variant="body2"
      sx={{ textAlign: "center", mt: 4, fontWeight: 600, color: "#333" }}
    >
      Research Analyst's Disclaimer is not included
    </Typography>

    {/* ================= CUSTOM DISCLOSURE ================= */}
    <Box sx={{ mt: 4 }}>
      <Typography sx={styles.subTitle}>
        Add your custom Disclosure
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={4}
        name="additional_comments"
        label="Disclaimer Text"
        placeholder="Type your official disclaimer here.."
        sx={styles.input}
        value={formData.additional_comments || ""}
        onChange={handleChange}
      />
    </Box>
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

export default RegistrationPage;