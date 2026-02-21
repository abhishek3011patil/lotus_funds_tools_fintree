import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FolderIcon from "@mui/icons-material/Folder";
import Header from "./Header";
import Sidebar from "../layout/Sidebar";
import type { SidebarItem } from "../../types/sidebar";

const ClientSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/client/dashboard",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Recommendations",
    path: "/client/recommendations",
    icon: <CheckBoxIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Performance",
    path: "/client/performance",
    icon: <FolderIcon sx={{ mr: 1.5 }} />,
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
      <Header onMenuClick={handleMenuClick} />
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        items={ClientSidebarItems}
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
