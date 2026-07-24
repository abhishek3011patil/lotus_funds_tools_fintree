import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// --- Layouts (loaded eagerly — they wrap everything, no benefit from lazying) ---
import AppLayout from "../components/layout/AppLayout";
import AutomationLayout from "../components/layout_automation/AppLayout";
import AdminLayout from "../components/layout_admin/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import LoadingPage from "../common/LoadingPage";
import ClientLayout from "../client_section/components/ClientLayout";



// --- Lazy: Auth & Public ---
const LoginForm = lazy(() => import("../common/LoginForm"));
const LoginFormAdmin = lazy(() => import("../common/LoginFormAdmin"));
const Signup = lazy(() => import("../pages/common/Signup"));
const RAPasswordSetupPage = lazy(
  () =>
    import(
      "../features/raRegistrationSubscription/pages/RAPasswordSetupPage"
    )
);
// --- Lazy: Registration ---
const RegistrationPage = lazy(() => import("../pages_registration/RegistrationPage"));
const RAPlanSelectionPage = lazy(
  () =>
    import(
      "../features/raRegistrationSubscription/pages/RAPlanSelectionPage"
    )
);

const RAUnderReviewPage = lazy(
  () =>
    import(
      "../features/raRegistrationSubscription/pages/RAUnderReviewPage"
    )
);

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
const AdminNotification = lazy(() => import("../pages_admin/Admin common/AdminNotification"));
const AdminSettings = lazy(() => import("../pages_admin/AdminSettings"));



// --- Lazy: Client Section Pages ---
const ClientDashboard = lazy(() => import("../client_section/pages/ClientDashboard"));
const ClientTradeCalls = lazy(() => import("../client_section/pages/ClientTradeCalls"));
const ClientPortfolio = lazy(() => import("../client_section/pages/ClientPortfolio"));
const ClientSettings = lazy(() => import("../client_section/pages/ClientSettings"));

// --- Lazy: Subscription ---
const SubscriptionPage = lazy(() => import("../subscription/SubscriptionPage"));

const RAProfile = lazy(() => import("../common/RAProfile"));
const RAProfileUpdateRequests = lazy(
  () => import("../pages_admin/Admin common/RAProfileUpdateRequests")
);
const DisclaimerHistory = lazy(
  () => import("../pages_admin/Admin common/DisclaimerHistory")
);

const BrokerDashboard = lazy(() => import("../broker_section/pages/BrokerDashboard"));
const BrokerRecommendations = lazy(() => import("../broker_section/pages/BrokerRecommendations"));
const BrokerPerformance = lazy(() => import("../broker_section/pages/BrokerPerformance"));
const BrokerSettings = lazy(() => import("../broker_section/pages/BrokerSettings"));

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
       <Route
  path="/set-password"
  element={<RAPasswordSetupPage />}
/>
        {/* Auth & Public */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-admin" element={<LoginFormAdmin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Registration */}
       <Route path="/registration">
  <Route
    index
    element={<RegistrationPage />}
  />

  <Route
    path="broker"
    element={<BrokerRegistration />}
  />

  <Route
    path="subscription"
    element={<RAPlanSelectionPage />}
  />

  <Route
    path="under-review"
    element={<RAUnderReviewPage />}
  />
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
        </Route>

        {/* 2. BROKER SECTION LAYOUT — BROKER ROLE ONLY */}
        <Route
          path="/broker"
          element={
            <ProtectedRoute allowedRoles={["BROKER"]}>
              <BrokerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BrokerDashboard />} />
          <Route path="recommendations" element={<BrokerRecommendations />} />
          <Route path="performance" element={<BrokerPerformance />} />
          <Route path="settings" element={<BrokerSettings />} />
        </Route>

        {/* 2. Morning Report Workflow — EMPLOYEE / ADMIN */}
        <Route
          path="/morning-report-builder"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN","SUPERADMIN"]}>
              <MorningReportBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/morning-report-view"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN","SUPERADMIN"]}>
              <MorningReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logo-theme"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN","SUPERADMIN"]}>
              <Logotheme />
            </ProtectedRoute>
          }
        />
        <Route
          path="/email-generator"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN","SUPERADMIN"]}>
              <Generator />
            </ProtectedRoute>
          }
        />

        {/* 3. Automation Layout — EMPLOYEE / ADMIN */}
        <Route
          path="/automation"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN","SUPERADMIN"]}>
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
            <ProtectedRoute allowedRoles={["ADMIN","SUPERADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="recommendations" element={<AdminRecommendations />} />
          <Route path="approval" element={<AdminApproval />} />
          <Route path="AdminAuditLogs" element={<AdminAuditLogs />} />
          <Route path="notifications" element={<AdminNotification />} />
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
  path="/client"
  element={
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <ClientLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<ClientDashboard />} />
  <Route path="trade-calls" element={<ClientTradeCalls />} />
  <Route path="portfolio" element={<ClientPortfolio />} />
  <Route path="settings" element={<ClientSettings />} />
</Route>

        {/* Catch-all — always last */}
        <Route path="*" element={<Navigate to="/" replace />} />


      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
