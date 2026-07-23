import {
  Alert,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import RARegistrationFlowLayout from "../components/RARegistrationFlowLayout";
import { getRARegistrationSession } from "../session";

const RAUnderReviewPage = () => {
  const session = getRARegistrationSession();
  const paymentVerified =
    session?.paymentStatus ===
    "PAID_PENDING_APPROVAL";

  return (
    <RARegistrationFlowLayout
      maxWidth="md"
      stepText="Step 3 of 3 · Admin review"
      title={
        paymentVerified
          ? "Payment verified — review pending"
          : "Registration submitted"
      }
      subtitle={
        paymentVerified
          ? "Your Research Analyst registration and subscription payment are now waiting for Admin approval."
          : "Your registration has been submitted. Sign-in access depends on Admin approval and password creation."
      }
    >
      <Stack spacing={3}>
        <Alert
          severity={paymentVerified ? "success" : "info"}
        >
          {paymentVerified
            ? "Your payment was verified by the backend. This does not activate your account yet."
            : "This browser does not have a verified-payment status for this registration, so payment success is not being claimed here."}
        </Alert>

        <Stack spacing={1.5}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ color: "#172b4d", fontWeight: 800 }}
          >
            What happens next
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#52637a", lineHeight: 1.75 }}
          >
            Admin will review the application. Until approval,
            the account is not active and the Research Analyst
            cannot log in or publish research calls.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#52637a", lineHeight: 1.75 }}
          >
            After approval, a one-time password setup link is
            sent by email. Complete that link to create the
            password and activate the account.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#52637a", lineHeight: 1.75 }}
          >
            Login will work only after both Admin approval and
            password creation. Once active, the Research Analyst
            can sign in and continue to the recommendations
            workspace.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
        >
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
          >
            Go to login
          </Button>
          <Button
            component={RouterLink}
            to="/"
            variant="outlined"
            size="large"
          >
            Return home
          </Button>
        </Stack>
      </Stack>
    </RARegistrationFlowLayout>
  );
};

export default RAUnderReviewPage;
