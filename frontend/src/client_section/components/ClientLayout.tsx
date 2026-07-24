import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";

// Adjust relative paths to match your project imports
import Header from "../../components/layout/Header"; 
import Sidebar from "../../components/page_Mainapp/Sidebar";
import type { SidebarItem } from "../../types/sidebar";

const clientSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/client/dashboard",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Trade Calls",
    path: "/client/trade-calls",
    icon: <ShowChartIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Portfolio",
    path: "/client/portfolio",
    icon: <AccountBalanceWalletIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Settings",
    path: "/client/settings",
    icon: <SettingsIcon sx={{ mr: 1.5 }} />,
  },
];

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Green Header */}
      <Header
        onMenuClick={handleMenuClick}
        items={clientSidebarItems}
      />

      {/* Shared Sidebar Component */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        items={clientSidebarItems}
      />

      {/* Main Page Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          p: 3,
          width: { xs: "100%", sm: "calc(100% - 220px)" },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ClientLayout;