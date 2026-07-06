import { Navigate } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import axios from "axios";
import LoadingPage from "../common/LoadingPage";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const [status, setStatus] = useState<
    "loading" | "unauth" | "forbidden" | "allowed"
  >("loading");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("unauth");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
  console.log("ME API RESPONSE:", res.data);

  const userRole = res.data.role;
  console.log("USER ROLE:", userRole);

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

  // ✅ Do NOT logout on CORS/network/dev tunnel error
  console.error("Auth check failed, but not logging out:", message || error.message);
  setStatus("allowed");
});
  }, [allowedRoles]);

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
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;