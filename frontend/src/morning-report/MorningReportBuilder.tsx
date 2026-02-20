import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MorningReportBuilder: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // LOGIC: Same logic from your script tag
  useEffect(() => {
    const report = reportRef.current;
    if (!report) return;

    function normalize(txt: string | null) {
      return (txt || "").trim().toLowerCase();
    }

    function isTrendOrBiasCell(cell: HTMLElement) {
      const row = cell.closest("tr");
      if (!row) return false;
      const table = row.closest("table");
      if (!table) return false;

      const headerRow = Array.from(table.querySelectorAll("tr")).find(r => r.querySelectorAll("th").length > 0);
      if (!headerRow) return false;

      const headers = Array.from(headerRow.querySelectorAll("th")).map(h => normalize(h.textContent));
      const idx = Array.from(row.querySelectorAll("td,th")).indexOf(cell);
      const targetIdx = headers.findIndex(h => h === "trend" || h === "bias");
      return targetIdx !== -1 && idx === targetIdx;
    }

    function updateTrendClass(el: HTMLElement) {
      if (!el || !isTrendOrBiasCell(el)) return;
      const txt = normalize(el.textContent);
      el.classList.remove("positive", "negative", "neutral");
      if (/\bneutral\b/.test(txt)) el.classList.add("neutral");
      else if (/\bpositive\b/.test(txt)) el.classList.add("positive");
      else if (/\bnegative\b/.test(txt)) el.classList.add("negative");
    }

    // Initial scan
    const editableItems = report.querySelectorAll<HTMLElement>("[contenteditable='true']");
    editableItems.forEach(updateTrendClass);

    // Live updates listener
    const handleInput = (e: Event) => {
      let target = e.target as HTMLElement;
      if (!target || !target.matches("[contenteditable={true}]")) {
        target = target.closest("[contentEditable={true}]") as HTMLElement;
      }
      if (target) updateTrendClass(target);
    };

    report.addEventListener("input", handleInput, true);

    return () => report.removeEventListener("input", handleInput, true);
  }, []);

  const handleSubmit = () => {
    if (reportRef.current) {
      const reportHTML = reportRef.current.innerHTML;
      localStorage.setItem("reportHTML", reportHTML);
      // Logic same: Navigate to the display page
      navigate("/morning-report-view"); 
    }
  };

  return (
    <div style={containerStyle}>
      <style>{customStyles}</style>
      
      <div id="report" ref={reportRef}>
        <header>
          <img src="https://iili.io/KAmsRLb.png" style={{ width: "850px", maxHeight: "900px", marginBottom: "10px" }} alt="Logo" />
          <div className="report-header">
            <div className="report-title">The Morning Report</div>
            <div className="report-date"  contentEditable={true}  suppressContentEditableWarning={true}>
              Monday, September 8th 2025
            </div>
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th>INDICES</th>
              <th>CMP</th>
              <th>SUPPORT</th>
              <th>RESIST</th>
              <th>21 DMA</th>
              <th>200 DMA</th>
              <th>RANGE</th>
              <th>TREND</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>NIFTY</b></td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24632</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24409</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24857</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24775</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>24047</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>24550-24901</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
            </tr>
            <tr>
              <td><b>BANK NIFTY</b></td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>55432</td>
             <td contentEditable={true}  suppressContentEditableWarning={true}>54850</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>56000</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>55984</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>52760</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>54920-55820</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
            </tr>
          </tbody>
        </table>

        <div className="highlight">
          <h3>Preferred Trade :</h3>
          <ul style={{ listStyleType: "disc" }}>
            <li contentEditable={true}  suppressContentEditableWarning={true}>NIFTY (CMP 24632): Buy at CMP. Stop at 24261. Targets 24750/24857. Aggressive targets at 25000-25300 zone.</li>
            <br />
            <li contentEditable={true}  suppressContentEditableWarning={true}>BANKNIFTY (CMP 55432): Buy at CMP. Stop at 54501. Targets 55750/56100. Aggressive targets at 56700 mark.</li>
          </ul>

          <h3>Option Call :</h3>
          <ul style={{ listStyleType: "disc" }}>
            <li contentEditable={true}  suppressContentEditableWarning={true}>BUY NIFTY 16th September PE Strike Price 24600 at CMP 77.70. Maximum Loss: ₹ 5827.50. Profit: Unlimited. Stop: Exit Put Option if NIFTY September FUTURES moves above 24891. Analyst's Remark: Profit-taking likely amidst long unwinding.</li>
          </ul>
        </div>

        <h2>All About Stocks :</h2>
        <table>
          <thead>
            <tr>
              <th>STOCKS</th>
              <th>CMP</th>
              <th>SUPPORT</th>
              <th>RESIST</th>
              <th>21 DMA</th>
              <th>200 DMA</th>
              <th>BIAS</th>
              <th>PREFERRED TRADE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Eternal</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>318</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>313</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>333</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>300</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>250</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
             <td contentEditable={true}  suppressContentEditableWarning={true}>Buy at CMP. Stop 303. Targets 321/333. Aggressive targets at 347.</td>
            </tr>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Maruti</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>12936</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>12511</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>13501</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>12551</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>12004</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>Buy at CMP. Stop at 12331. Targets 13287/13501. Aggressive targets 14151.</td>
            </tr>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>SBIN</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>827</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>808</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>843</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>811</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>791</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Buy at CMP. Stop at 805. Targets 843/857. Aggressive targets 875.</td>
            </tr>
          </tbody>
        </table>

        <h2>Medium Term Trades :</h2>
        <table>
          <thead>
            <tr>
              <th>STOCKS</th>
              <th>CMP</th>
              <th>SUPPORT</th>
              <th>RESIST</th>
              <th>21 DMA</th>
              <th>200 DMA</th>
              <th>BIAS</th>
              <th>PREFERRED TRADE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>CIPLA</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>1564</td>
             <td contentEditable={true} suppressContentEditableWarning={true}>1409</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>1702</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>1514</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>1488</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Buy at CMP, targeting 1595/1702 mark and then at 1851 mark. Stop above 1451. Rationale: Breakout play likely amidst positive momentum oscillators.</td>
            </tr>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>NETWEB</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>2125</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>1451</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>2551</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>2041</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>2026</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Buy at CMP, targeting 2330/2551 mark and then at 3000 mark. Stop above 1451. Rationale: Stock price likely to move from a lower consolidation zone.</td>
            </tr>
            <tr>
              <td contentEditable={true}  suppressContentEditableWarning={true}>OSWAL PUMPS</td>
             <td contentEditable={true}  suppressContentEditableWarning={true}>794</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>660</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>1000</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>749</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>-</td>
              <td contentEditable={true}  suppressContentEditableWarning={true} className="positive">Positive</td>
             <td contentEditable={true}  suppressContentEditableWarning={true}>Buy at CMP, targeting 881/1000 mark and then at 1250 mark. Stop above 669. Rationale: Stock price likely to move from a higher as sequence of higher highs/lows</td>
            </tr>
          </tbody>
        </table>

        <h2>Stock In Spotlight :</h2>
        <table>
          <thead>
            <tr>
              <th>STOCKS</th>
              <th>CMP</th>
              <th>ACTION</th>
              <th>TARGET</th>
              <th>SUPPORT</th>
              <th>RESIST</th>
              <th>HOLDING PERIOD</th>
              <th>RATIONALE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
             <td contentEditable={true} suppressContentEditableWarning={true}>M&M</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>3265</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Buy</td>
              <td contentEditable={true} suppressContentEditableWarning={true}>3321</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>3061/2761</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>3321/3750</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>9-12 months</td>
              <td contentEditable={true}  suppressContentEditableWarning={true}>Breaking out from a higher consolidation zone on all time-frames.</td>
            </tr>
          </tbody>
        </table>

        <footer>
          <p contentEditable={true} suppressContentEditableWarning={true} className="small-note">
            Disclaimer : Stock market investments are subject to market risks. All information provided is for educational and informational purposes only and represents personal views. It is not investment advice. Clients may hold positions in mentioned stocks and receive additional real-time information. No guarantees on returns. Consult a financial advisor before investing.
          </p>
          <div style={{ backgroundColor: '#aa0365', color: '#ffffff', textAlign: 'center', padding: '10px', fontSize: '14px', marginTop: '10px' }}>
          </div>
        </footer>
      </div>

      <button id="submitBtn" onClick={handleSubmit}>Submit & Continue</button>
    </div>
  );
};

