import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import Signup from "../pages/common/Signup";
import RegistrationPage from "../Registration_pages/RegistrationPage";
import Recommendations from "../pages/Recomendation";
import Performance from "../pages/Performance";
import AutomationLayout from "../components/layout_automation/AppLayout";
import AdminLayout from "../layout_admin/AppLayout";
import Afternoon from "../pages_automation/Afternoon";
import Evening from "../pages_automation/Evening";
import Morning from "../pages_automation/Morning";
import Special from "../pages_automation/Special";
import Weekly from "../pages_automation/Weekly";
import AdminApproval from "../pages_admin/AdminApproval";
import AdminRecommendations from "../pages_admin/AdminRecommendations";
import AdminDashboard from "../pages_admin/AdminDashboard";
import LoginForm from "../common/LoginForm";
import ClientLayout from "../components/layout_client/AppLayout";
import ClientDashboard from "../pages_client/Dashboard";
import ClientRecommendations from "../pages_client/Recomendation";
import ClientPerformance from "../pages_client/Performance";
import ClientNotFound from "../pages_client/Notfound";
// import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>


      <Route path="/signup" element={<Signup />} />
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/signin" element={<LoginForm />} />


      {/* ALL pages that need sidebar go here */}


      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/recommendations"
          element={
            localStorage.getItem("token")
              ? <Recommendations />
              : <Navigate to="/" />
          }
        />

        <Route path="/performance" element={<Performance />} />

      </Route>

      {/* Automation layout with its own sidebar/header */}
      <Route path="/automation" element={<AutomationLayout />}>
        <Route index element={<Afternoon />} />
        <Route path="Afternoon" element={<Afternoon />} />
        <Route path="Evening" element={<Evening />} />
        <Route path="Morning" element={<Morning />} />
        <Route path="Special" element={<Special />} />
        <Route path="Weekly" element={<Weekly />} />
      </Route>



      {/* Admin layout */}
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="approval" element={<AdminApproval />} />
      </Route>

      {/* Client layout */}
      <Route path="/client/*" element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="recommendations" element={<ClientRecommendations />} />
        <Route path="performance" element={<ClientPerformance />} />
        <Route path="*" element={<ClientNotFound />} />
      </Route>



      {/* Pages without sidebar (optional) */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;
