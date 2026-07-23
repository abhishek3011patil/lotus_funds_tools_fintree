import { Alert } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";

type LocationState = {
  message?: string;
};

const RegistrationPaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | LocationState
    | null;

  return (
    <RegistrationStatusLayout
      icon={ErrorOutlineIcon}
      title="Payment failed"
      description="The payment was not completed. No subscription has been activated."
      details={
        state?.message ? (
          <Alert severity="error">
            {state.message}
          </Alert>
        ) : undefined
      }
      actionLabel="Try payment again"
      onAction={() =>
        navigate("/register/checkout", {
          replace: true,
        })
      }
    />
  );
};

export default RegistrationPaymentFailedPage;