// Styles mapped exactly from your HTML
const containerStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  maxWidth: "900px",
  margin: "auto",
  padding: "20px",
  background: "#fff",
  color: "#000",
  lineHeight: "1.5",
};

const customStyles = `
  [contenteditable="true"] { cursor: text; transition: background 0.2s; }
  [contenteditable="true"]:hover { outline: 1px dashed #aaa; background: #95a7e1; color: black; }
  [contenteditable="true"]:focus { outline: 2px solid #ffb300; background: #fff2a8; color: black; }
  button { margin-top: 20px; background: #aa0365; color: #fff; padding: 10px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  header { text-align: center; border-bottom: 2px solid #eee; }
  .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .report-title { font-size: 40px; font-weight: 800; color: #000000; }
  .report-date { font-size: 16px; font-weight: bold; color: #000000; }
  h2 { font-size: 1.3rem; font-weight: 700; margin: 20px 0 10px; padding-bottom: 5px; }
  h3 { font-size: 1.2rem; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  li::marker { color: black; }
  th, td { padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 0.95rem; }
  th { background: #aa0365; color: #fff; font-weight: 600; }
  .positive { color: #00C853 !important; font-weight: 600; }
  .negative { color: #D50000 !important; font-weight: 600; }
  .neutral { color: #0505d6 !important; font-weight: 600; }
  .highlight { background: #fafafa; color: black; padding: 15px; border-radius: 6px; border: 1px solid #ddd; }
  .small-note { font-size: 0.85rem; color: #666; margin-top: 10px; }
`;

export default MorningReportBuilder;