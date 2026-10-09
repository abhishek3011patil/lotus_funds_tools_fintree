import { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DOMPurify from "dompurify";
import api from "../utils/axio";

type Props = { value: string; onChange: (html: string) => void };

const serialize = (element: HTMLDivElement) => {
  const clone = element.cloneNode(true) as HTMLDivElement;
  clone.querySelectorAll<HTMLImageElement>("img[data-content-image]").forEach(image => {
    image.src = `/uploads/${encodeURIComponent(image.dataset.contentImage || "")}`;
  });
  return clone.innerHTML;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const urls: string[] = [];
    if (editor.current && serialize(editor.current) !== value) editor.current.innerHTML = DOMPurify.sanitize(value, { ADD_ATTR: ["data-content-image"] });
    const images = Array.from(editor.current?.querySelectorAll<HTMLImageElement>("img[data-content-image]") || []);
    images.forEach(image => {
      const filename = image.dataset.contentImage;
      if (!filename || image.src.startsWith("blob:")) return;
      fetch(`${import.meta.env.VITE_API_URL || ""}/uploads/${encodeURIComponent(filename)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal: controller.signal })
        .then(response => { if (!response.ok) throw new Error(); return response.blob(); })
        .then(blob => { const url = URL.createObjectURL(blob); urls.push(url); image.src = url; })
        .catch(() => undefined);
    });
    return () => { controller.abort(); urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [value]);

  const command = (name: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    if (editor.current) onChange(serialize(editor.current));
  };

  const addLink = () => {
    const url = window.prompt("Paste a secure link (https://)");
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error();
      command("createLink", parsed.toString());
    } catch { setUploadError("Please enter a valid https:// link."); }
  };

  const addImage = async (file?: File) => {
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const data = new FormData(); data.append("image", file);
      const response = await api.post<{ filename: string }>("/content/manage/images", data);
      const filename = response.data.filename;
      const imageResponse = await fetch(`${import.meta.env.VITE_API_URL || ""}/uploads/${encodeURIComponent(filename)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!imageResponse.ok) throw new Error("Uploaded image could not be previewed.");
      const preview = URL.createObjectURL(await imageResponse.blob());
      editor.current?.focus();
      document.execCommand("insertHTML", false, `<figure><img src="${preview}" data-content-image="${filename}" alt="" style="max-width:100%;height:auto;border-radius:12px"/><figcaption>Click here and type an image caption</figcaption></figure><p><br></p>`);
      if (editor.current) onChange(serialize(editor.current));
      window.setTimeout(() => URL.revokeObjectURL(preview), 60_000);
    } catch (error: any) { setUploadError(error.response?.data?.message || error.message || "Unable to upload image."); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const tools = [
    ["Bold", <FormatBoldRoundedIcon />, "bold"], ["Italic", <FormatItalicRoundedIcon />, "italic"], ["Underline", <FormatUnderlinedRoundedIcon />, "underline"],
    ["Bulleted list", <FormatListBulletedRoundedIcon />, "insertUnorderedList"], ["Numbered list", <FormatListNumberedRoundedIcon />, "insertOrderedList"], ["Quote", <FormatQuoteRoundedIcon />, "formatBlock", "blockquote"],
  ] as const;

  return <Box>
    <Typography variant="subtitle2" fontWeight={800} mb={.75}>Blog content</Typography>
    <Box sx={{ border: "1px solid #CBD5E1", borderRadius: 2.5, overflow: "hidden", "&:focus-within": { borderColor: "primary.main", boxShadow: "0 0 0 1px #5271FF" } }}>
      <Stack direction="row" alignItems="center" gap={.25} flexWrap="wrap" sx={{ p: .75, bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
        <select aria-label="Text style" onChange={e => command("formatBlock", e.target.value)} defaultValue="p" style={{ height: 32, border: "1px solid #CBD5E1", borderRadius: 6, background: "white" }}><option value="p">Paragraph</option><option value="h2">Heading</option><option value="h3">Subheading</option></select>
        <Divider orientation="vertical" flexItem sx={{ mx: .5 }} />
        {tools.map(([label, icon, name, argument]) => <Tooltip title={label} key={label}><IconButton size="small" aria-label={label} onMouseDown={event => { event.preventDefault(); command(name, argument); }}>{icon}</IconButton></Tooltip>)}
        <Tooltip title="Add link"><IconButton size="small" onClick={addLink}><LinkRoundedIcon /></IconButton></Tooltip>
        <Button size="small" startIcon={uploading ? <CircularProgress size={16} /> : <ImageRoundedIcon />} onClick={() => fileInput.current?.click()} disabled={uploading} sx={{ ml: .5 }}>Add image</Button>
        <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => void addImage(e.target.files?.[0])} />
      </Stack>
      <Box ref={editor} contentEditable suppressContentEditableWarning onInput={() => editor.current && onChange(serialize(editor.current))} data-placeholder="Write your blog here…" sx={{ minHeight: 320, p: 2.5, outline: 0, lineHeight: 1.75, "&:empty:before": { content: "attr(data-placeholder)", color: "#94A3B8" }, "& h2": { fontSize: "1.6rem" }, "& h3": { fontSize: "1.25rem" }, "& blockquote": { borderLeft: "4px solid #5271FF", bgcolor: "#F1F5FF", m: "16px 0", p: "8px 16px" }, "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 }, "& figcaption": { color: "text.secondary", textAlign: "center", fontSize: 13 } }} />
    </Box>
    {uploadError && <Typography color="error" variant="caption">{uploadError}</Typography>}
    <Typography color="text.secondary" variant="caption">Format headings, lists, quotes and links, or add JPG, PNG and WebP images up to 5 MB.</Typography>
  </Box>;
}
