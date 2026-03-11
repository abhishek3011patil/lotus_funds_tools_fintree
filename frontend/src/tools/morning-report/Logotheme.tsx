import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

declare global {
  interface Window {
    ColorThief: any;
  }
}

interface LogoState {
  file?: File;
  dataURL: string;
  color: string;
  label: string;
}

const Logotheme: React.FC = () => {
  const navigate = useNavigate();
  const DEFAULT_THEME = (localStorage.getItem('themeColor') || '#aa0365').trim();
  const baseReportHTML = localStorage.getItem('reportHTML') || 
    '<p style="padding:16px">No report found in localStorage.</p>';

  const previewRef = useRef<HTMLDivElement>(null);
  const sandboxRef = useRef<HTMLDivElement>(null);

  const [logoStates, setLogoStates] = useState<LogoState[]>([]);
  const [selectedLogoIdx, setSelectedLogoIdx] = useState<number>(0);
  const [status, setStatus] = useState<string>('Idle');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // YOUR EXISTING COLOR LOGIC
  const injectGlobalStyles = (doc: Document, themeHex: string) => {
    const styleTag = doc.createElement('style');
    styleTag.innerHTML = `
      body { font-family: Arial, Helvetica, sans-serif !important; color: #333 !important; padding: 20px !important; }
      header { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; margin-bottom: 20px !important; }
      table { width: 100% !important; border-collapse: collapse !important; margin: 15px 0 !important; }
      table td, table th { background-color: #ffffff !important; color: #333333 !important; border: 1px solid #eeeeee !important; padding: 10px 8px !important; }
      table thead tr:first-child th, table thead tr:first-child td { background-color: ${themeHex} !important; color: #ffffff !important; font-weight: 700 !important; text-transform: uppercase !important; }
      .trend-pos { color: #00C853 !important; font-weight: bold !important; }
      .trend-neg { color: #D50000 !important; font-weight: bold !important; }
      .trend-neu { color: #757575 !important; font-weight: bold !important; }
      h3 { border-left: 5px solid ${themeHex} !important; padding-left: 10px !important; }
    `;
    doc.head.appendChild(styleTag);
  };

  const applyReportTrendColors = (doc: Document) => {
    const cells = Array.from(doc.querySelectorAll('td'));
    cells.forEach(cell => {
      const txt = (cell.textContent || '').trim().toLowerCase();
      const parentRow = cell.parentElement as HTMLTableRowElement | null;
      if (parentRow && parentRow.rowIndex !== 0) {
        if (txt === 'positive') cell.className = 'trend-pos';
        else if (txt === 'negative') cell.className = 'trend-neg';
        else if (txt === 'neutral') cell.className = 'trend-neu';
      }
    });
  };

  const applyThemeAndBrand = ({ html, logoDataURL, themeHex, footerText }: any) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    injectGlobalStyles(doc, themeHex);
    const headerImg = doc.querySelector("header img") as HTMLImageElement;
    if (headerImg && logoDataURL) {
      headerImg.src = logoDataURL;
      headerImg.style.maxWidth = "200px";
      headerImg.style.display = "block";
      headerImg.style.margin = "0 auto";
    }
    applyReportTrendColors(doc);
    const oldFooter = doc.querySelector("footer");
    if (oldFooter) oldFooter.remove();
    
    const footer = doc.createElement("footer");
    // This version removes the extra lines and uses ${themeHex} for the text color
    footer.innerHTML = `
      <div style="text-align:center; margin-top:25px; padding: 0 10px;">
        <p style="font-size: 11px; color: ${themeHex}; line-height: 1.4; margin: 0; font-weight: 500;">
          Disclaimer : Stock market investments are subject to market risks. All information 
          provided is for educational and informational purposes only and represents personal 
          views. It is not investment advice. Clients may hold positions in mentioned stocks and 
          receive additional real-time information. No guarantees on returns. Consult a financial 
          advisor before investing.
        </p>
        <div style="background-color:${themeHex}; height:12px; width: 100%; margin-top:15px;"></div>
      </div>
    `;
    
    doc.body.appendChild(footer);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>${doc.head.innerHTML}</head>
        <body>${doc.body.innerHTML}</body>
      </html>
    `;
  };
  useEffect(() => {
    if (logoStates.length > 0) {
      const logo = logoStates[selectedLogoIdx];
      const html = applyThemeAndBrand({
        html: baseReportHTML,
        logoDataURL: logo.dataURL,
        themeHex: logo.color,
        footerText: logo.label
      });
      if (previewRef.current) previewRef.current.innerHTML = html;
    } else if (previewRef.current) {
      previewRef.current.innerHTML = baseReportHTML;
    }
  }, [selectedLogoIdx, logoStates]);

  const handleLogoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newStates: LogoState[] = [];
    for (const file of files) {
      const dataURL = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      let color = DEFAULT_THEME;
      if (file.name.toLowerCase().includes('labdhi')) {
        color = '#1199a4'; 
      } else {
        try {
          const img = new Image();
          img.src = dataURL;
          await new Promise(r => img.onload = r);
          const rgb = new (window as any).ColorThief().getColor(img);
          color = `#${rgb.map((n: any) => n.toString(16).padStart(2, '0')).join('')}`;
        } catch (e) { console.error(e); }
      }
      newStates.push({ file, dataURL, color, label: file.name });
    }
    setLogoStates(newStates);
    setSelectedLogoIdx(0);
  };

  // THE FIX: MATCHING YOUR HTML LOGIC FOR PDF GENERATION
