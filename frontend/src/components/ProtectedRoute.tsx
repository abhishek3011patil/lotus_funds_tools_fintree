import { Navigate } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import axios from "axios";
import LoadingPage from "../common/LoadingPage";
import { getDefaultRouteForRole, normalizeRole } from "../utils/role.utils";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const [status, setStatus] = useState<
    "loading" | "unauth" | "forbidden" | "allowed"
  >(token ? "loading" : "unauth");
  const [redirectPath, setRedirectPath] = useState("/");
  const allowedRolesKey = allowedRoles?.join("|");

  useEffect(() => {
    if (!token) {
      return;
    }
    const normalizedAllowedRoles = allowedRolesKey?.split("|").map(normalizeRole);

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userRole = normalizeRole(res.data.role);
        if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
          setRedirectPath(getDefaultRouteForRole(userRole));
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

  // ✅ Do NOT logout on CORS/network/dev tunnel error
  console.error("Auth check failed, but not logging out:", message || error.message);
  const storedRole = normalizeRole(localStorage.getItem("role"));
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(storedRole)) {
    setRedirectPath(getDefaultRouteForRole(storedRole));
    setStatus("forbidden");
  } else {
    setStatus("allowed");
  }
});
  }, [allowedRolesKey, token]);

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
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
