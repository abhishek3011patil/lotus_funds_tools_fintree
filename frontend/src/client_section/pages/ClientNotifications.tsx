import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip,
  CircularProgress, Container, IconButton, Stack, Typography,
} from "@mui/material";
import api from "../../utils/axio";

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeStyles: Record<string, { bg: string; color: string }> = {
  "New Recommendation": { bg: "#e8eaf6", color: "#5c6bc0" },
  "Recommendation Modified": { bg: "#fff3e0", color: "#f57c00" },
  "New Blog": { bg: "#e0f7fa", color: "#0288d1" },
  "New Video": { bg: "#f3e5f5", color: "#7b1fa2" },
  "Subscription Renewal Reminder": { bg: "#ffebee", color: "#d32f2f" },
};

const getErrorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || "Unable to update notifications. Please try again.";

const ClientNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [renderedAt] = useState(() => Date.now());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ notifications?: Notification[] }>(
        "/client/notifications"
      );
      setNotifications(response.data.notifications || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authenticated notifications when this route opens.
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const markRead = async (item: Notification) => {
    if (item.is_read || busyId) return;
    setBusyId(item.id);
    setError(null);
    try {
      await api.put(`/client/notifications/${item.id}/read`);
      setNotifications((current) => current.map((notification) =>
        notification.id === item.id ? { ...notification, is_read: true } : notification
      ));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    setError(null);
    try {
      await api.put("/client/notifications/read-all");
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteItem = async (item: Notification) => {
    if (busyId) return;
    setBusyId(item.id);
    setError(null);
    try {
      await api.delete(`/client/notifications/${item.id}`);
      setNotifications((current) => current.filter((notification) => notification.id !== item.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const timestamp = new Date(dateStr).getTime();
    if (Number.isNaN(timestamp)) return "Recently";
    const minutes = Math.max(0, Math.floor((renderedAt - timestamp) / 60_000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>Notifications</Typography>
            <Typography color="text.secondary">
              {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You are all caught up"}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button variant="outlined" startIcon={markingAll ? <CircularProgress size={16} /> : <DoneAllRoundedIcon />} disabled={markingAll} onClick={() => void markAllRead()}>
              Mark all as read
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} action={notifications.length === 0 ? <Button color="inherit" size="small" onClick={() => void fetchNotifications()}>Retry</Button> : undefined} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="45vh"><CircularProgress /></Box>
        ) : notifications.length === 0 && !error ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 8, bgcolor: "#fff", borderRadius: 3, border: "1px dashed #cbd5e1" }}>
            <NotificationsNoneRoundedIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
            <Typography fontWeight={700}>No notifications yet</Typography>
            <Typography color="text.secondary">Account and subscription updates will appear here.</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {notifications.map((item) => {
              const style = typeStyles[item.type] || { bg: "#eceff1", color: "#455a64" };
              return (
                <Card key={item.id} variant="outlined" sx={{ borderRadius: 2, borderColor: item.is_read ? "#e2e8f0" : "#93c5fd", bgcolor: item.is_read ? "#fff" : "#eff6ff" }}>
                  <Stack direction="row" alignItems="stretch">
                    <CardActionArea onClick={() => void markRead(item)} disabled={busyId === item.id}>
                      <CardContent sx={{ p: "16px 20px !important" }}>
                        <Stack direction="row" justifyContent="space-between" mb={1} gap={2}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={item.type} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }} />
                            {!item.is_read && <Box aria-label="Unread" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3b82f6" }} />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{timeAgo(item.created_at)}</Typography>
                        </Stack>
                        {item.title && <Typography fontWeight={700}>{item.title}</Typography>}
                        <Typography variant="body2" color="#334155">{item.message}</Typography>
                      </CardContent>
                    </CardActionArea>
                    <IconButton aria-label={`Delete ${item.title || "notification"}`} disabled={busyId === item.id} onClick={() => void deleteItem(item)} sx={{ alignSelf: "center", mr: 1, color: "#94a3b8", "&:hover": { color: "#dc2626" } }}>
                      {busyId === item.id ? <CircularProgress size={20} /> : <DeleteOutlineRoundedIcon />}
                    </IconButton>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default ClientNotifications;
