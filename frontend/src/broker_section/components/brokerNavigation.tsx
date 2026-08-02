import CampaignIcon from "@mui/icons-material/Campaign";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaletteIcon from "@mui/icons-material/Palette";
import PeopleIcon from "@mui/icons-material/People";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SettingsIcon from "@mui/icons-material/Settings";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import type { SidebarItem } from "../../types/sidebar";

export const brokerSidebarItems: SidebarItem[] = [
  { label: "Dashboard", path: "/broker/dashboard", icon: <DashboardIcon sx={{ mr: 1.5 }} /> },
  { label: "Research Calls", path: "/broker/research-calls", icon: <FolderIcon sx={{ mr: 1.5 }} /> },
  { label: "Research Analysts", path: "/broker/research-analysts", icon: <PersonSearchIcon sx={{ mr: 1.5 }} /> },
  { label: "Clients", path: "/broker/clients", icon: <PeopleIcon sx={{ mr: 1.5 }} /> },
  { label: "Performance", path: "/broker/performance", icon: <ShowChartIcon sx={{ mr: 1.5 }} /> },
  { label: "Announcements", path: "/broker/announcements", icon: <CampaignIcon sx={{ mr: 1.5 }} /> },
  { label: "Branding", path: "/broker/branding", icon: <PaletteIcon sx={{ mr: 1.5 }} /> },
  { label: "Subscription", path: "/broker/subscription", icon: <CreditCardIcon sx={{ mr: 1.5 }} /> },
  { label: "Notifications", path: "/broker/notifications", icon: <NotificationsIcon sx={{ mr: 1.5 }} /> },
  { label: "Settings", path: "/broker/settings", icon: <SettingsIcon sx={{ mr: 1.5 }} /> },
];
