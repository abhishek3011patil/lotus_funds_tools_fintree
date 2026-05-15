import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";

function App() {

  useEffect(() => {

    const logoutUser = () => {

      const role = localStorage.getItem("role");

      // ✅ Clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("username");
      localStorage.removeItem("role");

      // ✅ Redirect based on role
      if (
        role === "ADMIN" ||
        role === "SUPER_ADMIN" ||
        role === "EMPLOYEE"
      ) {

        window.location.href = "/login-admin";

      } else {

        window.location.href = "/login";
      }
    };

    const checkTokenExpiry = () => {

      const expiry = localStorage.getItem("tokenExpiry");

      // no expiry stored
      if (!expiry) return;

      console.log("CHECKING EXPIRY:", expiry);

      // token expired
      if (Date.now() > Number(expiry)) {

        console.log("TOKEN EXPIRED");

        logoutUser();
      }
    };

    // ✅ Run immediately
    checkTokenExpiry();

    // ✅ Check every second
    const interval = setInterval(checkTokenExpiry, 1000);

    return () => clearInterval(interval);

  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;