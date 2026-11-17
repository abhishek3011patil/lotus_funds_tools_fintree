import PasteableFileInput from "./PasteableFileInput";
import { useRef, useState } from "react";
import { Alert, Box, Button, Collapse, IconButton, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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
  const [filesExpanded, setFilesExpanded] = useState(false);

  return (
    <Box sx={{ minWidth: 0 }}>
      <PasteableFileInput
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
      {files.length > 0 && (
        <Box sx={{ mt: 1.5, p: 1.25, border: "1px solid #B9CDF5", borderRadius: 2, bgcolor: "#F4F8FF" }}>
          <Button
            fullWidth
            size="small"
            aria-expanded={filesExpanded}
            aria-controls="recommendation-attached-files"
            onClick={() => setFilesExpanded(expanded => !expanded)}
            endIcon={filesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 800, color: "#23447C", px: 0.5 }}
          >
            Attached files ({files.length})
          </Button>
          <Collapse in={filesExpanded}>
            <Box id="recommendation-attached-files" sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
              {files.map((file, index) => {
              const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
              return (
                <Box key={`${file.name}-${file.size}-${file.lastModified}`} sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.75, minWidth: 0, border: "1px solid #DCE6F5", borderRadius: 1.5, bgcolor: "#FFFFFF" }}>
                  <Box sx={{ width: 32, height: 32, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 1, bgcolor: isImage ? "#E8F1FF" : "#F1F3F7", color: isImage ? "#2563A6" : "#526075" }}>
                    {isImage ? <ImageOutlinedIcon fontSize="small" /> : <DescriptionOutlinedIcon fontSize="small" />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere", lineHeight: 1.3 }}>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{isImage ? "Image" : "Document"} · {Math.max(1, Math.ceil(file.size / 1024))} KB</Typography>
                  </Box>
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
              );
              })}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
