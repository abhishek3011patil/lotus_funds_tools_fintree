import { Alert } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useNavigate } from "react-router-dom";
import RegistrationStatusLayout from "../components/RegistrationStatusLayout";

const RegistrationUnderReviewPage = () => {
  const navigate = useNavigate();

  return (
    <RegistrationStatusLayout
      icon={HourglassTopIcon}
      title="Registration under review"
      description="Your payment has been received and your registration is waiting for Admin review."
      details={
        <Alert severity="info">
          A password setup link will be provided only
          after the administrator approves the
          registration.
        </Alert>
      }
      actionLabel="Go to home"
      onAction={() => navigate("/")}
    />
  );
};

export default RegistrationUnderReviewPage;
