import { Navigate, useLocation } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import axios from "axios";
import LoadingPage from "../common/LoadingPage";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const [status, setStatus] = useState<"loading" | "unauth" | "forbidden" | "allowed">("loading");
  const location = useLocation();

  const publicRoutes = ["/set-password"];

  if (publicRoutes.some((route) => location.pathname.startsWith(route))) {
    return children;
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("unauth"); // ❌ not logged in
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userRole = res.data.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          setStatus("forbidden"); // ❌ wrong role
        } else {
          setStatus("allowed"); // ✅ correct
        }
      })
      .catch(() => {
        localStorage.clear();
        setStatus("unauth");
      });
  }, []);

  // Keep route-guard flow blocked until auth validation is complete.
  if (status === "loading") {
    return (
      <LoadingPage
        title="Checking access"
        subtitle="Please wait while we verify your session."
      />
    );
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/" replace />; // ✅ redirect to dashboard
  }

  return children;
};

export default ProtectedRoute;