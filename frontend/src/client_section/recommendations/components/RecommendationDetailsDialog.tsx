import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type { ClientRecommendationCall } from "../types";

interface RecommendationDetailsDialogProps {
  call: ClientRecommendationCall | null;
  onClose: () => void;
}

const DetailMetric = ({ label, value, color }: { label: string; value: string | null; color: string }) => (
  <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "12px", p: 2, textAlign: "center" }}>
    <Typography sx={{ color: "#64748B", fontSize: 12 }}>{label}</Typography>
    <Typography sx={{ color, fontWeight: 800, fontSize: 20, mt: 0.4 }}>
      {value ? `₹${value}` : "—"}
    </Typography>
  </Box>
);

const RecommendationDetailsDialog = ({ call, onClose }: RecommendationDetailsDialogProps) => (
  <Dialog open={Boolean(call)} onClose={onClose} fullWidth maxWidth="md">
    {call && (
      <>
        <DialogTitle sx={{ pr: 7 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography component="span" sx={{ fontSize: 23, fontWeight: 800 }}>
              {call.stockName}
            </Typography>
            <Chip size="small" label={call.recommendationType} color="success" />
          </Stack>
          <Typography sx={{ color: "#64748B", fontSize: 13, mt: 0.5 }}>
            {call.raName} · {new Date(call.createdAt).toLocaleString("en-IN")}
          </Typography>
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 14 }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
            <DetailMetric label="Entry" value={call.entryPrice} color="#172033" />
            <DetailMetric label="Target" value={call.targetPrice} color="#15803D" />
            <DetailMetric label="Stop loss" value={call.stopLoss} color="#DC2626" />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.75 }}>Research summary</Typography>
            <Typography sx={{ color: "#475569", lineHeight: 1.7 }}>
              {call.summary || "No summary was provided for this call."}
            </Typography>
          </Box>
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.75 }}>Analyst notes</Typography>
            <Typography sx={{ color: "#475569", lineHeight: 1.7 }}>
              {call.analystNotes || "No additional analyst notes."}
            </Typography>
          </Box>
        </DialogContent>
      </>
    )}
  </Dialog>
);

export default RecommendationDetailsDialog;
