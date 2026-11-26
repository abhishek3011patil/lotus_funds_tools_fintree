import { Alert, Stack, Typography } from "@mui/material";
import AdminPageShell from "../components/admin/AdminPageShell";

const AdminBillingReview = () => (
  <AdminPageShell
    title="Billing & Subscriptions"
    subtitle="Review account plans, payment status, and subscription periods."
  >
    <Stack spacing={2}>
      <Alert severity="info">
        The billing review screen is connected. Live payment and subscription records
        will appear here once the admin billing API is available.
      </Alert>
      <Typography color="text.secondary" variant="body2">
        This page is read-only. Payment verification and subscription changes should
        be based on server-verified payment records.
      </Typography>
    </Stack>
  </AdminPageShell>
);

export default AdminBillingReview;
