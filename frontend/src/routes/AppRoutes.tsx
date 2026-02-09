import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import Signup from "../pages/common/Signup";
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
// import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ALL pages that need sidebar go here */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
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
      <Route path="/signup" element={<Signup />} />

      {/* Admin layout */}
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="approval" element={<AdminApproval />} />
      </Route>

      {/* Pages without sidebar (optional) */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;
