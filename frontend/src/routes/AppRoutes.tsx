import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// --- Layouts (loaded eagerly — they wrap everything, no benefit from lazying) ---
import AppLayout from "../components/layout/AppLayout";
import AutomationLayout from "../components/layout_automation/AppLayout";
import AdminLayout from "../components/layout_admin/AppLayout";
import ClientLayout from "../components/layout_client/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import LoadingPage from "../common/LoadingPage";
import AdminAuditLogs from "../pages_admin/AdminAuditLogs";



// --- Lazy: Auth & Public ---
const LoginForm = lazy(() => import("../common/LoginForm"));
const LoginFormAdmin = lazy(() => import("../common/LoginFormAdmin"));
const Signup = lazy(() => import("../pages/common/Signup"));
const NewPassword = lazy(() => import("../common/NewPassword"));

// --- Lazy: Registration ---
const RegistrationPage = lazy(() => import("../pages_registration/RegistrationPage"));
const BrokerRegistration = lazy(() => import("../pages_registration/BrokerRegistration"));

// --- Lazy: Main (Employee / Broker) ---
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Performance = lazy(() => import("../pages/Performance"));
const Settings = lazy(() => import("../pages/Settings"));
const Recommendations = lazy(() => import("../pages/Recomendation"));
const EditPage = lazy(() => import("../pages/EditPage"));


const RAProfileEditRequest = lazy(() => import("../common/RAProfileEditRequest"));
// --- Lazy: Morning Report Tools ---
const MorningReportBuilder = lazy(() => import("../tools/morning-report/MorningReportBuilder"));
const MorningReport = lazy(() => import("../tools/morning-report/MorningReport"));
const Logotheme = lazy(() => import("../tools/morning-report/Logotheme"));
const Generator = lazy(() => import("../tools/morning-report/Generator"));

// --- Lazy: Automation ---
const Afternoon = lazy(() => import("../pages_automation/Afternoon"));
const Evening = lazy(() => import("../pages_automation/Evening"));
const Morning = lazy(() => import("../pages_automation/Morning"));
const Special = lazy(() => import("../pages_automation/Special"));
const Weekly = lazy(() => import("../pages_automation/Weekly"));
const ExceltoJSONTool = lazy(() => import("../tools/ExceltoJSONtool").then(m => ({ default: m.ExceltoJSONTool })));

// --- Lazy: Admin ---
const AdminDashboard = lazy(() => import("../pages_admin/AdminDashboard"));
const AdminRecommendations = lazy(() => import("../pages_admin/AdminRecommendations"));
const AdminApproval = lazy(() => import("../pages_admin/AdminApproval"));
const AdminSettings = lazy(() => import("../pages_admin/AdminSettings"));



// --- Lazy: Client ---
const ClientDashboard = lazy(() => import("../pages_client/Dashboard"));
const ClientRecommendations = lazy(() => import("../pages_client/Recomendation"));
const ClientPerformance = lazy(() => import("../pages_client/Performance"));
const ClientNotFound = lazy(() => import("../pages_client/Notfound"));

// --- Lazy: Subscription ---
const SubscriptionPage = lazy(() => import("../subscription/SubscriptionPage"));

const RAProfile = lazy(() => import("../common/RAProfile"));
const RAProfileUpdateRequests = lazy(
  () => import("../pages_admin/Admin common/RAProfileUpdateRequests")
);
const DisclaimerHistory = lazy(
  () => import("../pages_admin/Admin common/DisclaimerHistory")
);


// --- Fallback UI shown while a lazy chunk is loading ---
const PageLoader = () => (
  <LoadingPage
    title="Loading"
    subtitle="Checking your access..."
    fullScreen
  />
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* New Password — must be above wildcard */}
        <Route path="/set-password" element={<NewPassword />} />

        {/* Auth & Public */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-admin" element={<LoginFormAdmin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Registration */}
        <Route path="/registration">
          <Route index element={<RegistrationPage />} />
          <Route path="broker" element={<BrokerRegistration />} />
        </Route>

        {/* Subscription */}
        <Route path="/subscription" element={<SubscriptionPage />} />

        {/* 1. Main Layout — RESEARCH_ANALYST / BROKER */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["RESEARCH_ANALYST", "BROKER"]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
        



          <Route path="/" element={<Dashboard />} />
<Route path="/performance" element={<Performance />} />
<Route path="/settings" element={<Settings />} />

<Route
  path="/ra/profile"
  element={
    <ProtectedRoute allowedRoles={["RESEARCH_ANALYST"]}>
      <RAProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/ra/profile/edit"
  element={
    <ProtectedRoute allowedRoles={["RESEARCH_ANALYST"]}>
      <RAProfileEditRequest />
    </ProtectedRoute>
  }
/>

<Route
  path="/recommendations"
  element={
    <ProtectedRoute allowedRoles={["RESEARCH_ANALYST"]}>
      <Recommendations />
    </ProtectedRoute>
  }
/>
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute allowedRoles={["RESEARCH_ANALYST"]}>
                <Recommendations />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* 2. Morning Report Workflow — EMPLOYEE / ADMIN */}
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

        {/* 3. Automation Layout — EMPLOYEE / ADMIN */}
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

        {/* 4. Admin Layout — ADMIN ONLY */}
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
          <Route path="AdminAuditLogs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="edit/:type/:id" element={<EditPage />} />
        <Route
  path="ra-profile-update-requests"
  element={<RAProfileUpdateRequests />}
/>
        <Route
  path="disclaimer-history/:userId"
  element={<DisclaimerHistory />}
/>
        </Route>

        {/* 5. Client Layout — CLIENT ONLY */}
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

        {/* Catch-all — always last */}
        <Route path="*" element={<Navigate to="/" replace />} />
        

      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
