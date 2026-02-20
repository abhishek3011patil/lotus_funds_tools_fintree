import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

interface Props {
    children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsValid(false);
            return;
        }

        axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(() => {
                setIsValid(true);
            })
            .catch(() => {
                localStorage.clear();
                setIsValid(false);
            });

    }, []);

    // While checking token
    if (isValid === null) {
        return <div>Loading...</div>;
    }

    // If invalid
    if (!isValid) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
