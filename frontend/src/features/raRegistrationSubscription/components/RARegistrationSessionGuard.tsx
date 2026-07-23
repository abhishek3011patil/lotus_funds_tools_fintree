import { useMemo, type ReactNode } from "react";
import {
  Alert,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  getRARegistrationSession,
  isRARegistrationSessionExpired,
} from "../session";
import type { RARegistrationSession } from "../types";
import RARegistrationFlowLayout from "./RARegistrationFlowLayout";

export interface RARegistrationSessionGuardProps {
  children: (session: RARegistrationSession) => ReactNode;
}

type SessionState =
  | { kind: "missing" }
  | { kind: "expired" }
  | { kind: "valid"; session: RARegistrationSession };

const RARegistrationSessionGuard = ({
  children,
}: RARegistrationSessionGuardProps) => {
  const sessionState = useMemo<SessionState>(() => {
    const session = getRARegistrationSession();

    if (!session) {
      return { kind: "missing" };
    }

    if (isRARegistrationSessionExpired(session)) {
      return { kind: "expired" };
    }

    return { kind: "valid", session };
  }, []);

  if (sessionState.kind === "valid") {
    return <>{children(sessionState.session)}</>;
  }

  const expired = sessionState.kind === "expired";

  return (
    <RARegistrationFlowLayout
      maxWidth="sm"
      stepText="Research Analyst registration"
      title={
        expired
          ? "Your registration session has expired"
          : "Registration session not found"
      }
      subtitle="For your security, subscription selection is available only from the registration session in this browser tab."
    >
      <Stack spacing={3}>
        <Alert severity={expired ? "warning" : "info"}>
          {expired
            ? "Please submit the Research Analyst registration form again to receive a new secure session."
            : "Start a new Research Analyst registration, or go to login if your account is already active."}
        </Alert>

        <Typography
          variant="body2"
          sx={{ color: "#5d6b7e" }}
        >
          No registration access token is displayed or added to
          the page address.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
        >
          <Button
            component={RouterLink}
            to="/registration"
            variant="contained"
            size="large"
          >
            Register again
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
          >
            Go to login
          </Button>
        </Stack>
      </Stack>
    </RARegistrationFlowLayout>
  );
};

export default RARegistrationSessionGuard;
