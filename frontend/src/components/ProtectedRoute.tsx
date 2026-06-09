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
        const userRole = res.data.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          setStatus("forbidden");
        } else {
          setStatus("allowed");
        }
      })
      .catch(() => {
        localStorage.clear();
        setStatus("unauth");
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