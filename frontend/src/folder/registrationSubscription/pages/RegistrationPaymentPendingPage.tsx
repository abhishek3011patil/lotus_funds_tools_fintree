import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";
import { getRegistrationPaymentStatus } from "../api";
import { getRegistrationSession } from "../session";
import { useMemo, useState } from "react";

type LocationState = {
  message?: string;
};

const RegistrationPaymentPendingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMemo(() => getRegistrationSession(), []);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const state = location.state as
    | LocationState
    | null;

  const checkStatus = async () => {
    if (!session || checking) return;
    setChecking(true);
    setStatusMessage("");
    try {
      const result = await getRegistrationPaymentStatus(session.applicationId, session.registrationToken);
      if (["PAID_PENDING_APPROVAL", "APPROVED"].includes(result.registrationStatus) || result.payment?.status === "PAID") {
        navigate("/register/under-review", { replace: true });
        return;
      }
      if (["FAILED", "PAYMENT_FAILED"].includes(result.payment?.status || result.registrationStatus)) {
        navigate("/register/payment-failed", { replace: true, state: { message: "The payment provider reported that this payment failed." } });
        return;
      }
      setStatusMessage(`Current payment status: ${result.payment?.status || result.registrationStatus}. Please check again later.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to check the payment status.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <RegistrationStatusLayout
      icon={PendingActionsIcon}
      title="Payment verification pending"
      description="We could not confirm the final payment status in the current request. Do not make another payment until the status is checked."
      details={
        <Stack spacing={1.5} width="100%">
          <Alert severity="warning">
            {state?.message || "The payment provider is still reconciling this payment."}
          </Alert>
          {session?.applicationId && <Typography variant="body2">Application reference: <strong>{session.applicationId}</strong></Typography>}
          {statusMessage && <Alert severity="info">{statusMessage}</Alert>}
        </Stack>
      }
      actionLabel={checking ? "Checking..." : "Check payment status"}
      onAction={() => void checkStatus()}
      secondaryActions={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/")}>Go to home</Button>
          <Button component="a" href={`mailto:support@tarkashh.com?subject=Payment%20status%20help&body=Application%20reference:%20${session?.applicationId || "unknown"}`}>Contact support</Button>
          {checking && <CircularProgress size={20} />}
        </Stack>
      }
    />
  );
};

export default RegistrationPaymentPendingPage;
