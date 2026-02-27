import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import TableChartIcon from "@mui/icons-material/TableChart";
import Header from "./Header";
// import Sidebar from "./Sidebar";
import Sidebar from "../page_Mainapp/Sidebar";
import type { SidebarItem } from "../../types/sidebar";

const automationSidebarItems: SidebarItem[] = [
  {
    label: "Afternoon",
    path: "/automation/Afternoon",
    icon: <WbTwilightIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Evening",
    path: "/automation/Evening",
    icon: <NightsStayIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Morning",
    path: "/automation/Morning",
    icon: <WbSunnyIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Special",
    path: "/automation/Special",
    icon: <StarOutlineIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Weekly",
    path: "/automation/Weekly",
    icon: <CalendarViewWeekIcon sx={{ mr: 1.5 }} />,
  }
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
