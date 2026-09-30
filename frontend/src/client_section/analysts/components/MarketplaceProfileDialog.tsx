import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Alert, Avatar, Box, Chip, CircularProgress, Dialog, DialogContent,
  IconButton, Stack, Typography,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import { fetchMarketplaceProfile } from "../api";
import type { MarketplaceProfileResponse } from "../types";

type Selection = { type: "analyst" | "broker"; id: string; name: string };

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const safeWebsite = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const Detail = ({ label, value }: { label: string; value?: string | null }) => (
  <Box>
    <Typography sx={{ color: "#94A3B8", fontSize: 11.5, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</Typography>
    <Typography sx={{ color: "#1E293B", fontSize: 14, fontWeight: 650, mt: .35, overflowWrap: "anywhere" }}>{value || "—"}</Typography>
  </Box>
);

const Metric = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
  <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #EEF2F7", borderRadius: 2.5, p: 1.75 }}>
    <Typography sx={{ color: accent || "#172033", fontWeight: 850, fontSize: 21 }}>{value}</Typography>
    <Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 650, mt: .25 }}>{label}</Typography>
  </Box>
);

export default function MarketplaceProfileDialog({ selection, onClose }: {
  selection: Selection | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<MarketplaceProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    setData(null); setError("");
    fetchMarketplaceProfile(selection.type, selection.id, period, controller.signal)
      .then(setData)
      .catch((requestError) => {
        if (requestError?.code !== "ERR_CANCELED") {
          setError(requestError?.response?.data?.message || "Unable to load this profile.");
        }
      });
    return () => controller.abort();
  }, [selection, period]);

  const profile = data?.profile;
  const performance = data?.performance;
  const websiteUrl = safeWebsite(profile?.website);
  const details = profile?.type === "broker"
    ? [
        ["Legal name", profile.legalName], ["Entity type", profile.entityType],
        ["SEBI category", profile.category], ["SEBI registration", profile.sebiRegistrationNumber],
        ["Registered on", formatDate(profile.registrationDate)], ["Registration validity", formatDate(profile.registrationValidity)],
        ["Exchanges", profile.exchanges], ["Segments", profile.segments],
      ]
    : [
        ["Organization", profile?.organization], ["SEBI registration", profile?.sebiRegistrationNumber],
        ["NISM certificate number", profile?.nismCertificateNumber],
        ["Registered on", formatDate(profile?.registrationDate)], ["Registration validity", formatDate(profile?.registrationValidity)],
        ["Market experience", profile?.marketExperience], ["Expertise", profile?.expertise],
        ["Markets", profile?.markets],
      ];

  return (
    <Dialog open={Boolean(selection)} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3.5 }, m: { xs: 0, sm: 2 }, maxHeight: { xs: "100%", sm: "calc(100% - 32px)" } } }}>
      <DialogContent sx={{ p: { xs: 2.25, sm: 3.5 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar sx={{ width: 58, height: 58, bgcolor: profile?.type === "broker" ? "#0F766E" : "#5B73FF", fontWeight: 850, fontSize: 22 }}>
            {(profile?.name || selection?.name || "?").slice(0, 1).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h2" sx={{ fontSize: { xs: 22, sm: 27 }, fontWeight: 850, color: "#172033" }}>{profile?.name || selection?.name}</Typography>
            <Typography sx={{ color: "#64748B", fontSize: 14, mt: .25 }}>{selection?.type === "broker" ? "Verified broker" : "Verified Research Analyst"}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close profile"><CloseRoundedIcon /></IconButton>
        </Stack>

        {!data && !error && <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

        {profile && performance && <>
          {profile.shortBio && <Typography sx={{ color: "#475569", lineHeight: 1.7, mt: 2.5 }}>{profile.shortBio}</Typography>}
          <Typography sx={{ fontWeight: 800, fontSize: 17, mt: 3, mb: 1.75 }}>Profile details</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2.25 }}>
            {details.map(([label, value]) => <Detail key={label} label={label || ""} value={value} />)}
          </Box>
          {websiteUrl && <Stack direction="row" alignItems="center" spacing={.5} sx={{ mt: 2 }}><OpenInNewRoundedIcon sx={{ fontSize: 16, color: "#5B73FF" }} /><Typography component="a" href={websiteUrl} target="_blank" rel="noreferrer" sx={{ color: "#4F63E7", fontWeight: 700, fontSize: 14 }}>{profile.website}</Typography></Stack>}
          {profile.type === "broker" && Boolean(profile.analysts?.length) && <Box sx={{ mt: 2.5 }}><Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 750, mb: 1 }}>ASSOCIATED ANALYSTS</Typography><Stack direction="row" gap={1} flexWrap="wrap">{profile.analysts?.map((analyst) => <Chip key={analyst.id} label={analyst.name} />)}</Stack></Box>}

          {profile.type === "analyst" && <><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mt: 3.5, mb: 1.75 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Performance</Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={period}
              onChange={(_event, value: "monthly" | "yearly" | null) => value && setPeriod(value)}
              aria-label="Performance period"
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, "& .MuiToggleButton-root": { px: 2, py: .65, textTransform: "none", fontWeight: 750 } }}
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.25 }}>
            <Metric label="Total calls" value={performance.total} />
            <Metric label="Accuracy" value={`${performance.accuracy}%`} accent="#16A34A" />
            <Metric label="Target strike" value={`${performance.strike}%`} accent="#4F46E5" />
            <Metric label="Risk : reward" value={performance.rr === null ? "—" : `${performance.rr}:1`} />
            <Metric label="Active" value={performance.active} />
            <Metric label="Exited" value={performance.exited} />
            <Metric label="Stop-loss hit" value={`${performance.sl}%`} accent="#DC2626" />
            <Metric label="Early exits" value={`${performance.early}%`} />
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
            <Typography sx={{ color: "#64748B", fontSize: 12.5, fontWeight: 700 }}>Last outcomes</Typography>
            {performance.last.length === 0 ? <Typography sx={{ color: "#94A3B8", fontSize: 12.5 }}>No exited calls yet</Typography> : performance.last.map((outcome, index) => <Box key={index} title={outcome === "g" ? "Profitable" : outcome === "r" ? "Adverse" : "Neutral"} sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: outcome === "g" ? "#22C55E" : outcome === "r" ? "#EF4444" : "#CBD5E1" }} />)}
          </Stack>
          </>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
