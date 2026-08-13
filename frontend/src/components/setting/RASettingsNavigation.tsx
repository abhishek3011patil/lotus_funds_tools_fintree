import { Button, Paper, Stack } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import TelegramIcon from "@mui/icons-material/Telegram";

export type RASettingsSection =
  | "account"
  | "subscription"
  | "security"
  | "research"
  | "whatsapp"
  | "telegram-participants"
  | "telegram-connection";

type RASettingsNavigationProps = {
  activeSection: RASettingsSection;
  onNavigate: (section: RASettingsSection) => void;
};

const navigationItems = [
  { id: "account" as const, label: "Account", icon: PersonOutlineRoundedIcon },
  { id: "subscription" as const, label: "Subscription", icon: WorkspacePremiumOutlinedIcon },
  { id: "security" as const, label: "Security", icon: LockOutlinedIcon },
  { id: "research" as const, label: "Research setup", icon: TuneRoundedIcon },
  { id: "whatsapp" as const, label: "WhatsApp", icon: WhatsAppIcon },
  { id: "telegram-participants" as const, label: "Telegram participants", icon: GroupsOutlinedIcon },
  { id: "telegram-connection" as const, label: "Telegram connection", icon: TelegramIcon },
];

const RASettingsNavigation = ({ activeSection, onNavigate }: RASettingsNavigationProps) => (
  <Paper
    component="nav"
    aria-label="RA settings sections"
    variant="outlined"
    sx={{
      borderRadius: 3,
      borderColor: "#E5EAF2",
      p: 1.2,
      position: { md: "sticky" },
      top: { md: 16 },
    }}
  >
    <Stack direction={{ xs: "row", md: "column" }} spacing={0.5} sx={{ overflowX: "auto" }}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;

        return (
          <Button
            key={item.id}
            startIcon={<Icon />}
            onClick={() => onNavigate(item.id)}
            aria-current={active ? "location" : undefined}
            sx={{
              justifyContent: "flex-start",
              whiteSpace: "nowrap",
              textTransform: "none",
              fontWeight: active ? 750 : 600,
              color: active ? "#344FC7" : "#526078",
              bgcolor: active ? "#EEF1FF" : "transparent",
              px: 1.5,
              py: 1.15,
              "&:hover": { bgcolor: active ? "#E6EAFF" : "#F5F7FA" },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  </Paper>
);

export default RASettingsNavigation;
