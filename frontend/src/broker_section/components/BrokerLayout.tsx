import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SettingsIcon from "@mui/icons-material/Settings";

// Adjust these relative imports according to your folder depth
import Header from "../../components/layout/Header"; 
import Sidebar from "../../components/page_Mainapp/Sidebar";
import type { SidebarItem } from "../../types/sidebar";

const brokerSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/broker/dashboard",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Recommendations",
    path: "/broker/recommendations",
    icon: <FolderIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Performance",
    path: "/broker/performance",
    icon: <ShowChartIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Settings",
    path: "/broker/settings",
    icon: <SettingsIcon sx={{ mr: 1.5 }} />,
  },
];

const BrokerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Green Bar */}
      <Header
        onMenuClick={handleMenuClick}
        items={brokerSidebarItems}
      />

      {/* Your Exact Sidebar Component */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        items={brokerSidebarItems}
      />

      {/* Main Content Render Area */}
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

export default BrokerLayout;