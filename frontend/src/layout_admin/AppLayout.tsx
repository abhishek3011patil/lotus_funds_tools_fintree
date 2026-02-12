import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
// import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FolderIcon from "@mui/icons-material/Folder";
import Header from "./Header";
import Sidebar from "../components/page_Mainapp/Sidebar";
import type { SidebarItem } from "../types/sidebar";

const automationSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Recommendations",
    path: "/admin/recommendations",
    icon: <FolderIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "AdminApproval",
    path: "/admin/approval",
    icon: <PrivacyTipIcon sx={{ mr: 1.5 }} />,
  },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Header onMenuClick={handleMenuClick} items={automationSidebarItems} />
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        items={automationSidebarItems}
      />

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

export default AppLayout;
