import DashboardIcon from "@mui/icons-material/Dashboard";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PaymentsIcon from "@mui/icons-material/Payments";
import HistoryIcon from "@mui/icons-material/History";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GavelIcon from "@mui/icons-material/Gavel";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import type { SidebarItem } from "../../types/sidebar";

export const adminNavigation: SidebarItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon sx={{ mr: 1.5 }} /> },
  { label: "RA Verification", path: "/admin/ra-verification", icon: <FactCheckIcon sx={{ mr: 1.5 }} /> },
  { label: "Broker Verification", path: "/admin/broker-verification", icon: <FactCheckIcon sx={{ mr: 1.5 }} /> },
  { label: "Billing Review", path: "/admin/billing", icon: <PaymentsIcon sx={{ mr: 1.5 }} /> },
  { label: "Verification History", path: "/admin/verification-history", icon: <HistoryIcon sx={{ mr: 1.5 }} /> },
  { label: "Notifications", path: "/admin/notifications", icon: <NotificationsIcon sx={{ mr: 1.5 }} /> },
  { label: "Settings", path: "/admin/settings", icon: <SettingsIcon sx={{ mr: 1.5 }} /> },
];

export const superAdminNavigation: SidebarItem[] = [
  { label: "Platform Dashboard", path: "/super-admin/dashboard", icon: <DashboardIcon sx={{ mr: 1.5 }} /> },
  { label: "RA Governance", path: "/super-admin/research-analysts", icon: <GavelIcon sx={{ mr: 1.5 }} /> },
  { label: "Broker Governance", path: "/super-admin/brokers", icon: <GavelIcon sx={{ mr: 1.5 }} /> },
  { label: "Admin Management", path: "/super-admin/admins", icon: <AdminPanelSettingsIcon sx={{ mr: 1.5 }} /> },
  { label: "Audit Logs", path: "/super-admin/audit-logs", icon: <ReceiptLongIcon sx={{ mr: 1.5 }} /> },
  { label: "Revenue", path: "/super-admin/revenue", icon: <PaymentsIcon sx={{ mr: 1.5 }} /> },
  { label: "Disclaimers", path: "/super-admin/disclaimers", icon: <HistoryIcon sx={{ mr: 1.5 }} /> },
  { label: "Notifications", path: "/super-admin/notifications", icon: <NotificationsIcon sx={{ mr: 1.5 }} /> },
  { label: "Platform Settings", path: "/super-admin/settings", icon: <SettingsIcon sx={{ mr: 1.5 }} /> },
];
