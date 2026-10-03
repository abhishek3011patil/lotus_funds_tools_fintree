import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AdminPageShell from "../components/admin/AdminPageShell";
import ProductState from "../components/common/ProductState";
const SuperAdminRevenue = () => <AdminPageShell title="Subscription & Revenue" subtitle="Platform-wide commercial overview."><ProductState kind="unavailable" icon={<PaymentsOutlinedIcon fontSize="large" />} title="Revenue reporting is not connected" description="Revenue, renewal, and subscription totals will appear when the audited payment reporting API is available. Mock commercial values have been removed." /></AdminPageShell>;
export default SuperAdminRevenue;
