import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { Avatar, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import type { ClientBroker } from "../types";

const formatPrice = (amountPaise: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountPaise / 100);

export default function BrokerCard({ broker, subscribing, cancelling, onSubscribe, onCancel, onViewProfile }: {
  broker: ClientBroker;
  subscribing: boolean;
  cancelling: boolean;
  onSubscribe: (broker: ClientBroker) => void;
  onCancel: (broker: ClientBroker) => void;
  onViewProfile: (broker: ClientBroker) => void;
}) {
  return <Box component="article" sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: "24px", border: "1px solid #EAEFF5", bgcolor: "#FFF", p: { xs: 2.5, sm: 3 }, boxShadow: "0 10px 30px rgba(15,23,42,.04)", transition: "180ms ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 36px rgba(15,23,42,.08)" } }}>
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Avatar sx={{ width: 68, height: 68, bgcolor: "#0F766E", boxShadow: "0 6px 16px rgba(15,118,110,.25)" }}><StorefrontRoundedIcon /></Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={.75}><Typography variant="h6" sx={{ fontWeight: 800, fontSize: 19 }}>{broker.name}</Typography><VerifiedRoundedIcon sx={{ color: "#4F8CFF", fontSize: 20 }} /></Stack>
        {broker.sebiRegistrationNumber && <Chip label={`SEBI: ${broker.sebiRegistrationNumber}`} size="small" sx={{ mt: .75, bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700, height: 24 }} />}
        {broker.name !== broker.legalName && <Typography sx={{ color: "#94A3B8", fontSize: 13, mt: .75 }}>{broker.legalName}</Typography>}
      </Box>
    </Stack>
    <Typography sx={{ color: "#475569", fontSize: 14, lineHeight: 1.55, mt: 2.5, minHeight: 44 }}>
      {broker.category || broker.entityType || "Verified broker"} offering research from its associated analysts.
    </Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}>
      {broker.exchanges && <Chip label={broker.exchanges} size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700 }} />}
      {broker.segments && <Chip label={broker.segments} size="small" sx={{ bgcolor: "#DCFCE7", color: "#16A34A", fontWeight: 700 }} />}
    </Stack>
    <Box sx={{ mt: 2.5, mb: 2.5, py: 2, px: 1, bgcolor: "#F8FAFC", borderRadius: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center" }}>
      {[[broker.analystCount, "Analysts"], [broker.recommendationCount, "Recommendations"], [broker.liveCallCount, "Live Calls"]].map(([value, label], index) => <Box key={String(label)} sx={{ borderRight: index < 2 ? "1px solid #E2E8F0" : 0 }}><Typography sx={{ fontSize: 22, fontWeight: 800 }}>{value}</Typography><Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 600 }}>{label}</Typography></Box>)}
    </Box>
    <Button variant="outlined" onClick={() => onViewProfile(broker)} sx={{ mb: 1.5, borderRadius: "12px", textTransform: "none", fontWeight: 800, borderColor: "#D7DEEA", color: "#334155" }}>View Profile</Button>
    <Box sx={{ mt: "auto", pt: 2.5, borderTop: "1px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Box><Typography sx={{ fontSize: 24, fontWeight: 800 }}>{formatPrice(broker.pricePaise, broker.currency)}</Typography><Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 700 }}>/{broker.durationDays} Days Plan</Typography></Box>
      <Button variant={broker.isSubscribed ? "outlined" : "contained"} disabled={subscribing || cancelling} onClick={() => broker.isSubscribed ? onCancel(broker) : onSubscribe(broker)} sx={{ minWidth: 110, height: 42, borderRadius: "12px", textTransform: "none", fontWeight: 800, color: broker.isSubscribed ? "#991B1B" : "#FFF", borderColor: broker.isSubscribed ? "#FECDD3" : "transparent", bgcolor: broker.isSubscribed ? "#FFF1F2" : "#5B73FF", "&:hover": { bgcolor: broker.isSubscribed ? "#FFE4E6" : "#4A62EE" } }}>
        {subscribing || cancelling ? <CircularProgress size={20} color="inherit" /> : broker.isSubscribed ? "Cancel" : "Subscribe"}
      </Button>
    </Box>
  </Box>;
}
