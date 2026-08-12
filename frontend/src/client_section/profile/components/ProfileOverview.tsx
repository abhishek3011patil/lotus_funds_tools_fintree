import { Avatar, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { useNavigate } from "react-router-dom";
import type { ClientProfile } from "../types";

type ProfileOverviewProps = { profile: ClientProfile };

const ProfileOverview = ({ profile }: ProfileOverviewProps) => {
  const navigate = useNavigate();
  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#E5EAF2", p: { xs: 2.25, sm: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: "#5271FF", fontSize: 28, fontWeight: 800 }}>
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h5" fontWeight={800} color="#18213A">{profile.name}</Typography>
              <Chip label={profile.status || "Active"} color="success" size="small" sx={{ textTransform: "capitalize", fontWeight: 700 }} />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.4 }}>{profile.email}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <Stack direction="row" spacing={1.3} alignItems="center">
            <EmailOutlinedIcon color="action" />
            <Box><Typography variant="caption" color="text.secondary">Email address</Typography><Typography variant="body2" fontWeight={650}>{profile.email}</Typography></Box>
          </Stack>
          <Stack direction="row" spacing={1.3} alignItems="center">
            <CalendarMonthOutlinedIcon color="action" />
            <Box><Typography variant="caption" color="text.secondary">Member since</Typography><Typography variant="body2" fontWeight={650}>{memberSince}</Typography></Box>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" fontWeight={750} mb={1.5}>Account shortcuts</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          <Button onClick={() => navigate("/client/analysts")} variant="outlined" startIcon={<GroupsOutlinedIcon />} sx={{ justifyContent: "flex-start", p: 1.6, textTransform: "none", borderColor: "#DDE3ED", color: "#26324B", bgcolor: "#fff" }}>
            Manage subscriptions
          </Button>
          <Button onClick={() => navigate("/client/notifications")} variant="outlined" startIcon={<NotificationsNoneOutlinedIcon />} sx={{ justifyContent: "flex-start", p: 1.6, textTransform: "none", borderColor: "#DDE3ED", color: "#26324B", bgcolor: "#fff" }}>
            Notification centre
          </Button>
          <Button component="a" href="mailto:support@tarkashh.com" variant="outlined" startIcon={<HelpOutlineRoundedIcon />} sx={{ justifyContent: "flex-start", p: 1.6, textTransform: "none", borderColor: "#DDE3ED", color: "#26324B", bgcolor: "#fff" }}>
            Help & support
          </Button>
        </Box>
      </Box>
    </Stack>
  );
};

export default ProfileOverview;
