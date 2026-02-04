import DashboardIcon from "@mui/icons-material/Dashboard";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FolderIcon from "@mui/icons-material/Folder";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import type { SidebarItem } from "../types/sidebar";

export const appSidebarItems: SidebarItem[] = [
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
];

export const automationSidebarItems: SidebarItem[] = [
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
  },
];

export const afternoonTiles: SidebarItem[] = [
  {
    label: "Tile 1",
    path: "/automation/Afternoon/tile1",
    icon: <DashboardIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Tile 2",
    path: "/automation/Afternoon/tile2",
    icon: <CheckBoxIcon sx={{ mr: 1.5 }} />,
  },
  {
    label: "Tile 3",
    path: "/automation/Afternoon/tile3",
    icon: <FolderIcon sx={{ mr: 1.5 }} />,
  },
];

