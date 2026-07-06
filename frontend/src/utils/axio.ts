import axios from "axios";

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
            window.location.pathname !== "/login"
        ) {

            const role = localStorage.getItem("role");

            localStorage.removeItem("token");
            localStorage.removeItem("tokenExpiry");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            if (
                role === "ADMIN" ||
                role === "SUPER_ADMIN" ||
                role === "EMPLOYEE"
            ) {
                window.location.href = "/login-admin";
            } else {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default instance;