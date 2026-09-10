import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import AdminPageShell from "../components/admin/AdminPageShell";
const AdminVerificationHistory = () => <AdminPageShell title="Verification History" subtitle="Completed document-review activity."><TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type</TableCell><TableCell>Outcome</TableCell><TableCell>Reviewed</TableCell></TableRow></TableHead><TableBody><TableRow><TableCell>VER-1890</TableCell><TableCell>RA document</TableCell><TableCell>Verified</TableCell><TableCell>2026-07-26</TableCell></TableRow></TableBody></Table></TableContainer></AdminPageShell>;
export default AdminVerificationHistory;
