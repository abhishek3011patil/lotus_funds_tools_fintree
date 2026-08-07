import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  getSubscriptionHistory,
  type SubscriptionEventHistoryItem,
  type SubscriptionHistoryResponse,
  type SubscriptionPaymentHistoryItem,
} from "../../../features/subscriptionHistory/api";

const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatAmount = (
  amount: number,
  currency: string
): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(Number.isFinite(amount) ? amount : 0);

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");

const RASubscriptionHistory = () => {
  const [payments, setPayments] = useState<
    SubscriptionPaymentHistoryItem[]
  >([]);
  const [events, setEvents] = useState<
    SubscriptionEventHistoryItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getSubscriptionHistory();
      setPayments(response.data.payments || []);
      setEvents(response.data.events || []);
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<
        SubscriptionHistoryResponse
      >(requestError)
        ? requestError.response?.data?.message
        : requestError instanceof Error
          ? requestError.message
          : null;
      setError(
        message || "Unable to load subscription history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();

    const handleSubscriptionUpdate = () => {
      void loadHistory();
    };
    window.addEventListener(
      "subscription:updated",
      handleSubscriptionUpdate
    );

    return () => {
      window.removeEventListener(
        "subscription:updated",
        handleSubscriptionUpdate
      );
    };
  }, [loadHistory]);

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3 }} />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Subscription &amp; Payment History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payments, renewals and subscription status changes.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={() => void loadHistory()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadHistory()}
            >
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={28} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Payments
            </Typography>
            {payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No payment records found.
              </Typography>
            ) : (
              <TableContainer
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {formatDateTime(
                            payment.paidAt || payment.createdAt
                          )}
                        </TableCell>
                        <TableCell>
                          {formatLabel(payment.purpose)}
                        </TableCell>
                        <TableCell>
                          {formatAmount(
                            payment.amount,
                            payment.currency
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={formatLabel(payment.status)}
                            color={
                              payment.status === "CAPTURED" ||
                              payment.status === "PAID"
                                ? "success"
                                : payment.status === "FAILED"
                                  ? "error"
                                  : "default"
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {payment.providerPaymentId ||
                            payment.providerOrderId ||
                            "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Subscription activity
            </Typography>
            {events.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No subscription activity found.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {events.map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      p: 1.5,
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={0.5}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {formatLabel(event.type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(event.createdAt)}
                      </Typography>
                    </Stack>
                    {(event.previousStatus || event.newStatus) && (
                      <Typography variant="body2" color="text.secondary">
                        {event.previousStatus || "—"} →{" "}
                        {event.newStatus || "—"}
                      </Typography>
                    )}
                    {event.reason && (
                      <Typography variant="body2" color="text.secondary">
                        {event.reason}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default RASubscriptionHistory;
