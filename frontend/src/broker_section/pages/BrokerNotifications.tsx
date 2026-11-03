import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axio";
import BrokerPageHeader from "../components/BrokerPageHeader";

type BrokerNotification = { id: string; type: string; title: string; message: string; is_read: boolean; created_at: string };
const timeAgo = (value: string) => { const time = new Date(value).getTime(); if (Number.isNaN(time)) return "Recently"; const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000)); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; };

const BrokerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<BrokerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadNotifications = useCallback(async () => { setLoading(true); setError(null); try { const response = await api.get<{ notifications: BrokerNotification[] }>("/subscription-notifications"); setNotifications(response.data.notifications || []); } catch { setError("Unable to load notifications."); } finally { setLoading(false); } }, []);
  useEffect(() => { void loadNotifications(); }, [loadNotifications]);
  const markRead = async (notification: BrokerNotification) => { if (notification.is_read) return; try { await api.put(`/subscription-notifications/${notification.id}/read`); setNotifications(current => current.map(item => item.id === notification.id ? { ...item, is_read: true } : item)); window.dispatchEvent(new Event("subscription:notifications-updated")); } catch { setError("Unable to update notification status."); } };
  const markAllRead = async () => { try { await api.put("/subscription-notifications/read-all"); setNotifications(current => current.map(item => ({ ...item, is_read: true }))); window.dispatchEvent(new Event("subscription:notifications-updated")); } catch { setError("Unable to mark notifications as read."); } };
  const unreadCount = notifications.filter(notification => !notification.is_read).length;
  const destination = (type: string) => type.toLowerCase().includes("subscription") || type.toLowerCase().includes("expiry") ? "/broker/subscription" : type.toLowerCase().includes("research") ? "/broker/research-calls" : "/broker/dashboard";
  return <Box><BrokerPageHeader title="Notifications" subtitle="Research, account and subscription notices for this brokerage." />
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} mb={3}><Typography color="text.secondary">{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All notifications are read"}</Typography>{unreadCount > 0 && <Button variant="outlined" onClick={() => void markAllRead()}>Mark all as read</Button>}</Stack>
    {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadNotifications()}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Stack alignItems="center" py={8}><CircularProgress /></Stack> : notifications.length === 0 ? <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}><Typography color="text.secondary">No notifications available right now.</Typography></Paper> : <Stack spacing={1.5}>{notifications.map(notification => <Card key={notification.id} variant="outlined" onClick={() => void markRead(notification)} sx={{ cursor: notification.is_read ? "default" : "pointer", borderColor: notification.is_read ? "divider" : "#93c5fd", bgcolor: notification.is_read ? "background.paper" : "#eff6ff" }}><CardContent><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}><Box><Stack direction="row" spacing={1} alignItems="center"><Chip size="small" label={notification.type} color={notification.type.toLowerCase().includes("expiry") ? "error" : "primary"} />{!notification.is_read && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />}</Stack><Typography fontWeight={700} mt={1}>{notification.title}</Typography><Typography variant="body2" color="text.secondary" mt={.5}>{notification.message}</Typography></Box><Typography variant="caption" color="text.secondary">{timeAgo(notification.created_at)}</Typography></Stack><Button size="small" sx={{ mt: 1.5 }} onClick={(event) => { event.stopPropagation(); void markRead(notification); navigate(destination(notification.type)); }}>View details</Button></CardContent></Card>)}</Stack>}
  </Box>;
};
export default BrokerNotifications;
