import axios from "axios";
import { getLoginRoute, isLoginRoute } from "./authRedirect";

const instance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

/* ================= REQUEST INTERCEPTOR ================= */

instance.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/* ================= RESPONSE INTERCEPTOR ================= */

instance.interceptors.response.use(

    (response) => response,

    (error) => {

        if (
            error.response?.status === 401 &&
            !isLoginRoute(window.location.pathname)
        ) {

            const role = localStorage.getItem("role");

            sessionStorage.setItem("authMessage", "Your session expired. Please sign in again.");
            sessionStorage.setItem("postLoginPath", `${window.location.pathname}${window.location.search}`);

            localStorage.removeItem("token");
            localStorage.removeItem("tokenExpiry");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = getLoginRoute(role);
        }

        return Promise.reject(error);
    }
);

export default instance;
