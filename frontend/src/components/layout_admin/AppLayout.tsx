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
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

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
  label: "Calls Log",
  path: "/admin/calls-log",
  icon: <PhoneInTalkIcon sx={{ mr: 1.5 }} />,
},

  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: <NotificationsNoneIcon sx={{ mr: 1.5 }} />

  },
    {
  label: "Support Requests",
  path: "/admin/support-requests",
  icon: <SupportAgentIcon sx={{ mr: 1.5 }} />,
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
  const [supportCount, setSupportCount] = useState(0);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const fetchSupportCount = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/support/requests/unread-count`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      setSupportCount(data.count);
    }
  } catch (err) {
    console.error("Support count error:", err);
  }
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
  fetchSupportCount();

   const interval = setInterval(() => {
    fetchUnreadCount();
    fetchSupportCount();
  }, 5000);

    const updateBadge = () => {
    fetchUnreadCount();
    fetchSupportCount();
  };

  window.addEventListener("notificationsUpdated", updateBadge);
  window.addEventListener("supportRequestsUpdated", updateBadge);

  return () => {
    clearInterval(interval);
    window.removeEventListener("notificationsUpdated", updateBadge);
    window.removeEventListener("supportRequestsUpdated", updateBadge);
  };
}, []);

const userRole = localStorage.getItem("role");

const sidebarItems = automationSidebarItems
  .filter(item => {
    if (item.label === "Calls Log") {
      return userRole === "ADMIN";
    }
    return true;
  })
  .map(item =>
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
      : item.label === "Support Requests"
      ? {
          ...item,
          icon: (
            <Badge
              badgeContent={supportCount}
              color="error"
              max={99}
              invisible={supportCount === 0}
            >
              <SupportAgentIcon sx={{ mr: 1.5 }} />
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
