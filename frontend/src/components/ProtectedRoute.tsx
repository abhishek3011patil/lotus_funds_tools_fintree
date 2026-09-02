import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { JSX, useCallback, useEffect, useState } from "react";
import axios from "axios";
import LoadingPage from "../common/LoadingPage";
import { getLoginRoute } from "../utils/authRedirect";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "unauth" | "forbidden" | "error" | "allowed"
  >("loading");

  const verifyAccess = useCallback(() => {
    setStatus("loading");
    const token = localStorage.getItem("token");

    if (!token) {
      sessionStorage.setItem("postLoginPath", `${location.pathname}${location.search}`);
      setStatus("unauth");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userRole = res.data.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          setStatus("forbidden");
        } else {
          setStatus("allowed");
        }
      })
      .catch((error) => {
  const statusCode = error?.response?.status;
  const message = error?.response?.data?.message;

  // ✅ Only logout when backend actually says unauthorized
  if (statusCode === 401) {
    localStorage.clear();
    setStatus("unauth");
    return;
  }

  console.error("Auth check failed:", message || error.message);
  setStatus("error");
});
  }, [allowedRoles, location.pathname, location.search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Verify the stored session whenever the protected destination changes.
    verifyAccess();
  }, [verifyAccess]);

  if (status === "loading") {
    return (
      <LoadingPage
        title="Loading"
        subtitle="Checking your access..."
        fullScreen
      />
    );
  }

  if (status === "unauth") {
    const role = localStorage.getItem("role");
    return <Navigate to={getLoginRoute(role, allowedRoles)} replace />;
  }

  if (status === "forbidden") {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fe", display: "grid", placeItems: "center", p: 2 }}>
        <Paper sx={{ maxWidth: 520, p: 4, textAlign: "center", borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={800}>Access denied</Typography>
          <Typography color="text.secondary" mt={1}>Your account does not have permission to open this page.</Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/", { replace: true })}>Go to home</Button>
        </Paper>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fe", display: "grid", placeItems: "center", p: 2 }}>
        <Stack component={Paper} spacing={2} sx={{ maxWidth: 560, p: 4, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={800}>We could not verify your session</Typography>
          <Alert severity="warning">Check your connection and try again. This page remains locked until access can be verified.</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={verifyAccess}>Retry</Button>
            <Button variant="outlined" onClick={() => navigate("/", { replace: true })}>Go to home</Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
