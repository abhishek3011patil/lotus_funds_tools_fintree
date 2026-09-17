import { useRef, useState } from "react";
import { Alert, Box, Button, IconButton, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseIcon from "@mui/icons-material/Close";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx";
const EXTENSIONS = new Set(ACCEPT.split(","));
const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

export default function RecommendationMediaUpload({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  return (
    <Box sx={{ minWidth: 0 }}>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        aria-label="Recommendation attachments"
        disabled={disabled}
        style={{ display: "none" }}
        onChange={event => {
          const selected = Array.from(event.target.files || []);
          event.target.value = "";
          setError("");
          const invalid = selected.find(file =>
            !EXTENSIONS.has(`.${file.name.split(".").pop()?.toLowerCase()}`) || file.size > MAX_BYTES
          );
          if (invalid) {
            setError(`${invalid.name}: use a supported file type, up to 5 MB per file.`);
            return;
          }
          const added = selected.filter(file => !files.some(existing =>
            existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified
          ));
          if (files.length + added.length > MAX_FILES) {
            setError("You can attach up to 10 files. Remove a file before adding more.");
            return;
          }
          onChange([...files, ...added]);
        }}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={<CloudUploadOutlinedIcon />}
        disabled={disabled}
        onClick={() => input.current?.click()}
        sx={{ textTransform: "none" }}
      >
        Upload Media{files.length > 0 ? ` (${files.length}/10)` : ""}
      </Button>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Up to 10 files, 5 MB each. Images (JPG, PNG, WEBP, GIF), PDF, Word, Excel, CSV, TXT and PowerPoint.
      </Typography>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {files.map((file, index) => (
        <Box key={`${file.name}-${file.size}-${file.lastModified}`} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Typography variant="body2" sx={{ flex: 1, overflowWrap: "anywhere", minWidth: 0 }}>
            {file.name} ({Math.max(1, Math.ceil(file.size / 1024))} KB)
          </Typography>
          <IconButton
            size="small"
            aria-label={`Remove ${file.name}`}
            disabled={disabled}
            onClick={() => {
              onChange(files.filter((_, fileIndex) => index !== fileIndex));
              setError("");
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}
