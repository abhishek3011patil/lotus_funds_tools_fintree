import { useId, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export interface RecommendationAttachment {
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
}

function AttachmentPreview({ attachment, symbol }: { attachment: RecommendationAttachment; symbol: string }) {
  const [failed, setFailed] = useState(false);
  // Older records contain absolute Windows/Linux paths; new ones use /uploads/.
  const filename = attachment.url.replace(/\\/g, "/").split("/").pop() || "";
  const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const mediaUrl = `${apiBase}/uploads/${encodeURIComponent(filename)}`;
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(filename);

  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
      <Typography fontWeight={600} sx={{ overflowWrap: "anywhere", mb: 1 }}>
        {attachment.name || filename}
      </Typography>
      {isImage ? (
        failed ? (
          <Alert severity="error">This image could not be loaded. The uploaded file may no longer be available.</Alert>
        ) : (
          <Box
            component="img"
            src={mediaUrl}
            crossOrigin="anonymous"
            alt={`${attachment.name || filename} — uploaded media for ${symbol}`}
            onError={() => setFailed(true)}
            sx={{ display: "block", width: "100%", maxHeight: "45vh", objectFit: "contain", bgcolor: "#f8fafc" }}
          />
        )
      ) : (
        <Typography variant="body2" color="text.secondary">
          Open this attachment in a new tab to view or download it.
        </Typography>
      )}
      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {filename.split(".").pop()?.toUpperCase()}
          {attachment.size ? ` · ${Math.max(1, Math.ceil(attachment.size / 1024))} KB` : ""}
        </Typography>
        <Button href={mediaUrl} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />} size="small" aria-label={`Open ${attachment.name || filename}`}>
          Open file
        </Button>
      </Box>
    </Paper>
  );
}

export default function RecommendationMediaButton({ filePath, attachments, symbol }: {
  filePath?: string | null;
  attachments?: RecommendationAttachment[] | null;
  symbol: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const media = Array.isArray(attachments) ? attachments.filter(file => file?.url) : [];
  if (!media.length && filePath?.trim()) {
    media.push({ url: filePath, name: filePath.replace(/\\/g, "/").split("/").pop() || "Attachment" });
  }
  if (!media.length) {
    return <Typography variant="body2" color="text.secondary">No media</Typography>;
  }

  return (
    <>
      <Button
        size="small"
        startIcon={<AttachFileIcon />}
        aria-label={`View media for ${symbol} (${media.length} ${media.length === 1 ? "file" : "files"})`}
        sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        onClick={() => setOpen(true)}
      >
        View media ({media.length})
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" aria-labelledby={titleId}>
        <DialogTitle id={titleId}>Media — {symbol} ({media.length})</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: media.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr" }, gap: 2 }}>
            {media.map((attachment, index) => (
              <AttachmentPreview key={`${attachment.url}-${index}`} attachment={attachment} symbol={symbol} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
}
