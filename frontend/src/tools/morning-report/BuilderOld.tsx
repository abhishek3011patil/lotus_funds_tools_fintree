import React, { useEffect, useRef, useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';

// --- LOGO IMPORTS FROM YOUR LOGO FOLDER ---
import ShareIndiaLogo from '../logo/Share India.png';
import MarfatiaLogo from '../logo/Marfatia.png';
import HPMGLogo from '../logo/HPMG.png';
import LabdhiLogo from '../logo/Labdhi.png';
import PaytmLogo from '../logo/PayTM Money.png';
import LotusLogo from '../logo/www.Lotusfunds.c...png'; 

const BuilderOld: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // 1. ADDED STATE: To track which logo is selected
  const [selectedLogo, setSelectedLogo] = useState(ShareIndiaLogo);

  useEffect(() => {
    const report = reportRef.current;
    if (!report) return;

    function findCell(el: HTMLElement) {
      return el.closest('td, th') as HTMLTableCellElement | null;
    }

    function isTrendOrBiasColumn(el: HTMLElement) {
      const cell = findCell(el);
      if (!cell) return false;
      const table = cell.closest('table');
      if (!table) return false;

      const headerRow = Array.from(table.rows).find(r => r.querySelectorAll('th').length > 0);
      if (!headerRow) return false;

      const headers = Array.from(headerRow.querySelectorAll('th')).map(h => h.textContent?.trim().toLowerCase() || "");
      const targetIndex = headers.findIndex(h => h === 'trend' || h === 'bias');
      if (targetIndex === -1) return false;

      return cell.cellIndex === targetIndex;
    }

    function updateBiasClass(el: HTMLElement) {
      if (!el || !isTrendOrBiasColumn(el)) return;

      const txt = (el.textContent || '').trim().toLowerCase();
      const isNeutral = /\bneutral\b/.test(txt);
      const isPositive = /\bpositive\b/.test(txt);
      const isNegative = /\bnegative\b/.test(txt);

      el.classList.remove('positive', 'negative', 'neutral');
      if (isNeutral) el.classList.add('neutral');
      else if (isPositive) el.classList.add('positive');
      else if (isNegative) el.classList.add('negative');
    }

    const attachListeners = () => {
      const items = report.querySelectorAll<HTMLElement>('[contentEditable="true"]');
      items.forEach(el => {
        if (!isTrendOrBiasColumn(el)) return;
        updateBiasClass(el);
        el.oninput = () => updateBiasClass(el);
        el.onblur = () => updateBiasClass(el);
      });
    };

    attachListeners();

    const mo = new MutationObserver(() => attachListeners());
    mo.observe(report, { childList: true, subtree: true, characterData: true });

    return () => {
      mo.disconnect();
    };
  }, []);

  const handleSubmit = () => {
    if (reportRef.current) {
      localStorage.setItem("reportHTML", reportRef.current.innerHTML);
      navigate("/logo-theme"); 
    }
  };

  return (
    <div style={pageStyle}>
      <style>{internalStyles}</style>

      {/* 2. LOGO SELECTOR: This makes use of all your imports */}
      <div style={selectorContainerStyle}>
        <label style={{ fontWeight: 600, marginRight: '10px' }}>Select Theme Logo:</label>
        <select 
          value={selectedLogo} 
          onChange={(e) => setSelectedLogo(e.target.value)}
          style={selectStyle}
        >
          <option value={ShareIndiaLogo}>Share India</option>
          <option value={MarfatiaLogo}>Marfatia</option>
          <option value={HPMGLogo}>HPMG</option>
          <option value={LabdhiLogo}>Labdhi</option>
          <option value={PaytmLogo}>PayTM Money</option>
          <option value={LotusLogo}>Lotus Funds</option>
        </select>
      </div>

      <div id="report" ref={reportRef}>
        <header>
          {/* 3. UPDATED: src now uses the selectedLogo state */}
          <img src={selectedLogo} alt="Logo" />
          
          <h1>The Morning Report</h1>
          <div className="date" contentEditable={true} suppressContentEditableWarning={true}>
            Monday, August 18th 2025
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th>INDICES</th>
              <th>Closing Price</th>
              <th>Support</th>
              <th>Resistance</th>
              <th>21 DMA</th>
              <th>200 DMA</th>
              <th>Range</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NIFTY</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24632</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24409</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24857</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24775</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24047</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24550-24901</td>
              <td contentEditable={true} suppressContentEditableWarning={true} className="positive">Positive</td>
            </tr>
            <tr>
              <td>BANK-NIFTY</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>55432</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>54850</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>56000</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>55984</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>52760</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>54920-55820</td>
              <td contentEditable={true} suppressContentEditableWarning={true} className="positive">Positive</td>
            </tr>
          </tbody>
        </table>

        <h2>Preferred Trade</h2>
        <div className="highlight">
          <ul style={{ listStyleType: "disc" }}>
            <li contentEditable={true} suppressContentEditableWarning={true}>NIFTY (CMP 24632): Buy at CMP. Stop at 24261. Targets 24750/24857. Aggressive targets at 25000-25300 zone.</li>
            <li contentEditable={true} suppressContentEditableWarning={true}>BANKNIFTY (CMP 55432): Buy at CMP. Stop at 54501. Targets 55750/56100. Aggressive targets at 56700 mark.</li>
          </ul>
        </div>

        <h2>All About Stocks</h2>
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>CMP</th>
              <th>Support</th>
              <th>Resistance</th>
              <th>21 DMA</th>
              <th>200 DMA</th>
              <th>Bias</th>
              <th>Preferred Trade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td contentEditable={true} suppressContentEditableWarning={true}>Eternal</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>318</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>313</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>333</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>300</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>250</td>
              <td contentEditable={true} suppressContentEditableWarning={true} className="positive">Positive</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>Buy at CMP. Stop 303. Targets 321/333. Aggressive targets at 347.</td>
            </tr>
          </tbody>
        </table>

        <h2>Option Call</h2>
        <p contentEditable={true} suppressContentEditableWarning={true}>
          BUY NIFTY 21st AUGUST CE Strike Price 24700 at CMP 119.35. Maximum Loss: ₹ 8951.5. Profit: Unlimited. Stop: Exit Call Option if NIFTY AUGUST FUTURES moves below 25475. Analyst’s Remark: Rebound play likely amidst oversold conditions.
        </p>

        <footer>
          <p contentEditable={true} suppressContentEditableWarning={true} className="small-note">
            Disclosures & Disclaimers: Stock market investments are subject to market risks. All information is for educational and informational use only.
          </p>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div className="footer-band" style={{ backgroundColor: 'var(--theme,#0056a3)', color: 'var(--theme-text,#ffffff)', textAlign: 'center', padding: '10px', fontSize: '14px', marginTop: '10px' }}>
              <p style={{ margin: 0 }}><strong>www.shareindia.com</strong></p>
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center', color: '#444' }}>
              <span style={{ display: 'block', fontSize: '0.95rem', color: 'inherit' }}>{"{{logoLabel}}"}</span>
            </div>
          </div>
        </footer>
      </div>

      <button id="submitBtn" onClick={handleSubmit}>Submit & Continue</button>
    </div>
  );
};

