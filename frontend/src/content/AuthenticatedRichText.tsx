import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import DOMPurify from "dompurify";

export default function AuthenticatedRichText({ html }: { html: string }) {
  const container = useRef<HTMLDivElement>(null);
  const safeHtml = useMemo(() => DOMPurify.sanitize(html, { ADD_ATTR: ["data-content-image"] }), [html]);
  useEffect(() => {
    const controller = new AbortController();
    const urls: string[] = [];
    const images = Array.from(container.current?.querySelectorAll<HTMLImageElement>("img[data-content-image]") || []);
    images.forEach(image => {
      const filename = image.dataset.contentImage;
      if (!filename) return;
      image.removeAttribute("src");
      fetch(`${import.meta.env.VITE_API_URL || ""}/uploads/${encodeURIComponent(filename)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal: controller.signal })
        .then(response => { if (!response.ok) throw new Error(); return response.blob(); })
        .then(blob => { const url = URL.createObjectURL(blob); urls.push(url); image.src = url; })
        .catch(() => { if (!controller.signal.aborted) image.alt = "Image unavailable"; });
    });
    return () => { controller.abort(); urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [safeHtml]);
  return <Box ref={container} dangerouslySetInnerHTML={{ __html: safeHtml }} sx={{ lineHeight: 1.8, color: "#27324A", "& h2": { fontSize: "1.65rem", mt: 3 }, "& h3": { fontSize: "1.3rem", mt: 2.5 }, "& img": { display: "block", maxWidth: "100%", height: "auto", borderRadius: 2, my: 2 }, "& figure": { m: "24px 0" }, "& figcaption": { color: "text.secondary", textAlign: "center", fontSize: 13 }, "& blockquote": { borderLeft: "4px solid #5271FF", bgcolor: "#F1F5FF", m: "16px 0", p: "8px 16px" }, "& a": { color: "primary.main" } }} />;
}
