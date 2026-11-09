import type { SvgIconComponent } from "@mui/icons-material";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";
export type WorkspaceTool = { title: string; description: string; path: string; category: string; icon: SvgIconComponent };
export const workspaceTools: WorkspaceTool[] = [
  { title: "Morning report", description: "Bring market updates together in a branded morning report.", path: "/morning-report-builder", category: "Reports", icon: ArticleOutlined },
  { title: "FII / DII activity", description: "Turn institutional flow data into a clear, shareable market visual.", path: "/automation/Morning/fiidll", category: "Market data", icon: BarChartOutlined },
  { title: "Daily market dashboard", description: "Build a daily snapshot of indices, sectors and market movements.", path: "/automation/Morning/market-dashboard", category: "Market data", icon: DashboardOutlined },
  { title: "Email generator", description: "Prepare client-ready email content for your market updates.", path: "/email-generator", category: "Communication", icon: EmailOutlined },
  { title: "Brand & logo themes", description: "Keep report colours and logos consistent with each company’s identity.", path: "/logo-theme", category: "Branding", icon: PaletteOutlined },
  { title: "Excel converter", description: "Convert spreadsheet data into JSON for your reporting workflow.", path: "/automation/ExcelTool", category: "Utilities", icon: TableChartOutlined },
];
