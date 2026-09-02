import { Alert, Button, Stack, Typography } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useNavigate } from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";
import { getRegistrationSession } from "../session";

const RegistrationUnderReviewPage = () => {
  const navigate = useNavigate();
  const session = getRegistrationSession();
  const loginRoute = session?.audienceType === "BROKER"
    ? "/broker/login"
    : session?.audienceType === "CLIENT"
      ? "/client/login"
      : "/login";

  return (
    <RegistrationStatusLayout
      icon={HourglassTopIcon}
      title="Registration under review"
      description="Your payment has been received and your registration is waiting for Admin review."
      details={
        <Stack spacing={1.5} width="100%">
          <Alert severity="info">
            A password setup link will be provided by email after the administrator approves the registration.
          </Alert>
          {session?.applicationId && <Typography variant="body2">Application reference: <strong>{session.applicationId}</strong></Typography>}
        </Stack>
      }
      actionLabel="Go to home"
      onAction={() => navigate("/")}
      secondaryActions={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => navigate(loginRoute)}>Go to login</Button>
          <Button component="a" href={`mailto:support@tarkashh.com?subject=Registration%20status&body=Application%20reference:%20${session?.applicationId || "unknown"}`}>Contact support</Button>
        </Stack>
      }
    />
  );
};

export default RegistrationUnderReviewPage;
