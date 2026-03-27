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
import ClientLayout from "../components/layout_client/AppLayout";
import ClientDashboard from "../pages_client/Dashboard";
import ClientRecommendations from "../pages_client/Recomendation";
import ClientPerformance from "../pages_client/Performance";
import ClientNotFound from "../pages_client/Notfound";
import EditRA from "../pages/EditRA";
// import NotFound from "../pages/NotFound";
import BrokerRegistration from "../pages_registration/BrokerRegistration";

// --- NEW IMPORTS FOR MORNING REPORT ---
import MorningReportBuilder from "../tools/morning-report/MorningReportBuilder";
import MorningReport from "../tools/morning-report/MorningReport";
import Logotheme from "../tools/morning-report/Logotheme";
import Generator from "../tools/morning-report/Generator";
import ProtectedRoute from "../components/ProtectedRoute";

// Tool import
import { ExceltoJSONTool } from "../tools/ExceltoJSONtool";
import LoginFormAdmin from "../common/LoginFormAdmin";

// NewPasswordSet Route
import NewPassword from "../common/NewPassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* --- Auth & Public Routes --- */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/login-admin" element={<LoginFormAdmin />} />

      <Route path="/signup" element={<Signup />} />

      {/* --- Registration Workflow --- */}
      <Route path="/registration">
        <Route index element={<RegistrationPage />} />
        <Route path="broker" element={<BrokerRegistration />} />
      </Route>

      {/* --- 1. Main Dashboard Layout (EMPLOYEE + ADMIN) --- */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RESEARCH_ANALYST"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/performance" element={<Performance />} />
      </Route>

      {/* --- 2. Morning Report Workflow (EMPLOYEE + ADMIN) --- */}
      <Route
        path="/morning-report-builder"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
            <MorningReportBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/morning-report-view"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
            <MorningReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logo-theme"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
            <Logotheme />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email-generator"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
            <Generator />
          </ProtectedRoute>
        }
      />

      {/* --- 3. Automation Layout (EMPLOYEE + ADMIN) --- */}
      <Route
        path="/automation"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
            <AutomationLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="Afternoon" replace />} />
        <Route path="Afternoon" element={<Afternoon />} />
        <Route path="Evening" element={<Evening />} />
        <Route path="Morning" element={<Morning />} />
        <Route path="Special" element={<Special />} />
        <Route path="Weekly" element={<Weekly />} />
        <Route path="ExcelTool" element={<ExceltoJSONTool />} />
      </Route>



s      {/* --- 4. Admin Layout (ADMIN ONLY) --- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="approval" element={<AdminApproval />} />
        <Route path="edit-ra/:id" element={<EditRA />} /> 
      </Route>

      {/* --- 5. Client Layout (CLIENT ONLY) --- */}
      <Route
        path="/client/*"
        element={
          <ProtectedRoute allowedRoles={["CLIENT"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientDashboard />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="recommendations" element={<ClientRecommendations />} />
        <Route path="performance" element={<ClientPerformance />} />
        <Route path="*" element={<ClientNotFound />} />
      </Route>

      {/* Catch-all for 404s */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/*NewPassword Route*/}
      <Route path="setpassword" element={<NewPassword/>}/>
      
    </Routes>
  );
}

export default AppRoutes;