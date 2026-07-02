import { Box, Button, Stack } from "@mui/material";

type Props = {
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  finalStep?: number;
};

const RARegistrationDevTools = ({
  setForm,
  setStep,
  finalStep = 7,
}: Props) => {
  const fillRAData = () => {
    const now = Date.now();
    const last4 = String(now).slice(-4);
    const last6 = String(now).slice(-6);
    const last8 = String(now).slice(-8);

    setForm((prev: any) => ({
      ...prev,

      salutation: "Mr",
      first_name: "Test",
      middle_name: "Dev",
      surname: "RA",
      email: `testra${now}@mail.com`,
      mobile: `98${last8}`,
      telephone: "02212345678",

      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      address_line1: "Test Address Line 1",
      address_line2: "Test Address Line 2",

      designation: "Research Analyst",
      market_experience: "5",
      short_bio: "This is a development test RA profile.",

      sebi_reg_no: `INH000${last6}`,
      sebi_start_date: "2024-01-01",
      sebi_expiry_date: "2027-01-01",

      pan_number: `ABCDE${last4}F`,
      address_proof_type: "Aadhaar",

      bank_name: "HDFC Bank",
      account_holder: "Test Dev RA",
      account_number: `12345678${last4}`,
      ifsc_code: "HDFC0001234",

      academic_qualification: "MBA Finance",
      professional_qualification: "NISM Research Analyst",
      expertise: ["Equity", "F&O"],
      markets: ["NSE", "BSE"],

      no_guaranteed_returns: true,
      declare_info_true: true,
      conflict_of_interest: true,
      consent_verification: true,
      personal_trading: true,
      sebi_compliance: true,
      platform_policy: true,

      website_url: "https://example.com",
      linkedin_url: "https://linkedin.com/in/test",
      twitter_url: "https://x.com/test",

      additional_comments: "Development test registration.",
    }));
  };

  const fillAndGoFinal = () => {
    fillRAData();
    setStep(finalStep);
  };

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px dashed #999", borderRadius: 2 }}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button variant="outlined" color="secondary" onClick={fillRAData}>
          Dev Fill RA Data
        </Button>

        <Button variant="contained" color="secondary" onClick={fillAndGoFinal}>
          Dev Fill & Go Final
        </Button>
      </Stack>
    </Box>
  );
};

export default RARegistrationDevTools;