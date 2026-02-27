import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Types for external library and global storage
declare global {
  interface Window {
    ColorThief: any;
    generatedEmailHtml: string;
  }
}

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  // --- State Management ---
  const [logosData, setLogosData] = useState<string[]>([]);
  const [headerColor, setHeaderColor] = useState<string>('rgb(170,3,101)');
  
  const [morningHeader, setMorningHeader] = useState("Morning Action @ 7 AM – Friday, August 8th 2025");
  const [mainImg, setMainImg] = useState("https://iili.io/FsGbN9t.jpg");
  const [lead, setLead] = useState("Gift Nifty is indicating a cautious start for the benchmark Nifty.\n\nThat brings us to our call of the day which suggests volatility is likely to be the hallmark of the day, as the benchmark is most likely to open a bit lower but the good news is that downside for the day is likely to be well supported.");
  const [globalImg, setGlobalImg] = useState("https://iili.io/Fss1Ub9.png");
  const [globalText, setGlobalText] = useState("GIFT Nifty : (-46, 24649)\n\nDow Futures: (+116, 44085)\n\nNasdaq 100 Futures (+76, 23466)\n\nNikkei (+821, 41881)");
  const [trendsImg, setTrendsImg] = useState("https://iili.io/Fss1Ub9.png");
  const [technicalImgs, setTechnicalImgs] = useState("https://5b9065186b.imgdist.com/pub/bfra/xx1rrbxw/pe0/8t2/7hg/nifty.png, https://5b9065186b.imgdist.com/pub/bfra/xx1rrbxw/4pn/l6f/sge/banknifty.png, https://5b9065186b.imgdist.com/pub/bfra/xx1rrbxw/jsu/li1/f9n/sen.png");
  const [wallText, setWallText] = useState("After a gap-up start in Monday’s trade, Wall Street indices sustained 1%-plus gains through the close.\n\nThe Positive Catalyst: Rate cut hopes by the Federal Reserve on backdrop of a slowing labor market.");
  const [wallImg, setWallImg] = useState("https://5b9065186b.imgdist.com/pub/bfra/xx1rrbxw/svf/7xs/arz/wall%20street.jpg");
  const [stockNewsText, setStockNewsText] = useState("**TCS (+0.48%)** gained on reports that the firm is looking to roll out salary hikes for 80% of staff starting September 1.\n\n**Adani Power (+2.03%)** zoomed higher on receiving LoI for 2,400 MW thermal plant in Bihar's Bhagalpur.");
  const [stockNewsImg, setStockNewsImg] = useState("https://iili.io/FsGbN9t.jpg");
  const [spotlightText, setSpotlightText] = useState("**TCS (+0.48%)** — gaining on salary hike hopes.\n\n**Jindal Stainless** — strong Q1; revenue improvement noted.");
  const [tradesText, setTradesText] = useState("**Nifty (CMP 24596):** Buy on dips between 24450–24500. Stop at 23901. Targets 24857/25050.\n\n**Bank Nifty (CMP 55521):** Buy at CMP. Stop at 54601. Targets 56000/56600.");
  const [chartPre, setChartPre] = useState("**Bearish:** TVS MOTORS, M&M, and MARUTI on any early excessive intraday weakness with an interweek perspective.");
  const [chartImg, setChartImg] = useState("https://iili.io/Fi1R96b.png");
  const [chartPost, setChartPost] = useState("Buy MARUTI at CMP. Stop at 12101. Targets 13087/13501. 200-DMA at 11982.");

  // --- Logic: Formatting ---
  const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const formatTextForEmail = (raw: string) => {
    if (!raw) return '';
    let text = escapeHtml(raw).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    return text.split(/\n{2,}/g).map(p => 
      `<p style="margin:0 0 12px 0;line-height:1.4;font-size:16px;color:#1f2937">${p.replace(/\n/g, '<br>')}</p>`
    ).join('\n');
  };

  // --- Logic: File Handling & Color Extraction ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newLogos: string[] = [];

    for (const file of files) {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newLogos.push(data);
    }
    setLogosData(newLogos);

    if (newLogos.length > 0) {
      const img = new Image();
      img.src = newLogos[0];
      img.onload = () => {
        try {
          const colorThief = new window.ColorThief();
          const color = colorThief.getColor(img);
          setHeaderColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        } catch (err) {
          console.warn("ColorThief failed", err);
        }
      };
    }
  };

  // --- Logic: Build Gmail-Safe HTML ---
  const buildEmailHTML = () => {
    const technicals = technicalImgs.split(',').map(s => s.trim()).filter(Boolean);
    const firstLogo = logosData[0] || '';
    const chosenMain = mainImg.trim() || firstLogo || technicals[0] || trendsImg || '';
    const chosenGlobal = globalImg.trim() || trendsImg || technicals[0] || firstLogo || '';

    let techHtml = technicals.slice(0, 3).map((url, _i) => 
      `<tr><td style="padding:10px 0"><img src="${url}" alt="tech" style="width:100%;display:block;border:0"></td></tr>`
    ).join('<tr><td style="border-top:1px solid #eef2f6;margin:8px 0"></td></tr>');

    let logosHtml = logosData.length ? `<tr><td style="text-align:center;padding-bottom:10px">${logosData.map(d => `<img src="${d}" style="width:140px;max-width:46%;margin:6px;display:inline-block;border:0">`).join('')}</td></tr>` : '';

    return `
      <table width="600" style="max-width:600px;background:#ffffff;margin:auto;font-family:Arial, sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        ${logosHtml}
        <tr><td style="background:${headerColor};color:#fff;padding:15px;text-align:center;font-weight:700;font-size:18px;">${escapeHtml(morningHeader)}</td></tr>
        <tr><td style="padding:12px"><img src="${chosenMain}" style="width:100%;display:block"></td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(lead)}</td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">7:00 AM GLOBAL UPDATE</td></tr>
        <tr><td style="padding:12px;text-align:center"><img src="${chosenGlobal}" style="width:100%;display:block"></td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(globalText)}</td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">MARKET TRENDS</td></tr>
        <tr><td style="padding:12px"><img src="${trendsImg}" style="width:100%;display:block"></td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">TECHNICALS</td></tr>
        ${techHtml || '<tr><td style="padding:12px">No technical charts provided.</td></tr>'}
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">WALL STREET</td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(wallText)}</td></tr>
        <tr><td style="padding:12px"><img src="${wallImg}" style="width:100%;display:block"></td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">STOCK NEWS</td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(stockNewsText)}</td></tr>
        <tr><td style="padding:12px"><img src="${stockNewsImg}" style="width:100%;display:block"></td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">SPOTLIGHT</td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(spotlightText)}</td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">PREFERRED TRADES</td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(tradesText)}</td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:10px;text-align:center;font-weight:700">CHART OF THE DAY</td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(chartPre)}</td></tr>
        <tr><td style="padding:12px"><img src="${chartImg}" style="width:100%;display:block"></td></tr>
        <tr><td style="padding:12px">${formatTextForEmail(chartPost)}</td></tr>
        <tr><td style="background:${headerColor};color:#fff;padding:12px;text-align:center;font-size:12px">© 2026 | All Rights Reserved</td></tr>
      </table>
    `;
  };

  useEffect(() => {
    if (previewRef.current) {
      const html = buildEmailHTML();
      previewRef.current.innerHTML = html;
      window.generatedEmailHtml = html;
    }
  }, [morningHeader, mainImg, lead, globalImg, globalText, trendsImg, technicalImgs, wallText, wallImg, stockNewsText, stockNewsImg, spotlightText, tradesText, chartPre, chartImg, chartPost, headerColor, logosData]);

  const handleDownload = () => {
    const blob = new Blob([window.generatedEmailHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'morning_action_email.html';
    a.click();
  };

  return (
    <div style={containerStyle}>
      <div style={editorStyle}>
        <h2>Email Template Builder</h2>
        <p style={{ fontSize: '13px', color: '#666' }}>All changes reflect in real-time in the preview below.</p>

        <label style={labelStyle}>Upload Logos</label>
        <input type="file" multiple accept="image/*" onChange={handleLogoUpload} style={inputStyle} />

        <label style={labelStyle}>Morning Action Header</label>
        <input style={inputStyle} value={morningHeader} onChange={(e) => setMorningHeader(e.target.value)} />

        <label style={labelStyle}>Main Image URL</label>
        <input style={inputStyle} value={mainImg} onChange={(e) => setMainImg(e.target.value)} />

        <label style={labelStyle}>Lead Content</label>
        <textarea style={textareaStyle} value={lead} onChange={(e) => setLead(e.target.value)} />

        <label style={labelStyle}>Global Update Image URL</label>
        <input style={inputStyle} value={globalImg} onChange={(e) => setGlobalImg(e.target.value)} />

        <label style={labelStyle}>Global Update Text</label>
        <textarea style={textareaStyle} value={globalText} onChange={(e) => setGlobalText(e.target.value)} />

        <label style={labelStyle}>Market Trends Image URL</label>
        <input style={inputStyle} value={trendsImg} onChange={(e) => setTrendsImg(e.target.value)} />

        <label style={labelStyle}>Wall Street Summary</label>
        <textarea style={textareaStyle} value={wallText} onChange={(e) => setWallText(e.target.value)} />

        <label style={labelStyle}>Wall Street Image</label>
        <input style={inputStyle} value={wallImg} onChange={(e) => setWallImg(e.target.value)} />

        <label style={labelStyle}>Stock News Text</label>
        <textarea style={textareaStyle} value={stockNewsText} onChange={(e) => setStockNewsText(e.target.value)} />

        <label style={labelStyle}>Stock News Image</label>
        <input style={inputStyle} value={stockNewsImg} onChange={(e) => setStockNewsImg(e.target.value)} />

        <label style={labelStyle}>Chart of the Day Intro</label>
        <textarea style={textareaStyle} value={chartPre} onChange={(e) => setChartPre(e.target.value)} />

        <label style={labelStyle}>Chart Image URL</label>
        <input style={inputStyle} value={chartImg} onChange={(e) => setChartImg(e.target.value)} />

        <label style={labelStyle}>Chart Conclusion</label>
        <textarea style={textareaStyle} value={chartPost} onChange={(e) => setChartPost(e.target.value)} />

        <label style={labelStyle}>Technical Charts (3 URLs, comma separated)</label>
        <input style={inputStyle} value={technicalImgs} onChange={(e) => setTechnicalImgs(e.target.value)} placeholder="URL1, URL2, URL3"/>

        <label style={labelStyle}>Stocks in Spotlight</label>
        <textarea style={textareaStyle} value={spotlightText} onChange={(e) => setSpotlightText(e.target.value)} />

        <label style={labelStyle}>Preferred Trades</label>
        <textarea style={textareaStyle} value={tradesText} onChange={(e) => setTradesText(e.target.value)} />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button style={btnStyle} onClick={handleDownload}>Download HTML</button>
          <button style={{ ...btnStyle, backgroundColor: '#475569' }} onClick={() => navigate('/')}>Back</button>
        </div>
      </div>

      <div id="previewContainer" style={{ backgroundColor: '#d0d0d0', padding: '20px', borderRadius: '8px' }}>
        <div ref={previewRef}></div>
      </div>
    </div>
  );
};

// --- Styles ---
const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '20px auto', padding: '0 20px' };
const editorStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #ddd' };
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 'bold', fontSize: '14px', marginTop: '15px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: '80px', resize: 'vertical' };
const btnStyle: React.CSSProperties = { padding: '12px 20px', backgroundColor: 'rgb(170,3,101)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default Generator;