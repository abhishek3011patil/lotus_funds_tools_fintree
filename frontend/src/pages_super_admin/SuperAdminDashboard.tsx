import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AdminPageShell from "../components/admin/AdminPageShell";
import ProductState from "../components/common/ProductState";
const SuperAdminDashboard = () => <AdminPageShell title="Platform Dashboard" subtitle="Platform-wide governance and commercial overview."><ProductState kind="unavailable" icon={<DashboardOutlinedIcon fontSize="large" />} title="Platform metrics are not connected" description="Verified platform metrics will appear after the aggregate reporting API is available. Fictional dashboard figures have been removed." /></AdminPageShell>;
export default SuperAdminDashboard;
