import { Alert } from "@mui/material";
import AdminPageShell, { AdminMetricCards } from "../components/admin/AdminPageShell";
const SuperAdminDashboard = () => <AdminPageShell title="Platform Dashboard" subtitle="Platform-wide governance and commercial overview."><AdminMetricCards items={[{ label: "Active Research Analysts", value: 128 }, { label: "Active Brokers", value: 36 }, { label: "Monthly subscription revenue", value: "₹18.4L" }]} /><Alert severity="info" sx={{ mt: 2 }}>Figures are fictional mock data. No production data is queried.</Alert></AdminPageShell>;
export default SuperAdminDashboard;
