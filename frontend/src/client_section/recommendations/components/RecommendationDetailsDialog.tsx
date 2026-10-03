import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import RecommendationMediaButton from "../../../components/common/RecommendationMediaButton";
import type { ClientRecommendationCall } from "../types";
import { formatIndiaDateTime, formatInr } from "../../../utils/formatters";

interface RecommendationDetailsDialogProps {
  call: ClientRecommendationCall | null;
  onClose: () => void;
}

const DetailMetric = ({ label, value, color = "#172033" }: { label: string; value: string; color?: string }) => (
  <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "12px", p: 2, minWidth: 0 }}>
    <Typography sx={{ color: "#64748B", fontSize: 12 }}>{label}</Typography>
    <Typography sx={{ color, fontWeight: 800, fontSize: 18, mt: 0.4, overflowWrap: "anywhere" }}>
      {value}
    </Typography>
  </Box>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mt: 2.5 }}>
    <Typography sx={{ fontWeight: 800, mb: 0.75, color: "#172033" }}>{title}</Typography>
    {children}
  </Box>
);

const RecommendationDetailsDialog = ({ call, onClose }: RecommendationDetailsDialogProps) => {
  if (!call) return null;

  const entry = call.entryPrice
    ? formatInr(call.entryPrice)
    : call.entryPriceLow && call.entryPriceUpper
      ? `${formatInr(call.entryPriceLow)} – ${formatInr(call.entryPriceUpper)}`
      : formatInr(call.entryPriceLow || call.entryPriceUpper);
  const targets = [call.targetPrice, call.targetPrice2, call.targetPrice3].filter(Boolean) as string[];
  const stopLosses = [call.stopLoss, call.stopLoss2, call.stopLoss3].filter(Boolean) as string[];
  const actionIsSell = call.recommendationType?.toUpperCase() === "SELL";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 7, pb: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Typography component="span" sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 850 }}>
            {call.displayName || call.stockName}
          </Typography>
          <Chip
            size="small"
            label={call.recommendationType}
            sx={{ bgcolor: actionIsSell ? "#FEE2E2" : "#DCFCE7", color: actionIsSell ? "#B91C1C" : "#15803D", fontWeight: 800 }}
          />
          <Chip size="small" variant="outlined" label={call.status === "PUBLISHED" ? "Active" : "Closed"} />
          {call.versionType === "ERRATA" && <Chip size="small" color="warning" label={`Errata v${call.versionNumber || ""}`} />}
        </Stack>
        <Typography sx={{ color: "#64748B", fontSize: 13, mt: 0.75 }}>
          {call.raName}{call.raOrganization ? ` · ${call.raOrganization}` : ""}
          {call.sebiRegistration ? ` · SEBI ${call.sebiRegistration}` : ""}
        </Typography>
        <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.25 }}>
          Published {formatIndiaDateTime(call.createdAt)}
        </Typography>
        <IconButton aria-label="Close call details" onClick={onClose} sx={{ position: "absolute", right: 16, top: 14 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {[call.exchangeType, call.marketType, call.callType, call.tradeType, call.holdingPeriod]
            .filter(Boolean)
            .map((label) => <Chip key={label} size="small" label={label} sx={{ bgcolor: "#F1F5F9" }} />)}
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.25, mt: 2 }}>
          <DetailMetric label="Entry" value={entry} />
          <DetailMetric label="Targets" value={targets.length ? targets.map(value => formatInr(value)).join(" · ") : "—"} color="#15803D" />
          <DetailMetric label="Stop loss" value={stopLosses.length ? stopLosses.map(value => formatInr(value)).join(" · ") : "—"} color="#DC2626" />
          <DetailMetric label="Risk : Reward" value={call.riskRewardRatio ? `1 : ${Number(call.riskRewardRatio).toFixed(2)}` : "—"} color="#405EE6" />
        </Box>

        {call.versionType === "ERRATA" && call.errataReason && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Correction:</strong> {call.errataReason}
          </Alert>
        )}

        <Section title="Research thesis">
          <Typography sx={{ color: "#475569", lineHeight: 1.7 }}>
            {call.summary || "No research thesis was provided for this call."}
          </Typography>
        </Section>

        {call.underlyingStudy && (
          <Section title="Studies used">
            <Typography sx={{ color: "#475569", lineHeight: 1.7 }}>{call.underlyingStudy}</Typography>
          </Section>
        )}

        <Section title="Analyst notes">
          <Typography sx={{ color: "#475569", lineHeight: 1.7 }}>
            {call.analystNotes || "No additional analyst notes."}
          </Typography>
        </Section>

        <Section title="Call timeline">
          <Stack spacing={1} sx={{ borderLeft: "2px solid #DCE6FF", pl: 2 }}>
            <Box><Typography fontWeight={750}>Research published</Typography><Typography variant="caption" color="text.secondary">{formatIndiaDateTime(call.createdAt)}</Typography></Box>
            {call.versionType === "ERRATA" && <Box><Typography fontWeight={750}>Errata issued</Typography><Typography variant="caption" color="text.secondary">This version replaced the original call values.</Typography></Box>}
            {call.closedAt && <Box><Typography fontWeight={750}>Call closed at {formatInr(call.exitPrice)}</Typography><Typography variant="caption" color="text.secondary">{formatIndiaDateTime(call.closedAt)}</Typography></Box>}
          </Stack>
        </Section>

        <Section title="Attachments">
          <RecommendationMediaButton
            symbol={call.stockName}
            attachments={call.attachments.map((item) => ({ ...item, name: item.name || "Attachment" }))}
          />
        </Section>

        <Divider sx={{ my: 2.5 }} />
        <Typography sx={{ color: "#64748B", fontSize: 12, lineHeight: 1.65 }}>
          <strong>Disclaimer:</strong> {call.disclaimer || "Investment in securities markets is subject to market risks. Read all related documents carefully before investing."}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendationDetailsDialog;
