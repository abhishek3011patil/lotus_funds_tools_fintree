import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import Signup from "../pages/common/Signup";
import RegistrationPage from "../pages_registration/RegistrationPage";
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
import BrokerRegistration from "../pages_registration/BrokerRegistration";

// --- NEW IMPORTS FOR MORNING REPORT ---
import MorningReportBuilder from "../morning-report/MorningReportBuilder";
import MorningReport from "../morning-report/MorningReport";
import Logotheme from "../morning-report/Logotheme";
import Generator from "../morning-report/Generator";

const AppRoutes = () => {
  return (
    <Routes>
      {/* --- Auth & Public Routes --- */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* --- Registration Workflow --- */}
      <Route path="/registration">
        <Route index element={<RegistrationPage />} />
        <Route path="broker" element={<BrokerRegistration />} />
      </Route>

      {/* --- 1. Main Dashboard Layout (Protected) --- */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/performance" element={<Performance />} />
      </Route>

      {/* --- 2. Morning Report Workflow (Full Screen) --- */}
      <Route path="/morning-report-builder" element={<MorningReportBuilder />} />
      <Route path="/morning-report-view" element={<MorningReport />} />
      <Route path="/logo-theme" element={<Logotheme />} />
      <Route path="/email-generator" element={<Generator />} />

      {/* --- 3. Automation Layout --- */}
      <Route path="/automation" element={<AutomationLayout />}>
        <Route index element={<Navigate to="Afternoon" replace />} />
        <Route path="Afternoon" element={<Afternoon />} />
        <Route path="Evening" element={<Evening />} />
        <Route path="Morning" element={<Morning />} />
        <Route path="Special" element={<Special />} />
        <Route path="Weekly" element={<Weekly />} />
      </Route>

      {/* --- 4. Admin Layout --- */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="approval" element={<AdminApproval />} />
      </Route>

      {/* Catch-all for 404s */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;