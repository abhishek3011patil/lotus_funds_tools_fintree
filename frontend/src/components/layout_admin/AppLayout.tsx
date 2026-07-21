import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import SettingsIcon from '@mui/icons-material/Settings';
// import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FolderIcon from "@mui/icons-material/Folder";
import Header from "./Header";
import Sidebar from "../page_Mainapp/Sidebar";
import type { SidebarItem } from "../../types/sidebar";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Badge from "@mui/material/Badge";

const automationSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  // {
  //   label: "Recommendations",
  //   path: "/admin/recommendations",
  //   icon: <FolderIcon sx={{ mr: 1.5 }} />,
  // },
  {
    label: "Admin Approval",
    path: "/admin/approval",
    icon: <PrivacyTipIcon sx={{ mr: 1.5 }} />,
  },
  {    
    label: "Audit Logs", 
    path: "/admin/AdminAuditLogs" , 
    icon: <FolderIcon sx={{ mr: 1.5 }} />
   },

  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: <NotificationsNoneIcon sx={{ mr: 1.5 }} />

  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: <SettingsIcon sx={{ mr: 1.5 }} />,
  },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const fetchUnreadCount = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      setUnreadCount(data.count);
    }
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchUnreadCount();

  const interval = setInterval(fetchUnreadCount, 5000);

  const updateBadge = () => fetchUnreadCount();

  window.addEventListener("notificationsUpdated", updateBadge);

  return () => {
    clearInterval(interval);
    window.removeEventListener("notificationsUpdated", updateBadge);
  };
}, []);

const sidebarItems = automationSidebarItems.map(item =>
  item.label === "Notifications"
    ? {
        ...item,
        icon: (
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            invisible={unreadCount === 0}
          >
            <NotificationsNoneIcon sx={{ mr: 1.5 }} />
          </Badge>
        ),
      }
    : item
);

  return (
    <Box sx={{ display: "flex" }}>
     <Header
  onMenuClick={handleMenuClick}
  items={sidebarItems}
/>

<Sidebar
  open={sidebarOpen}
  onClose={handleSidebarClose}
  items={sidebarItems}
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
