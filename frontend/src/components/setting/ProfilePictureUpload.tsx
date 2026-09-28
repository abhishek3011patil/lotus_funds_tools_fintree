import { useEffect, useRef, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Slider, Stack, Typography } from "@mui/material";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import FlipIcon from "@mui/icons-material/Flip";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface Props {
  currentFilename?: string;
  value?: File;
  onChange: (file?: File) => void;
  name: string;
  helperText: string;
  onSave?: (file: File) => Promise<void>;
}

const SIZE = 512;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export default function ProfilePictureUpload({ currentFilename, value, onChange, name, helperText, onSave }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const currentBlob = useRef<Blob | undefined>(undefined);
  const canvas = useRef<HTMLCanvasElement>(null);
  const loadVersion = useRef(0);
  const drag = useRef<{ x: number; y: number; position: { x: number; y: number } } | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>();
  const [selectedUrl, setSelectedUrl] = useState<string>();
  const [source, setSource] = useState<{ image: HTMLImageElement; url: string }>();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMissing, setCurrentMissing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    setCurrentUrl(undefined);
    currentBlob.current = undefined;
    setCurrentMissing(false);
    if (currentFilename) {
      const filename = currentFilename.split(/[/\\]/).pop()!;
      fetch(`${import.meta.env.VITE_API_URL || ""}/uploads/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal: controller.signal,
      }).then(async response => {
        if (!response.ok) throw new Error("Image unavailable");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        currentBlob.current = blob;
        url = URL.createObjectURL(blob);
        setCurrentUrl(url);
      }).catch(() => { if (!controller.signal.aborted) setCurrentMissing(true); });
    }
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [currentFilename]);

  useEffect(() => {
    if (!value) { setSelectedUrl(undefined); return; }
    const url = URL.createObjectURL(value);
    setSelectedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { loadVersion.current++; }, []);

  const reset = () => { setZoom(1); setRotation(0); setFlipped(false); setPosition({ x: 0, y: 0 }); };
  const width = source ? (rotation % 180 ? source.image.naturalHeight : source.image.naturalWidth) : SIZE;
  const height = source ? (rotation % 180 ? source.image.naturalWidth : source.image.naturalHeight) : SIZE;
  const scale = Math.max(SIZE / width, SIZE / height) * zoom;
  const overflowX = (width * scale - SIZE) / 2;
  const overflowY = (height * scale - SIZE) / 2;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !source) return;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, SIZE, SIZE);
    context.save();
    context.translate(SIZE / 2 + position.x * overflowX, SIZE / 2 + position.y * overflowY);
    context.rotate(rotation * Math.PI / 180);
    context.scale(flipped ? -scale : scale, scale);
    context.drawImage(source.image, -source.image.naturalWidth / 2, -source.image.naturalHeight / 2);
    context.restore();
    setPreview(canvas.current!.toDataURL("image/jpeg", 0.9));
  }, [source, zoom, rotation, flipped, position, scale, overflowX, overflowY]);

  const choose = async (file?: File) => {
    if (!file || saving) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image."); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("Choose an image smaller than 5 MB."); return; }
    const version = ++loadVersion.current;
    setLoading(true);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      if (version !== loadVersion.current) { URL.revokeObjectURL(url); return; }
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error("Image too large");
      reset(); setPreview(undefined); setSource({ image, url });
    } catch {
      URL.revokeObjectURL(url);
      if (version === loadVersion.current) setError("This image could not be opened. Try another image under 40 megapixels.");
    } finally { if (version === loadVersion.current) setLoading(false); }
  };

  const apply = () => {
    if (!canvas.current || saving) return;
    setSaving(true);
    canvas.current.toBlob(async blob => {
      if (!blob) { setSaving(false); setError("Unable to prepare your picture. Please try again."); return; }
      try {
        const file = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });
        if (onSave) await onSave(file); else onChange(file);
        setSource(undefined); setError("");
      } catch (error) { setError(error instanceof Error ? error.message : "Unable to save your picture. Please try again."); }
      finally { setSaving(false); }
    }, "image/jpeg", 0.9);
  };

  return <Paper component="section" aria-label="Profile picture" variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, mb: 3, borderRadius: 3, borderColor: "#DDE4F2", background: "linear-gradient(120deg, #F1F4FF, #FFFFFF 70%)" }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
      <Avatar src={selectedUrl || currentUrl} alt={`${name || "Research Analyst"} profile picture`} slotProps={{ img: { onError: () => setCurrentMissing(true) } }} sx={{ width: 104, height: 104, bgcolor: "#E0E7FF", color: "#4054B2", fontSize: 36, fontWeight: 700, border: "4px solid white", boxShadow: "0 4px 18px #18213A12" }}>{(name || "RA").slice(0, 1).toUpperCase()}</Avatar>
      <Box flex={1} minWidth={0}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography variant="h6" fontWeight={800}>Profile picture</Typography>{value && <Chip label="Ready to submit" size="small" color="primary" variant="outlined" />}</Stack>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Put a face to your research. Crop and resize your photo before saving.</Typography>
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<AddAPhotoOutlinedIcon />} disabled={loading} onClick={() => input.current?.click()} sx={{ textTransform: "none", boxShadow: "none" }}>{loading ? "Opening image..." : "Upload picture"}</Button>
          {(value || (currentUrl && !currentMissing)) && <Button disabled={loading} onClick={() => { const file = value || (currentBlob.current && new File([currentBlob.current], "profile-picture", { type: currentBlob.current.type })); void choose(file); }} sx={{ textTransform: "none" }}>Adjust picture</Button>}
          {value && <Button onClick={() => { onChange(undefined); setError(""); }} sx={{ textTransform: "none" }}>Undo change</Button>}
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>JPG, PNG or WebP · Up to 5 MB · Saved as 512 × 512 px</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>{helperText}</Typography>
      </Box>
    </Stack>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile picture" hidden onChange={e => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
    {currentMissing && !value && <Alert severity="info" sx={{ mt: 2 }}>The current picture is unavailable. Upload a new picture to replace it.</Alert>}
    {error && !source && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Dialog keepMounted open={Boolean(source)} onClose={() => { if (!saving) setSource(undefined); }} fullWidth maxWidth="sm" aria-labelledby="picture-editor-title">
      <DialogTitle id="picture-editor-title" sx={{ fontWeight: 800 }}>Adjust profile picture</DialogTitle>
      <DialogContent>
        {error && source && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" mb={2}>Drag to reposition, then zoom to frame your photo.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 130px" }, gap: 3, alignItems: "center" }}>
          <Box sx={{ position: "relative", maxWidth: { xs: 260, sm: 320 }, width: "100%", mx: "auto", borderRadius: 2, overflow: "hidden", bgcolor: "#E2E8F0", touchAction: "none", cursor: "grab" }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, position }; }}
            onPointerMove={e => { if (!drag.current) return; const ratio = SIZE / e.currentTarget.getBoundingClientRect().width; setPosition({ x: overflowX > 0 ? clamp(drag.current.position.x + (e.clientX - drag.current.x) * ratio / overflowX) : 0, y: overflowY > 0 ? clamp(drag.current.position.y + (e.clientY - drag.current.y) * ratio / overflowY) : 0 }); }}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
            <canvas ref={canvas} width={SIZE} height={SIZE} aria-label="Profile picture crop preview" style={{ display: "block", width: "100%" }} />
            <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #fff9", boxShadow: "0 0 0 100px #0F172A55", pointerEvents: "none" }} />
          </Box>
          <Stack direction={{ xs: "row", sm: "column" }} justifyContent="center" alignItems="center" spacing={1}><Avatar src={preview} alt="Avatar preview" sx={{ width: { xs: 48, sm: 96 }, height: { xs: 48, sm: 96 } }} /><Typography variant="caption" color="text.secondary">Profile preview</Typography></Stack>
        </Box>
        <Box mt={3} px={1}>
          <Typography variant="body2" fontWeight={700}>Zoom · {zoom.toFixed(1)}×</Typography>
          <Slider aria-label="Picture zoom" min={1} max={3} step={0.05} value={zoom} onChange={(_, v) => setZoom(v as number)} disabled={saving} />
          <Stack direction="row" spacing={3}>
            <Box flex={1}><Typography variant="caption">Horizontal position</Typography><Slider aria-label="Horizontal position" min={-1} max={1} step={0.01} value={position.x} disabled={saving || overflowX < 1} onChange={(_, v) => setPosition(p => ({ ...p, x: v as number }))} /></Box>
            <Box flex={1}><Typography variant="caption">Vertical position</Typography><Slider aria-label="Vertical position" min={-1} max={1} step={0.01} value={position.y} disabled={saving || overflowY < 1} onChange={(_, v) => setPosition(p => ({ ...p, y: v as number }))} /></Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button disabled={saving} startIcon={<RotateRightIcon />} onClick={() => { setRotation(r => (r + 90) % 360); setPosition({ x: 0, y: 0 }); }}>Rotate</Button>
          <Button disabled={saving} startIcon={<FlipIcon />} aria-pressed={flipped} onClick={() => setFlipped(f => !f)}>Flip</Button>
          <Button disabled={saving} startIcon={<RestartAltIcon />} onClick={reset}>Reset</Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button disabled={saving} onClick={() => setSource(undefined)}>Cancel</Button><Button variant="contained" disabled={saving || !preview} onClick={apply}>{saving ? "Saving..." : onSave ? "Save picture" : "Use picture"}</Button></DialogActions>
    </Dialog>
  </Paper>;
}
