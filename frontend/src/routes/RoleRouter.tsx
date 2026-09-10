import { Navigate } from "react-router-dom";
import { getDefaultRouteForRole } from "../utils/role.utils";

const RoleRouter = () => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || !role) {
        return <Navigate to="/login" replace />;
    }

    const path = getDefaultRouteForRole(role);

    return <Navigate to={path} replace />;
};

export default RoleRouter;