// THE FINAL FIX: Ensuring rendering happens before capture
const generateZip = async () => {
  if (logoStates.length === 0) return;

  setIsGenerating(true);
  setStatus("Starting Generation...");

  try {
    const zip = new JSZip();
    const folder = zip.folder("Morning_Reports");
    if (!folder) return;

    for (let i = 0; i < logoStates.length; i++) {
      const item = logoStates[i];
      setStatus(`Processing ${i + 1}/${logoStates.length}: ${item.label}`);

      const htmlOut = applyThemeAndBrand({
        html: baseReportHTML,
        logoDataURL: item.dataURL,
        themeHex: item.color,
        footerText: item.label
      });

      const safeName = item.label.replace(/[^a-z0-9]/gi, '_');
      folder.file(`${safeName}.html`, htmlOut);

      if (sandboxRef.current) {

        sandboxRef.current.innerHTML = "";

        const iframe = document.createElement("iframe");
        iframe.style.width = "850px";
        iframe.style.border = "none";
        iframe.style.background = "white";

        sandboxRef.current.appendChild(iframe);

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) continue;

        iframeDoc.open();
        iframeDoc.write(htmlOut);
        iframeDoc.close();

        // ✅ Properly typed iframe load wait (FIXED)
        await new Promise<void>((resolve) => {
          iframe.onload = () => resolve();
        });

        await sleep(300);

        const canvas = await htmlToImage.toCanvas(iframeDoc.body, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: true
        });

        const pngDataUrl = canvas.toDataURL("image/png");
        const pngBlob = await (await fetch(pngDataUrl)).blob();
        folder.file(`${safeName}.png`, pngBlob);

        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "l" : "p",
          unit: "px",
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(pngDataUrl, "PNG", 0, 0, canvas.width, canvas.height);
        folder.file(`${safeName}.pdf`, pdf.output("blob"));
      }
    }

    const finalZip = await zip.generateAsync({ type: "blob" });
    saveAs(
      finalZip,
      `Reports_${new Date().toISOString().slice(0, 10)}.zip`
    );
    setStatus("Done!");

  } catch (e: any) {
    console.error("Critical Failure:", e);
    setStatus("Error: " + e.message);
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <header style={appHeaderStyle}>
        <h1>Logo & Theme Generator</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate(-1)} style={backBtnStyle}>Back</button>
          <button onClick={generateZip} disabled={isGenerating} style={btnStyle}>
            {isGenerating ? 'Wait...' : 'Generate ZIP'}
          </button>
        </div>
      </header>
      <div style={containerStyle}>
        <div style={rowStyle}>
          <div style={cardStyle}>
            <h3>1) Upload Logos</h3>
            <input type="file" multiple accept="image/*" onChange={handleLogoInput} />
            <div style={thumbsGridStyle}>
              {logoStates.map((logo, idx) => (
                <div key={idx} onClick={() => setSelectedLogoIdx(idx)} 
                     style={{ ...thumbStyle, border: idx === selectedLogoIdx ? `3px solid ${logo.color}` : '1px solid #ddd' }}>
                  <img src={logo.dataURL} style={{ maxWidth: '40px' }} alt="" />
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <h3>2) Preview</h3>
            <div style={previewWrapStyle}><div ref={previewRef}></div></div>
          </div>
        </div>
        <div style={{ ...cardStyle, marginTop: '20px' }}>Status: {status}</div>
      </div>

      {/* ONLY ONE SANDBOX DIV - NOT DISPLAY NONE */}
<div 
  ref={sandboxRef} 
  style={{ 
    position: 'fixed',
    top: '-10000px',
    left: '-10000px',
    width: '850px',
    background: 'white',
    opacity: 1,
    pointerEvents: 'none'
  }}
></div>
    </div>
  );
};

// Styles (Minimized for space)
const appHeaderStyle: any = { background: '#fff', padding: '15px 30px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' };
const containerStyle: any = { maxWidth: '1200px', margin: '0 auto', padding: '30px' };
const rowStyle: any = { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' };
const cardStyle: any = { background: '#fff', borderRadius: '8px', padding: '20px' };
const btnStyle: any = { backgroundColor: '#1a73e8', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' };
const backBtnStyle: any = { backgroundColor: '#f1f3f4', padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc' };
const previewWrapStyle: any = { height: '500px', overflowY: 'auto', border: '1px solid #eee' };
const thumbsGridStyle: any = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' };
const thumbStyle: any = { width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default Logotheme;