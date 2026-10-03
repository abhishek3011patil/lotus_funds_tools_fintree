import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AdminPageShell from "../components/admin/AdminPageShell";
import ProductState from "../components/common/ProductState";
const SuperAdminSettings = () => <AdminPageShell title="Platform Settings" subtitle="Tarkashh platform configuration."><ProductState kind="unavailable" icon={<SettingsOutlinedIcon fontSize="large" />} title="Platform settings are not connected" description="Settings will be editable after secure configuration storage, authorization, and audit logging are available. Sample values have been removed." /></AdminPageShell>;
export default SuperAdminSettings;
