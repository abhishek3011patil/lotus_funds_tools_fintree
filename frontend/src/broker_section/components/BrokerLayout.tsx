import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";

// Adjust these relative imports according to your folder depth
import Header from "../../components/layout/Header"; 
import Sidebar from "../../components/page_Mainapp/Sidebar";
import { roleContentSx } from "../../components/layout/roleSurfaceStyles";
import { brokerSidebarItems } from "./brokerNavigation";

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
          p: { xs: 2, md: 3 },
          width: { xs: "100%", sm: "calc(100% - 220px)" },
          ...roleContentSx,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default BrokerLayout;
