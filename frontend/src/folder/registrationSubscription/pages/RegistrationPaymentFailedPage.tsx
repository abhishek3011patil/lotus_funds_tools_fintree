import { Alert, Button, Stack, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";
import { getRegistrationSession } from "../session";

type LocationState = {
  message?: string;
};

const RegistrationPaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getRegistrationSession();
  const state = location.state as
    | LocationState
    | null;

  return (
    <RegistrationStatusLayout
      icon={ErrorOutlineIcon}
      title="Payment failed"
      description="The payment was not completed. No subscription has been activated."
      details={
        <Stack spacing={1.5} width="100%">
          {state?.message && <Alert severity="error">{state.message}</Alert>}
          {session?.applicationId && <Typography variant="body2">Application reference: <strong>{session.applicationId}</strong></Typography>}
        </Stack>
      }
      actionLabel="Try payment again"
      onAction={() =>
        navigate("/register/checkout", {
          replace: true,
        })
      }
      secondaryActions={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/register/subscription")}>Change plan</Button>
          <Button onClick={() => navigate("/")}>Go to home</Button>
          <Button component="a" href="mailto:support@tarkashh.com?subject=Registration%20payment%20help">Contact support</Button>
        </Stack>
      }
    />
  );
};

export default RegistrationPaymentFailedPage;
