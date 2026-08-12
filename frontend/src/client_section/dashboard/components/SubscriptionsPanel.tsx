import { Avatar, AvatarGroup, Box, Button, Stack, Typography } from "@mui/material";
import type { DashboardSubscription } from "../types";

interface SubscriptionsPanelProps {
  subscriptions: DashboardSubscription[];
  onManage: () => void;
}

const apiOrigin = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SubscriptionsPanel = ({ subscriptions, onManage }: SubscriptionsPanelProps) => (
  <Box sx={{ bgcolor: "#5271FF", color: "#FFFFFF", borderRadius: "18px", p: 2.5, height: "100%", boxShadow: "0 12px 28px rgba(82, 113, 255, .22)" }}>
    <Typography component="h2" sx={{ fontSize: 19, fontWeight: 800 }}>
      Your Research Network
    </Typography>
    <Typography sx={{ color: "#E0E7FF", fontSize: 13, mt: 0.4 }}>
      Analysts currently included in your feed
    </Typography>
    <Typography sx={{ fontSize: 42, fontWeight: 800, mt: 2 }}>
      {subscriptions.length}
    </Typography>
    <Typography sx={{ color: "#E0E7FF", fontSize: 12.5 }}>active subscriptions</Typography>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5 }}>
      <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 34, height: 34, fontSize: 13, borderColor: "#5271FF" } }}>
        {subscriptions.map((subscription) => (
          <Avatar
            key={subscription.id}
            src={subscription.profileImage ? `${apiOrigin}${subscription.profileImage}` : undefined}
            alt={subscription.name}
            title={subscription.name}
            sx={{ bgcolor: "#FFFFFF", color: "#5271FF", fontWeight: 800 }}
          >
            {subscription.name.charAt(0).toUpperCase()}
          </Avatar>
        ))}
      </AvatarGroup>
      <Button onClick={onManage} sx={{ bgcolor: "#FFFFFF", color: "#405EE6", fontWeight: 800, "&:hover": { bgcolor: "#EEF2FF" } }}>
        Manage
      </Button>
    </Stack>
  </Box>
);

export default SubscriptionsPanel;
