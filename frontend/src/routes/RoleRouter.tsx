import { Navigate, useLocation } from "react-router-dom";

const roleRoutes: Record<string, string> = {
    ADMIN: "/admin",
    EMPLOYEE: "/automation",
    RA: "/",
    BROKER: "/broker",
    CLIENT: "/client",
};

const RoleRouter = () => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || !role) {
        return <Navigate to="/login" replace />;
    }

    const path = roleRoutes[role];

    return path ? <Navigate to={path} replace /> : <Navigate to="/login" replace />;
};

export default RoleRouter;