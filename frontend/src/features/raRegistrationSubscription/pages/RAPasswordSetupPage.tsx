import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  completeRAPasswordSetup,
  RegistrationApiError,
  validateRAPasswordSetupToken,
} from "../api";
import RARegistrationFlowLayout from "../components/RARegistrationFlowLayout";
import { clearRARegistrationSession } from "../session";
import type { PasswordSetupAccount } from "../types";

type SetupFailureKind = "invalid" | "expired" | "used";

type SetupState =
  | { kind: "validating" }
  | {
      kind: SetupFailureKind;
      message: string;
    }
  | {
      kind: "valid" | "submitting";
      account: PasswordSetupAccount;
    }
  | {
      kind: "success";
      message: string;
    };

interface PasswordErrors {
  password?: string;
  confirmPassword?: string;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException &&
  error.name === "AbortError";

const classifySetupFailure = (
  message: string,
  code?: string
): SetupFailureKind => {
  const value = `${code ?? ""} ${message}`.toLowerCase();

  if (value.includes("expir")) {
    return "expired";
  }

  if (
    value.includes("already") ||
    value.includes("used") ||
    value.includes("revok") ||
    value.includes("completed")
  ) {
    return "used";
  }

  return "invalid";
};

const getFailureState = (
  error: unknown,
  fallback: string
): SetupState => {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : fallback;
  const code =
    error instanceof RegistrationApiError
      ? error.code
      : undefined;

  return {
    kind: classifySetupFailure(message, code),
    message,
  };
};

const validatePasswords = (
  password: string,
  confirmPassword: string
): PasswordErrors => {
  const errors: PasswordErrors = {};

  if (password.length < 8) {
    errors.password =
      "Password must contain at least 8 characters.";
  } else if (!/[A-Za-z]/.test(password)) {
    errors.password =
      "Password must contain at least one letter.";
  } else if (!/\d/.test(password)) {
    errors.password =
      "Password must contain at least one number.";
  }

  if (!confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword =
      "Password and confirmation do not match.";
  }

  return errors;
};

const RAPasswordSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token")?.trim() ?? "";
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const submitControllerRef =
    useRef<AbortController | null>(null);
  const [state, setState] = useState<SetupState>({
    kind: "validating",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [errors, setErrors] =
    useState<PasswordErrors>({});
  const [submitError, setSubmitError] = useState<
    string | null
  >(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      submitControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setSubmitError(null);

    if (!token) {
      setState({
        kind: "invalid",
        message:
          "This password setup link is missing its one-time token.",
      });
      return () => {
        active = false;
        controller.abort();
      };
    }

    setState({ kind: "validating" });

    void validateRAPasswordSetupToken(
      token,
      controller.signal
    )
      .then((result) => {
        if (!active || !mountedRef.current) {
          return;
        }

        if (result.success === true) {
          setState({
            kind: "valid",
            account: result.account,
          });
          return;
        }

        const message =
          result.message ||
          "This password setup link is not valid.";
        setState({
          kind: classifySetupFailure(
            message,
            result.code
          ),
          message,
        });
      })
      .catch((error: unknown) => {
        if (
          !active ||
          !mountedRef.current ||
          isAbortError(error)
        ) {
          return;
        }

        setState(
          getFailureState(
            error,
            "Unable to validate this password setup link."
          )
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      state.kind !== "valid" ||
      submittingRef.current
    ) {
      return;
    }

    const validationErrors = validatePasswords(
      password,
      confirmPassword
    );
    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    const account = state.account;
    const controller = new AbortController();
    submitControllerRef.current = controller;
    setState({ kind: "submitting", account });

    try {
      const response = await completeRAPasswordSetup(
        token,
        password,
        confirmPassword,
        controller.signal
      );

      if (
        !response.success ||
        response.accountStatus !== "active"
      ) {
        throw new RegistrationApiError(
          "The server did not confirm account activation.",
          200,
          "INVALID_PASSWORD_SETUP_RESPONSE",
          response
        );
      }

      clearRARegistrationSession();

      if (mountedRef.current) {
        setPassword("");
        setConfirmPassword("");
        setState({
          kind: "success",
          message: response.message,
        });
      }
    } catch (error: unknown) {
      if (
        isAbortError(error) ||
        !mountedRef.current
      ) {
        return;
      }

      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Unable to create your password.";
      const failureKind = classifySetupFailure(
        message,
        error instanceof RegistrationApiError
          ? error.code
          : undefined
      );

      if (
        failureKind === "expired" ||
        failureKind === "used"
      ) {
        setState({ kind: failureKind, message });
      } else {
        setState({ kind: "valid", account });
        setSubmitError(message);
      }
    } finally {
      if (submitControllerRef.current === controller) {
        submitControllerRef.current = null;
      }
      submittingRef.current = false;
    }
  };

  const title =
    state.kind === "success"
      ? "Your account is active"
      : "Create your Research Analyst password";

  return (
    <RARegistrationFlowLayout
      maxWidth="sm"
      stepText="Secure account activation"
      title={title}
      subtitle={
        state.kind === "success"
          ? "Password setup is complete. You can now sign in."
          : "Use the one-time approval link from your email to create your password."
      }
    >
      {state.kind === "validating" && (
        <Stack
          alignItems="center"
          spacing={1.5}
          sx={{ py: 6 }}
          role="status"
          aria-live="polite"
        >
          <CircularProgress size={34} />
          <Typography color="text.secondary">
            Validating your secure setup link…
          </Typography>
        </Stack>
      )}

      {(state.kind === "invalid" ||
        state.kind === "expired" ||
        state.kind === "used") && (
        <Stack spacing={3}>
          <Alert
            severity={
              state.kind === "expired" ? "warning" : "error"
            }
          >
            {state.message}
          </Alert>
          <Typography
            variant="body2"
            sx={{ color: "#5d6b7e", lineHeight: 1.7 }}
          >
            {state.kind === "expired"
              ? "The link can no longer be used. Contact support or an administrator for a new password setup link."
              : state.kind === "used"
                ? "This one-time link has already been used or revoked. Try signing in if your password was created, or contact support."
                : "Open the complete link from the approval email. If the problem continues, contact support."}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
            >
              Go to login
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
            >
              Return home
            </Button>
          </Stack>
        </Stack>
      )}

      {(state.kind === "valid" ||
        state.kind === "submitting") && (
        <Stack
          component="form"
          spacing={2.5}
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#f8fbff",
              borderColor: "#dbe8f5",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Approved account
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 0.5,
                color: "#172b4d",
                fontWeight: 700,
              }}
            >
              {state.account.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.25, color: "#5d6b7e" }}
            >
              {state.account.email}
            </Typography>
          </Paper>

          {submitError && (
            <Alert severity="error" aria-live="polite">
              {submitError}
            </Alert>
          )}

          <Box>
            <TextField
              fullWidth
              required
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }
              }}
              error={Boolean(errors.password)}
              helperText={
                errors.password ||
                "At least 8 characters, including one letter and one number."
              }
              autoComplete="new-password"
              disabled={state.kind === "submitting"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <TextField
            fullWidth
            required
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (errors.confirmPassword) {
                setErrors((current) => ({
                  ...current,
                  confirmPassword: undefined,
                }));
              }
            }}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            autoComplete="new-password"
            disabled={state.kind === "submitting"}
          />

          <Button
            type="submit"
            size="large"
            variant="contained"
            disabled={state.kind === "submitting"}
            startIcon={
              state.kind === "submitting" ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                  aria-hidden="true"
                />
              ) : undefined
            }
            sx={{ minHeight: 48, fontWeight: 800 }}
          >
            {state.kind === "submitting"
              ? "Activating account…"
              : "Create password"}
          </Button>
        </Stack>
      )}

      {state.kind === "success" && (
        <Stack spacing={3}>
          <Alert severity="success">
            {state.message ||
              "Your password was created and your account is active."}
          </Alert>
          <Typography
            variant="body1"
            sx={{ color: "#52637a", lineHeight: 1.75 }}
          >
            Sign in with your new password. After login, the
            Research Analyst should be sent to{" "}
            <strong>/recommendations</strong> to start creating
            research calls.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() =>
              navigate("/login", { replace: true })
            }
            sx={{ minHeight: 48, fontWeight: 800 }}
          >
            Login and start creating calls
          </Button>
        </Stack>
      )}
    </RARegistrationFlowLayout>
  );
};

export default RAPasswordSetupPage;
