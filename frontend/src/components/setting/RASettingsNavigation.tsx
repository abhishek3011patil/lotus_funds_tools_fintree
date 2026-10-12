import { Tab, Tabs } from "@mui/material";

export type RASettingsSection =
  | "account"
  | "subscription"
  | "disclaimer"
  | "message-template"
  | "security"
  | "whatsapp"
  | "telegram-participants"
  | "telegram-connection";

export const isRASettingsSection = (value: string | undefined): value is RASettingsSection =>
  value === "account" ||
  value === "subscription" ||
  value === "disclaimer" ||
  value === "message-template" ||
  value === "security" ||
  value === "whatsapp" ||
  value === "telegram-participants" ||
  value === "telegram-connection";

type RASettingsNavigationProps = {
  activeSection: RASettingsSection;
  onNavigate: (section: RASettingsSection) => void;
};

const navigationItems = [
  { id: "account" as const, label: "Account" },
  { id: "subscription" as const, label: "Subscription" },
  { id: "disclaimer" as const, label: "Disclaimer" },
  { id: "message-template" as const, label: "Message Template" },
  { id: "security" as const, label: "Security" },
  { id: "whatsapp" as const, label: "WhatsApp" },
  { id: "telegram-participants" as const, label: "Telegram Participants" },
  { id: "telegram-connection" as const, label: "Telegram" },
];

const RASettingsNavigation = ({ activeSection, onNavigate }: RASettingsNavigationProps) => (
  <Tabs
    component="nav"
    aria-label="RA settings sections"
    value={activeSection}
    onChange={(_, value: RASettingsSection) => onNavigate(value)}
    variant="scrollable"
    scrollButtons="auto"
    sx={{
      borderBottom: 1,
      borderColor: "divider",
      px: 2,
    }}
  >
    {navigationItems.map((item) => <Tab key={item.id} value={item.id} label={item.label} />)}
  </Tabs>
);

export default RASettingsNavigation;
