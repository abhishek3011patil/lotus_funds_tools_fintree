import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Stack,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";

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

const ClientNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:3000/api/client/notifications", 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Notifications Response:", res.data);

    setNotifications(res.data.notifications || []);
  } catch (err) {
    console.error("Notification Error:", err);
    setError("Failed to load notifications.");
  } finally {
    setLoading(false);
  }
};

  const timeAgo = (dateStr: string) => {
    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return "Recently";

    const diff = new Date().getTime() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return "Today";
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>
          Notifications
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          {notifications.length === 0 ? (
            <Typography sx={{ color: "#64748b" }}>No notifications found.</Typography>
          ) : (
            notifications.map((item) => {
              const style = typeStyles[item.type] || {
                bg: "#eceff1",
                color: "#455a64",
              };

              return (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ p: "16px 20px !important" }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={item.type}
                          size="small"
                          sx={{
                            backgroundColor: style.bg,
                            color: style.color,
                            fontWeight: 600,
                            borderRadius: "12px",
                          }}
                        />

                        {!item.is_read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#3b82f6",
                            }}
                          />
                        )}
                      </Stack>

                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        {timeAgo(item.created_at)}
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500 }}>
                      {item.message}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default ClientNotifications;