// --- ADDITIONAL STYLES ---
const selectorContainerStyle: React.CSSProperties = {
  marginBottom: '20px',
  padding: '15px',
  background: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #ddd',
  display: 'flex',
  alignItems: 'center'
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  fontSize: '14px'
};

const pageStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  maxWidth: "900px",
  margin: "auto",
  padding: "20px",
  background: "#fff",
  color: "#000",
  lineHeight: "1.5",
};

const internalStyles = `
  [contentEditable="true"] { cursor: text; transition: background 0.2s; }
  [contentEditable="true"]:hover { outline: 1px dashed #aaa; background: #fff7c2; color: black; }
  [contentEditable="true"]:focus { outline: 2px solid #ffb300; background: #fff2a8; color: black; }
  button { margin-top: 20px; background: #0056a3; color: #fff; padding: 10px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
  header img { max-height: 50px; margin-bottom: 10px; }
  h1 { font-size: 1.8rem; font-weight: 800; margin: 5px 0; }
  h2 { font-size: 1.3rem; font-weight: 700; margin: 20px 0 10px; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 0.95rem; }
  th { background: #0056a3; color: #fff; font-weight: 600; }
  .positive { color: #00C853 !important; font-weight: 600; }
  .negative { color: #D50000 !important; font-weight: 600; }
  .neutral { color: #0505d6 !important; font-weight: 600; }
  .highlight { background: #0056a3; color: #fff; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
  .small-note { font-size: 0.85rem; color: #444; }
  li::marker { color: white; }
`;

export default BuilderOld;