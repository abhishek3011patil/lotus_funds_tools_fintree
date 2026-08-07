import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FolderIcon from "@mui/icons-material/Folder";
import NotificationsIcon from "@mui/icons-material/Notifications";

import Header from "./Header";
import Sidebar from "../page_Mainapp/Sidebar";

import type { SidebarItem } from "../../types/sidebar";

import Badge from "@mui/material/Badge";

import { useTelegramNotification } from "../../hooks/useTelegramNotification";
import api from "../../utils/axio";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptionUnreadCount, setSubscriptionUnreadCount] =
    useState(0);

  // ✅ MUST BE INSIDE COMPONENT
  const { telegramDisconnected } =
    useTelegramNotification();

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          count: number;
        }>("/subscription-notifications/unread-count");
        setSubscriptionUnreadCount(
          Number(response.data.count || 0)
        );
      } catch {
        setSubscriptionUnreadCount(0);
      }
    };

    void loadUnreadCount();
    const intervalId = window.setInterval(
      () => void loadUnreadCount(),
      60_000
    );
    const handleUpdate = () => void loadUnreadCount();
    window.addEventListener(
      "subscription:notifications-updated",
      handleUpdate
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "subscription:notifications-updated",
        handleUpdate
      );
    };
  }, []);

  // ✅ ITEMS INSIDE COMPONENT
  const appSidebarItems: SidebarItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: <DashboardIcon sx={{ mr: 1.5 }} />,
    },
    {
      label: "Recommendations",
      path: "/recommendations",
      icon: <CheckBoxIcon sx={{ mr: 1.5 }} />,
    },
    {
      label: "Performance",
      path: "/performance",
      icon: <FolderIcon sx={{ mr: 1.5 }} />,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: (
        <Badge
          color="error"
          badgeContent={subscriptionUnreadCount}
          max={99}
        >
          <NotificationsIcon sx={{ mr: 1.5 }} />
        </Badge>
      ),
    },
    {
      label: "Settings",
      path: "/settings",
      icon: (
        <Badge
          color="error"
          variant="dot"
          invisible={!telegramDisconnected}
        >
          <SettingsIcon sx={{ mr: 1.5 }} />
        </Badge>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        onMenuClick={handleMenuClick}
        items={appSidebarItems}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        items={appSidebarItems}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          p: 3,
          width: {
            xs: "100%",
            sm: "calc(100% - 220px)",
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
