import { Box } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "../page_Mainapp/Sidebar";
import type { SidebarItem } from "../../types/sidebar";
import { roleContentSx } from "./roleSurfaceStyles";

const RoleLayout = ({ items }: { items: SidebarItem[] }) => {
  const [open, setOpen] = useState(false);
  return <Box sx={{ display: "flex" }}><Header items={items} onMenuClick={() => setOpen(true)} /><Sidebar items={items} open={open} onClose={() => setOpen(false)} /><Box component="main" sx={{ flexGrow: 1, mt: 8, p: { xs: 2, md: 3 }, width: { xs: "100%", sm: "calc(100% - 220px)" }, ...roleContentSx }}><Outlet /></Box></Box>;
};
export default RoleLayout;
