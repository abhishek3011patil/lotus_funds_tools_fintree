import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axio";

type SubscriptionNotification = {
  id: string;
  subscription_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

const timeAgo = (value: string): string => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Recently";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - time) / 60_000)
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const RANotification = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<
    SubscriptionNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{
        success: boolean;
        notifications: SubscriptionNotification[];
      }>("/subscription-notifications");
      setNotifications(response.data.notifications || []);
    } catch {
      setError("Unable to load subscription notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (
    notification: SubscriptionNotification
  ) => {
    if (notification.is_read) return;
    await api.put(
      `/subscription-notifications/${notification.id}/read`
    );
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item
      )
    );
    window.dispatchEvent(
      new Event("subscription:notifications-updated")
    );
  };

  const markAllRead = async () => {
    await api.put("/subscription-notifications/read-all");
    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );
    window.dispatchEvent(
      new Event("subscription:notifications-updated")
    );
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1000, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Subscription renewal and expiry updates.
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button variant="outlined" onClick={() => void markAllRead()}>
            Mark all as read
          </Button>
        )}
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadNotifications()}
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
        <Stack alignItems="center" py={8}>
          <CircularProgress />
        </Stack>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }} elevation={1}>
          <Typography variant="body2" color="text.secondary">
            No subscription notifications available right now.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              variant="outlined"
              onClick={() => void markRead(notification)}
              sx={{
                cursor: notification.is_read ? "default" : "pointer",
                borderColor: notification.is_read
                  ? "#e2e8f0"
                  : "#93c5fd",
                backgroundColor: notification.is_read
                  ? "#fff"
                  : "#eff6ff",
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        color={
                          notification.type === "Subscription Expired"
                            ? "error"
                            : "warning"
                        }
                        label={notification.type}
                      />
                      {!notification.is_read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                          }}
                        />
                      )}
                    </Stack>
                    <Typography fontWeight={700} mt={1}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {notification.message}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo(notification.created_at)}
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  sx={{ mt: 1.5 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    void markRead(notification);
                    navigate("/settings");
                  }}
                >
                  Open subscription settings
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default RANotification;
