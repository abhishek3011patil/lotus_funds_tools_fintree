import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import type { DashboardNotification, ExpiringSubscription } from "../types";

interface DashboardSidePanelsProps {
  expiring: ExpiringSubscription[];
  notifications: DashboardNotification[];
  onRecommendations: () => void;
  onNotifications: () => void;
  onManage: () => void;
}

export const ExpiringPanel = ({ expiring, onManage }: Pick<DashboardSidePanelsProps, "expiring" | "onManage">) => {
  if (expiring.length === 0) return null;
  return (
    <Alert severity="warning" icon={<ScheduleRoundedIcon />} sx={{ borderRadius: "14px", alignItems: "flex-start" }}>
      <Typography sx={{ fontWeight: 800 }}>Subscriptions expiring soon</Typography>
      {expiring.map((item) => (
        <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2} sx={{ mt: 0.7 }}>
          <Typography sx={{ fontSize: 13 }}>{item.raName}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{item.daysRemaining} days</Typography>
        </Stack>
      ))}
      <Button onClick={onManage} size="small" sx={{ mt: 0.7, color: "#B45309", fontWeight: 800 }}>
        Manage subscriptions
      </Button>
    </Alert>
  );
};

export const NotificationsPanel = ({ notifications, onNotifications }: Pick<DashboardSidePanelsProps, "notifications" | "onNotifications">) => (
  <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "18px", p: 2.25, height: "100%" }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <NotificationsNoneRoundedIcon sx={{ color: "#5271FF" }} />
      <Typography component="h2" sx={{ color: "#172033", fontWeight: 800, fontSize: 18 }}>
        Recent Notifications
      </Typography>
    </Stack>
    {notifications.length === 0 ? (
      <Box sx={{ py: 5, textAlign: "center" }}>
        <Typography sx={{ color: "#64748B", fontSize: 13.5 }}>You’re all caught up.</Typography>
      </Box>
    ) : (
      <Stack divider={<Divider flexItem />}>
        {notifications.map((notification) => (
          <Box key={notification.id} sx={{ py: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {!notification.isRead && <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#5271FF", flexShrink: 0 }} />}
              <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: notification.isRead ? 600 : 800 }}>
                {notification.title}
              </Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.35 }}>
              {notification.message}
            </Typography>
          </Box>
        ))}
      </Stack>
    )}
    <Button fullWidth onClick={onNotifications} sx={{ mt: 1, color: "#5271FF", fontWeight: 700 }}>
      View all notifications
    </Button>
  </Box>
);
