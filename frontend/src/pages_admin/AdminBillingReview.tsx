import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid,
  Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import AdminPageShell from "../components/admin/AdminPageShell";

type View = "payments" | "subscriptions";
type Summary = { paymentOrders: number; paidOrders: number; subscriptions: number; activeSubscriptions: number };
type Payment = {
  id: string; providerOrderId: string | null; orderStatus: string; amountPaise: number;
  currency: string; createdAt: string; paidAt: string | null; accountName: string;
  accountEmail: string | null; accountType: string | null; planName: string | null;
  transactionStatus: string | null; transactionType: string | null; providerPaymentId: string | null;
};
type Subscription = {
  id: string; source: string; accountName: string; accountEmail: string | null;
  accountType: string | null; planName: string; status: string; amountPaise: number;
  currency: string; startsAt: string | null; expiresAt: string | null;
  paymentStatus: string | null;
};
type BillingResponse = {
  success: boolean; total: number; summary: Summary;
  records: Payment[] | Subscription[]; message?: string;
};

const apiBase = (import.meta.env.VITE_API_URL || window.location.origin)
  .replace(/\/+$/, "").replace(/\/api$/, "");
const money = (paise: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
  } catch {
    return `${currency} ${(paise / 100).toFixed(2)}`;
  }
};
const date = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";
const statusChip = (status: string | null) => {
  if (!status) return <Typography color="text.secondary">—</Typography>;
  const color: ChipProps["color"] = ["ACTIVE", "PAID", "CAPTURED"].includes(status)
    ? "success" : ["FAILED", "CANCELLED", "EXPIRED"].includes(status) ? "error" : "warning";
  return <Chip size="small" label={status.replaceAll("_", " ")} color={color} variant="outlined" />;
};
const accountCell = (name: string, email: string | null, type: string | null) => (
  <Stack spacing={0.25}>
    <Typography variant="body2" fontWeight={600}>{name}</Typography>
    {email && <Typography variant="caption" color="text.secondary">{email}</Typography>}
    {type && <Typography variant="caption" color="text.secondary">{type}</Typography>}
  </Stack>
);

const AdminBillingReview = () => {
  const [view, setView] = useState<View>("payments");
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setPage(0);
        setSearch(searchInput.trim());
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ view, page: String(page + 1), limit: "20", search });
        const response = await fetch(`${apiBase}/admin/billing/records?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
          signal: controller.signal,
        });
        const body = await response.json() as BillingResponse;
        if (!response.ok || !body.success) throw new Error(body.message || "Unable to load billing records");
        setData(body);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setData(null);
        setError(cause instanceof Error ? cause.message : "Unable to load billing records");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [view, page, search, refresh]);

  const records = data?.records ?? [];
  return (
    <AdminPageShell title="Billing & Subscriptions" subtitle="Read-only review of stored payment and subscription records.">
      <Stack spacing={2}>
        <Alert severity="info">
          Statuses reflect records stored by the server. This page does not verify payments with the provider or change subscriptions.
        </Alert>
        <Grid container spacing={2}>
          {[
            { label: "Payment orders", value: data?.summary.paymentOrders },
            { label: "Paid orders", value: data?.summary.paidOrders },
            { label: "Subscriptions", value: data?.summary.subscriptions },
            { label: "Active subscriptions", value: data?.summary.activeSubscriptions },
          ].map(({ label, value }) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined"><CardContent>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={700}>{value ?? "—"}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
        <Card variant="outlined">
          <Box sx={{ px: 2, pt: 1, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Tabs value={view} onChange={(_event, next: View) => { setView(next); setPage(0); }} aria-label="Billing record views">
              <Tab value="payments" label="Payments" />
              <Tab value="subscriptions" label="Subscriptions" />
            </Tabs>
            <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
              <TextField size="small" label="Search records" value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)} inputProps={{ maxLength: 100 }} />
              <Button variant="outlined" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
            </Stack>
          </Box>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          {loading ? (
            <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress size={28} aria-label="Loading billing records" /></Box>
          ) : !error && records.length === 0 ? (
            <Typography sx={{ p: 3 }} color="text.secondary">No {view} match this search.</Typography>
          ) : !error && (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 980 }}>
                <TableHead><TableRow>
                  <TableCell>Account</TableCell><TableCell>{view === "payments" ? "Plan" : "Subscription"}</TableCell>
                  <TableCell>Amount</TableCell><TableCell>Status</TableCell>
                  <TableCell>{view === "payments" ? "Transaction" : "Payment"}</TableCell>
                  <TableCell>{view === "payments" ? "Created / paid" : "Start / expiry"}</TableCell>
                  <TableCell>{view === "payments" ? "Order" : "Record"}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {view === "payments"
                    ? (records as Payment[]).map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{accountCell(r.accountName, r.accountEmail, r.accountType)}</TableCell>
                        <TableCell>{r.planName || "—"}</TableCell>
                        <TableCell>{money(r.amountPaise, r.currency)}</TableCell>
                        <TableCell>{statusChip(r.orderStatus)}</TableCell>
                        <TableCell><Stack spacing={0.5}>
                          {statusChip(r.transactionStatus)}
                          {r.transactionType && <Typography variant="caption">{r.transactionType}</Typography>}
                          {r.providerPaymentId && <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>{r.providerPaymentId}</Typography>}
                        </Stack></TableCell>
                        <TableCell><Stack spacing={0.25}>
                          <Typography variant="caption">Created: {date(r.createdAt)}</Typography>
                          {r.paidAt && <Typography variant="caption">Paid: {date(r.paidAt)}</Typography>}
                        </Stack></TableCell>
                        <TableCell><Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>{r.providerOrderId || r.id}</Typography></TableCell>
                      </TableRow>
                    ))
                    : (records as Subscription[]).map((r) => (
                      <TableRow key={`${r.source}:${r.id}`} hover>
                        <TableCell>{accountCell(r.accountName, r.accountEmail, r.accountType)}</TableCell>
                        <TableCell><Stack spacing={0.25}>
                          <Typography variant="body2">{r.planName}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.source}</Typography>
                        </Stack></TableCell>
                        <TableCell>{money(r.amountPaise, r.currency)}</TableCell>
                        <TableCell>{statusChip(r.status)}</TableCell>
                        <TableCell>{statusChip(r.paymentStatus)}</TableCell>
                        <TableCell><Stack spacing={0.25}>
                          <Typography variant="caption">Start: {date(r.startsAt)}</Typography>
                          <Typography variant="caption">Expiry: {date(r.expiresAt)}</Typography>
                        </Stack></TableCell>
                        <TableCell><Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>{r.id}</Typography></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination component="div" count={data?.total ?? 0} page={page} rowsPerPage={20}
            rowsPerPageOptions={[20]} onPageChange={(_event, nextPage) => setPage(nextPage)} />
        </Card>
      </Stack>
    </AdminPageShell>
  );
};

export default AdminBillingReview;
