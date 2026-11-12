import { useState, type MouseEvent } from "react";
import axios from "axios";
import { Alert, Button, Menu, MenuItem, Snackbar } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

export default function PerformanceCallOptions({ callId, filePath, attachments, symbol }: PerformanceCallOptionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [telegramRecipientCount, setTelegramRecipientCount] = useState(0);
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
    } catch {
      setTelegramRecipientCount(0);
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
