import { Alert, Stack, TextField } from "@mui/material";
import AdminPageShell from "../components/admin/AdminPageShell";
const SuperAdminSettings = () => <AdminPageShell title="Platform Settings" subtitle="Platform configuration placeholder."><Stack spacing={2} maxWidth={600}><TextField label="Platform display name" defaultValue="Lotus Funds" /><TextField label="Support contact" defaultValue="support@example.test" /><Alert severity="warning">Saving platform configuration is intentionally disabled until authorized backend contracts exist.</Alert></Stack></AdminPageShell>;
export default SuperAdminSettings;
