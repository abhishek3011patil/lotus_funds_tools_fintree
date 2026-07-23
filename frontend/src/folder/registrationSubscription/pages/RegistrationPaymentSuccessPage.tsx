import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";
import { clearPaymentOrder } from "../session";

const RegistrationPaymentSuccessPage = () => {
  const navigate = useNavigate();

  const continueToReview = () => {
    clearPaymentOrder();
    navigate("/register/under-review", {
      replace: true,
    });
  };

  return (
    <RegistrationStatusLayout
      icon={CheckCircleOutlineIcon}
      title="Payment verified"
      description="Your payment was verified successfully. Your account is not active yet because Admin approval is still required."
      actionLabel="Continue"
      onAction={continueToReview}
    />
  );
};

export default RegistrationPaymentSuccessPage;
