import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FIIBuilder: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // --- LOGIC: Auto color +/- numbers (Preserved) ---
  const applyAutoColors = () => {
    if (!reportRef.current) return;
    const els = reportRef.current.querySelectorAll('.auto-color');
    els.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const txt = htmlEl.textContent?.trim() || '';
      const match = txt.match(/[-+]?[\d,.]+/);
      const numStr = match ? match[0].replace(/,/g, '') : '0';
      const num = parseFloat(numStr);

      if (isNaN(num)) return;

      htmlEl.classList.remove('pos', 'neg');
      htmlEl.classList.add(num < 0 ? 'neg' : 'pos');
    });
  };

  useEffect(() => {
    // Initial Run
    applyAutoColors();

    // Logic to re-run coloring if user edits values live
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('auto-color')) {
        applyAutoColors();
      }
    };

    const currentReport = reportRef.current;
    currentReport?.addEventListener('input', handleInput);
    return () => currentReport?.removeEventListener('input', handleInput);
  }, []);

  // --- LOGIC: Submit & Continue (Preserved) ---
  const handleSubmit = () => {
    if (reportRef.current) {
      localStorage.setItem("reportHTML", reportRef.current.innerHTML);
      navigate("/logo-theme");
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px' }}>
      <style>{`
        :root {
          --card: #ffffff;
          --muted: #666666;
          --pos: #16a34a;
          --neg: #ef4444;
          --neu: #0505d6;
        }
        body { font-family: 'Inter', sans-serif; max-width: 900px; margin: auto; line-height: 1.5; color: #000; }
        [contenteditable="true"] { cursor: text; transition: background 0.2s; }
        [contenteditable="true"]:hover { outline: 1px dashed #aaa; background: #95a7e1; color: black; }
        [contenteditable="true"]:focus { outline: 2px solid #ffb300; background: #fff2a8; color: black; }
        .positive { color: var(--pos); font-weight: 600; }
        .negative { color: var(--neg); font-weight: 600; }
        .neutral  { color: var(--neu); font-weight: 600; }
        header { text-align: center; border-bottom: 2px solid #eee; }
        .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .report-title { font-size: 40px; font-weight: 800; color: #000000; }
        .report-date { font-size: 16px; font-weight: bold; color: #000000; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 18px; }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
        .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; background: #ffffff; }
        .card h3 { margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; color: #1a1a1a; font-weight: 700; }
        .row { display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; background: #fff; }
        .label { font-weight: 600; }
        .val { font-variant-numeric: tabular-nums; font-weight: 600; }
        .pos { color: var(--pos); }
        .neg { color: var(--neg); }
        .highlight { background: #fafafa; color: black; border: 1px solid #ddd; }
        .small-note { font-size: 0.85rem; color: #666; margin-top: 10px; }
        footer { margin-top: 20px; text-align: center; font-size: 0.9rem; color: #aa0365; }
        button#submitBtn { margin-top: 20px; background: #aa0365; color: #fff; padding: 10px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div id="report" ref={reportRef}>
        <header>
          <img src="https://iili.io/KAmsRLb.png" width="100%" alt="Logo" />
          <div className="report-header">
            <div className="report-title">FII / DII Activity</div>
            <div className="report-date" contentEditable={true} suppressContentEditableWarning={true}>Tuesday, November 4th 2025</div>
          </div>
        </header>

        <div style={{ textAlign: 'center' }}>
          <img src="https://www.regentfurniture.co.za/wp-content/uploads/2016/07/Insert-Image-Here.png" alt="Title" width="100%" style={{ height: '300px', objectFit: 'cover' }} />
        </div>

        <div style={{ backgroundColor: '#aa0365', color: '#ffffff', textAlign: 'center', padding: '10px', fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase' }} contentEditable={true} suppressContentEditableWarning={true}>
          FII'S continue to sell.
        </div>

        <div className="highlight">
          <section className="grid">
            <div className="card">
              <h3>Today</h3>
              <div className="row">
                <div className="label">FII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+221.1 Cr.</div>
              </div>
              <div className="row">
                <div className="label">DII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+591.3 Cr.</div>
              </div>
            </div>

            <div className="card">
              <h3>Week till Date</h3>
              <div className="row">
                <div className="label">FII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+593.2 Cr.</div>
              </div>
              <div className="row">
                <div className="label">DII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+8,844.4 Cr.</div>
              </div>
            </div>

            <div className="card">
              <h3>Month till Date</h3>
              <div className="row">
                <div className="label">FII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>-4,958.1 Cr.</div>
              </div>
              <div className="row">
                <div className="label">DII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+8,846.2 Cr.</div>
              </div>
            </div>

            <div className="card">
              <h3>Year till Date</h3>
              <div className="row">
                <div className="label">FII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+14,835.6 Cr.</div>
              </div>
              <div className="row">
                <div className="label">DII Cash</div>
                <div className="val auto-color" contentEditable={true} suppressContentEditableWarning={true}>+1,77,389.6 Cr.</div>
              </div>
            </div>
          </section>
        </div>

        <div style={{ backgroundColor: '#aa0365', color: '#ffffff', textAlign: 'center', padding: '10px', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }} contentEditable={true} suppressContentEditableWarning={true}>
          Gift Nifty at 20:16 (25293, -112)
        </div>

        <footer>
          <p contentEditable={true} suppressContentEditableWarning={true} className="small-note">
            Disclaimer : Stock market investments are subject to market risks. All information provided is for educational and informational purposes only and represents personal views. It is not investment advice. Clients may hold positions in mentioned stocks and receive additional real-time information. No guarantees on returns. Consult a financial advisor before investing.
          </p>
          <div style={{ backgroundColor: '#aa0365', color: '#ffffff', textAlign: 'center', padding: '10px', fontSize: '14px', marginTop: '10px', height: '10px' }}></div>
        </footer>
      </div>

      <button id="submitBtn" onClick={handleSubmit}>Submit & Continue</button>
    </div>
  );
};

export default FIIBuilder;