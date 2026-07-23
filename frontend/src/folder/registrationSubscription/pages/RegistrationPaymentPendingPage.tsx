import { Alert } from "@mui/material";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";

type LocationState = {
  message?: string;
};

const RegistrationPaymentPendingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | LocationState
    | null;

  return (
    <RegistrationStatusLayout
      icon={PendingActionsIcon}
      title="Payment verification pending"
      description="We could not confirm the final payment status in the current request. Do not make another payment until the status is checked."
      details={
        <Alert severity="warning">
          {state?.message ||
            "The backend or Razorpay webhook should reconcile this payment."}
        </Alert>
      }
      actionLabel="Go to home"
      onAction={() => navigate("/")}
    />
  );
};

export default RegistrationPaymentPendingPage;
