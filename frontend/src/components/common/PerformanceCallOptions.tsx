import { useState, type MouseEvent } from "react";
import axios from "axios";
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Menu, MenuItem, Snackbar, Stack, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  RecommendationMediaDialog,
  resolveRecommendationMedia,
  type RecommendationAttachment,
} from "./RecommendationMediaButton";

type PerformanceCallOptionsProps = {
  callId?: string;
  filePath?: string | null;
  attachments?: RecommendationAttachment[] | null;
  symbol: string;
};

type TelegramDelivery = {
  id: string;
  recipientName: string;
  entityType: "USER" | "GROUP" | "CHANNEL";
  status: "SENT" | "PARTIAL" | "FAILED" | "DELETING" | "DELETED" | "DELETE_FAILED";
  errorMessage: string | null;
  sentAt: string;
  messageCount: number;
};

export default function PerformanceCallOptions({ callId, filePath, attachments, symbol }: PerformanceCallOptionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [telegramRecipientCount, setTelegramRecipientCount] = useState(0);
  const [telegramDeliveries, setTelegramDeliveries] = useState<TelegramDelivery[]>([]);
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false);
  const [deliveryStatusError, setDeliveryStatusError] = useState("");
  const [checkingTelegram, setCheckingTelegram] = useState(false);
  const [deletingTelegram, setDeletingTelegram] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const media = resolveRecommendationMedia(filePath, attachments);

  const loadTelegramStatus = async () => {
    if (!callId) return;
    setCheckingTelegram(true);
    try {
      const token = localStorage.getItem("token") || "";
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/telegram/research-call/${encodeURIComponent(callId)}/messages`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTelegramRecipientCount(Number(response.data.recipientCount || 0));
      setTelegramDeliveries(Array.isArray(response.data.deliveries) ? response.data.deliveries : []);
      setDeliveryStatusError("");
    } catch {
      setTelegramRecipientCount(0);
      setTelegramDeliveries([]);
      setDeliveryStatusError("Unable to load Telegram delivery records.");
    } finally {
      setCheckingTelegram(false);
    }
  };

  const openOptions = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    void loadTelegramStatus();
  };

  const deleteTelegramMessages = async () => {
    setAnchorEl(null);
    if (!callId || telegramRecipientCount === 0) return;
    const confirmed = window.confirm(
      `Ask Telegram to delete this call's sent messages and attachments across ${telegramRecipientCount} delivery record(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingTelegram(true);
    try {
      const token = localStorage.getItem("token") || "";
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/telegram/research-call/${encodeURIComponent(callId)}/messages`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const deletedCount = Number(response.data.deletedCount || 0);
      const failedCount = Number(response.data.failedCount || 0);
      setTelegramRecipientCount(failedCount);
      setNotice(response.data.message || `Deleted for ${deletedCount} recipient(s).`);
    } catch (error) {
      setNotice(axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to delete Telegram messages."
        : "Unable to delete Telegram messages.");
    } finally {
      setDeletingTelegram(false);
    }
  };

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<MoreHorizIcon />} onClick={openOptions}>
        Options
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem disabled={!media.length} onClick={() => { setAnchorEl(null); setMediaOpen(true); }}>
          <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
          {media.length ? `Media (${media.length})` : "Media (none attached)"}
        </MenuItem>
        <MenuItem disabled={!callId} onClick={() => { setAnchorEl(null); setDeliveryStatusOpen(true); void loadTelegramStatus(); }}>
          <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          Telegram delivery status
        </MenuItem>
        <MenuItem
          disabled={!callId || checkingTelegram || deletingTelegram || telegramRecipientCount === 0}
          onClick={() => void deleteTelegramMessages()}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          {deletingTelegram
            ? "Deleting Telegram messages…"
            : checkingTelegram
              ? "Checking Telegram messages…"
              : telegramRecipientCount
                ? `Delete Telegram messages (${telegramRecipientCount})`
                : "No tracked Telegram messages"}
        </MenuItem>
      </Menu>
      <Dialog open={deliveryStatusOpen} onClose={() => setDeliveryStatusOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Telegram delivery status</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sent means Telegram accepted the message. It does not confirm delivery to a device or that the recipient read it.
          </Typography>
          {checkingTelegram ? <Typography>Loading delivery records…</Typography>
            : deliveryStatusError ? <Alert severity="warning">{deliveryStatusError}</Alert>
            : telegramDeliveries.length === 0 ? <Typography color="text.secondary">No tracked Telegram messages for this call.</Typography>
            : <Stack spacing={1}>
              {telegramDeliveries.map(delivery => <Box key={delivery.id} sx={{ p: 1.5, border: "1px solid #E2E8F0", borderRadius: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography fontWeight={700}>{delivery.recipientName}</Typography>
                  <Chip size="small" label={({
                    SENT: "Sent to Telegram",
                    PARTIAL: "Message sent, attachment issue",
                    FAILED: "Not sent",
                    DELETING: "Removing…",
                    DELETED: "Removed",
                    DELETE_FAILED: "Could not remove",
                  } as Record<string, string>)[delivery.status] || delivery.status.replaceAll("_", " ").toLowerCase()}
                    color={delivery.status === "SENT" ? "success" : delivery.status === "FAILED" || delivery.status === "DELETE_FAILED" ? "error" : "default"} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {delivery.entityType.toLowerCase()} · {new Date(delivery.sentAt).toLocaleString()} · {delivery.messageCount} message{delivery.messageCount === 1 ? "" : "s"}
                </Typography>
                {delivery.errorMessage && <Typography variant="body2" color="error.main">{delivery.errorMessage}</Typography>}
              </Box>)}
            </Stack>}
        </DialogContent>
      </Dialog>
      <RecommendationMediaDialog
        filePath={filePath}
        attachments={attachments}
        symbol={symbol}
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
      />
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice("")}>
        <Alert severity={notice.toLowerCase().includes("unable") || notice.toLowerCase().includes("could not") ? "warning" : "success"}
          onClose={() => setNotice("")} sx={{ width: "100%" }}>
          {notice}
        </Alert>
      </Snackbar>
    </>
  );
}
