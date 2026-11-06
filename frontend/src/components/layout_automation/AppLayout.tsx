import { useState } from "react";
import { Box, Avatar, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import WbTwilightOutlined from "@mui/icons-material/WbTwilightOutlined";
import NightsStayOutlined from "@mui/icons-material/NightsStayOutlined";
import CalendarViewWeekOutlined from "@mui/icons-material/CalendarViewWeekOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import Header from "./Header";
import api from "../../utils/axio";
import { getLoginRoute } from "../../utils/authRedirect";
const items = [
  { label: "Overview", path: "/automation", icon: <DashboardOutlined /> },
  { label: "Morning", path: "/automation/Morning", icon: <WbSunnyOutlined /> },
  { label: "Afternoon", path: "/automation/Afternoon", icon: <WbTwilightOutlined /> },
  { label: "Evening", path: "/automation/Evening", icon: <NightsStayOutlined /> },
  { label: "Weekly", path: "/automation/Weekly", icon: <CalendarViewWeekOutlined /> },
  { label: "Utilities", path: "/automation/Special", icon: <GridViewOutlined /> },
];
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Team member";
  async function logout() {
    setLoggingOut(true); setLogoutError(false);
    try {
      await api.post("/auth/logout");
      const role = localStorage.getItem("role");
      ["token", "tokenExpiry", "username", "role"].forEach(key => localStorage.removeItem(key));
      navigate(getLoginRoute(role), { replace: true });
    } catch { setLogoutError(true); } finally { setLoggingOut(false); }
  }
  const content = <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 3, height: 72, flexShrink: 0 }}>
      <Box sx={{ width: 32, height: 32, bgcolor: "primary.main", color: "white", borderRadius: 1.5, display: "grid", placeItems: "center", fontWeight: 800 }}>T</Box>
      <Typography component={Link} to="/automation" onClick={() => setOpen(false)} variant="h6" sx={{ color: "text.primary", textDecoration: "none", flexGrow: 1 }}>Tarkashh</Typography>
      <IconButton aria-label="Close workspace navigation" onClick={() => setOpen(false)} size="small" sx={{ display: { md: "none" } }}><CloseRounded /></IconButton>
    </Stack><Divider />
    <Typography variant="overline" color="text.secondary" sx={{ px: 3, mt: 3, mb: 1, fontSize: 10, fontWeight: 750, letterSpacing: ".12em" }}>WORKSPACE</Typography>
    <List component="nav" aria-label="Employee workspace" sx={{ px: 1.5 }}>
      {items.map(item => {
        const active = item.path === "/automation" ? pathname === item.path || pathname === item.path + "/" : pathname.toLowerCase().startsWith(item.path.toLowerCase()) || (item.label === "Utilities" && pathname === "/automation/ExcelTool");
        return <ListItemButton key={item.path} component={Link} to={item.path} selected={active} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} sx={{ mb: 0.75, px: 1.5, minHeight: 46, borderRadius: 1.5, color: active ? "primary.main" : "text.secondary", "&.Mui-selected": { bgcolor: "primary.light", "&:hover": { bgcolor: "#DDE5FF" } } }}><ListItemIcon sx={{ minWidth: 36, color: "inherit", "& .MuiSvgIcon-root": { fontSize: 21 } }}>{item.icon}</ListItemIcon><ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 750 : 550 }} /></ListItemButton>;
      })}
    </List>
    <Box sx={{ mx: 2.5, mt: 3, p: 2, borderRadius: 2, bgcolor: "#F7F8FC", border: "1px solid", borderColor: "divider" }}><Typography variant="body2" fontWeight={700}>Made for your workflow</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>Market insights. Consistent branding. Clear communication.</Typography></Box>
    <Box sx={{ mt: "auto", p: 2.5 }}><Divider sx={{ mb: 2 }} /><Stack direction="row" spacing={1.25} alignItems="center"><Avatar sx={{ width: 36, height: 36, bgcolor: "primary.light", color: "primary.main", fontSize: 14, fontWeight: 750 }}>{username.slice(0, 1).toUpperCase()}</Avatar><Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={700} noWrap>{username}</Typography><Typography variant="caption" color="text.secondary">Employee workspace</Typography></Box></Stack><Button size="small" color="inherit" startIcon={<LogoutRounded fontSize="small" />} disabled={loggingOut} onClick={logout} sx={{ mt: 1.5, color: "text.secondary" }}>{loggingOut ? "Signing out…" : "Sign out"}</Button>{logoutError && <Typography role="alert" variant="caption" color="error">Couldn’t sign out. Please try again.</Typography>}</Box>
  </Box>;
  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <Header items={items} onMenuClick={() => setOpen(true)} />
    <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", md: "none" }, zIndex: theme => theme.zIndex.drawer + 2, "& .MuiDrawer-paper": { width: 260, boxSizing: "border-box" } }}>{content}</Drawer>
    <Drawer variant="permanent" sx={{ display: { xs: "none", md: "block" }, width: 240, flexShrink: 0, "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box", borderRight: "1px solid", borderColor: "divider" } }}>{content}</Drawer>
    <Box component="main" sx={{ flexGrow: 1, minWidth: 0, pt: "72px", width: { xs: "100%", md: "calc(100% - 240px)" } }}><Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 2, sm: 3, lg: 4 } }}><Outlet /></Box></Box>
  </Box>;
}
