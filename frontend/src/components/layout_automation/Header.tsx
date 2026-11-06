import { AppBar, Toolbar, Typography, Box, IconButton, Chip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation } from "react-router-dom";
import type { SidebarItem } from "../../types/sidebar";
export default function Header({ onMenuClick, items }: { onMenuClick?: () => void; items: SidebarItem[] }) {
  const { pathname } = useLocation();
  const current = items.filter(item => item.path !== "/automation").find(item => pathname.toLowerCase().startsWith(item.path.toLowerCase()));
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  const title = pathname === "/automation/ExcelTool" ? "Utilities" : current?.label || "Overview";
  return <AppBar position="fixed" elevation={0} sx={{ height: 72, justifyContent: "center", bgcolor: "background.paper", color: "text.primary", borderBottom: "1px solid", borderColor: "divider", width: { xs: "100%", md: "calc(100% - 240px)" }, ml: { md: "240px" }, zIndex: theme => theme.zIndex.drawer + 1 }}>
    <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 4 } }}>
      <IconButton aria-label="Open workspace navigation" onClick={onMenuClick} sx={{ display: { md: "none" } }}><MenuIcon /></IconButton>
      <Box sx={{ flexGrow: 1 }}><Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, fontSize: 11 }}>Employee workspace</Typography><Typography fontWeight={750}>{title}</Typography></Box>
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>{date}</Typography>
      <Chip label="Workspace" size="small" sx={{ ml: 1, bgcolor: "primary.light", color: "primary.main" }} />
    </Toolbar>
  </AppBar>;
}
