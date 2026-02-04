import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
// import Sidebar from "./Sidebar";
import Sidebar from "../common/Sidebar";
import { automationSidebarItems } from "../../config/sidebarItems";

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
