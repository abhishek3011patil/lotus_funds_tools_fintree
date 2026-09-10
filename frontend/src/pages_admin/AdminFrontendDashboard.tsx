import { Alert } from "@mui/material";
import AdminPageShell, { AdminMetricCards } from "../components/admin/AdminPageShell";
const AdminFrontendDashboard = () => <AdminPageShell title="Admin Dashboard" subtitle="Operational verification and billing queues."><AdminMetricCards items={[{ label: "RA documents pending", value: 7 }, { label: "Broker documents pending", value: 4 }, { label: "Billing reviews", value: 3 }]} /><Alert severity="info" sx={{ mt: 2 }}>Governance and platform configuration are available only in the Super Admin section.</Alert></AdminPageShell>;
export default AdminFrontendDashboard;
