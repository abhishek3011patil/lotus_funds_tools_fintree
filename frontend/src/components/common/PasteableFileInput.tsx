import { forwardRef, useCallback, useId, useRef, useState, type ClipboardEvent, type InputHTMLAttributes } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

// Pasted and dropped files use the original file input's change handler, so
// each upload keeps its existing validation, previews, and submission logic.
const PasteableFileInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasteableFileInput(props, forwardedRef) {
  const input = useRef<HTMLInputElement | null>(null);
  const browsing = useRef(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const titleId = useId();
  const setRef = useCallback((element: HTMLInputElement | null) => {
    input.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }, [forwardedRef]);

  const applyFiles = (files: File[], fromClipboard: boolean) => {
    const target = input.current;
    if (!target || target.disabled) return;
    const accepts = target.accept.toLowerCase().split(",").map(value => value.trim()).filter(Boolean);
    const supported = files.filter(file => {
      const type = file.type.toLowerCase();
      if (fromClipboard && !type.startsWith("image/") && type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return false;
      return !accepts.length || accepts.some(accept =>
        accept.startsWith(".") ? file.name.toLowerCase().endsWith(accept) :
        accept.endsWith("/*") ? type.startsWith(accept.slice(0, -1)) : type === accept
      );
    });
    if (!supported.length || supported.length !== files.length) {
      setMessage("This upload does not accept one or more of those files. Check the supported file types and try again.");
      return;
    }
    const transfer = new DataTransfer();
    for (const file of (target.multiple ? supported : supported.slice(0, 1))) transfer.items.add(file);
    target.files = transfer.files;
    target.dispatchEvent(new Event("change", { bubbles: true }));
    setMessage("");
  };
  const paste = (event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData.files);
    if (!files.length) { setMessage("Copy an image or PDF first, then paste it here."); return; }
    event.preventDefault(); event.stopPropagation(); applyFiles(files, true);
  };
  const close = () => { setOpen(false); setMessage(""); setDragging(false); };
  return <>
    <input {...props} type="file" ref={setRef} onClick={event => {
      if (browsing.current) { browsing.current = false; props.onClick?.(event); return; }
      event.preventDefault(); event.stopPropagation();
      if (!props.disabled) { setMessage(""); setOpen(true); }
    }} onChange={event => { close(); props.onChange?.(event); }} />
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby={titleId} onPaste={paste}>
      <DialogTitle id={titleId} sx={{ fontWeight: 700 }}>Upload or paste a file</DialogTitle>
      <DialogContent>
        <Box tabIndex={0} role="region" aria-label="Drop or paste files here"
          onDragEnter={event => { event.preventDefault(); setDragging(true); }}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={event => { event.preventDefault(); setDragging(false); }}
          onDrop={event => { event.preventDefault(); setDragging(false); applyFiles(Array.from(event.dataTransfer.files), false); }}
          sx={{ border: "2px dashed", borderColor: dragging ? "primary.main" : "#CBD5E1", borderRadius: 3, bgcolor: dragging ? "#EDF2FF" : "#F8FAFC", minHeight: 220, px: 3, py: 4, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, outlineColor: "primary.main" }}>
          <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: "primary.main" }} />
          <Typography fontWeight={700}>Drag and drop your file here</Typography>
          <Typography variant="body2" color="text.secondary">Or paste a copied screenshot, image or PDF with Ctrl+V (Cmd+V on Mac)</Typography>
          <Button variant="contained" onClick={() => { browsing.current = true; input.current?.click(); browsing.current = false; }} sx={{ textTransform: "none", mt: 1 }}>Browse files</Button>
        </Box>
        {message && <Alert severity="warning" sx={{ mt: 2 }}>{message}</Alert>}
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1.5 }}>The supported file types and size limits for this upload still apply. PDF paste availability depends on your browser.</Typography>
      </DialogContent>
      <DialogActions><Button onClick={close}>Cancel</Button></DialogActions>
    </Dialog>
  </>;
});
export default PasteableFileInput;
