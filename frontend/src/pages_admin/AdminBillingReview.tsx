import { Alert, Stack, Typography } from "@mui/material";
import AdminPageShell from "../components/admin/AdminPageShell";

const AdminBillingReview = () => (
  <AdminPageShell
    title="Billing & Subscriptions"
    subtitle="Read-only billing review."
  >
    <Stack spacing={2}>
      <Alert severity="info">
        Live payment and subscription records are not available yet. This page will
        display server-verified records when the admin billing API is connected.
      </Alert>
      <Typography color="text.secondary" variant="body2">
        Payment verification and subscription changes are not available on this page.
      </Typography>
    </Stack>
  </AdminPageShell>
);

export default AdminBillingReview;
