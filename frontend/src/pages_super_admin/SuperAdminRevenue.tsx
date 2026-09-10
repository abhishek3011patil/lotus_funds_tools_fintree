import { Alert } from "@mui/material";
import AdminPageShell, { AdminMetricCards } from "../components/admin/AdminPageShell";
const SuperAdminRevenue = () => <AdminPageShell title="Subscription & Revenue" subtitle="Platform-wide commercial overview."><AdminMetricCards items={[{ label: "Monthly revenue", value: "₹18.4L" }, { label: "Active subscriptions", value: 842 }, { label: "Renewals due in 30 days", value: 61 }]} /><Alert severity="info" sx={{ mt: 2 }}>Mock values only; payment and renewal APIs are not called.</Alert></AdminPageShell>;
export default SuperAdminRevenue;
