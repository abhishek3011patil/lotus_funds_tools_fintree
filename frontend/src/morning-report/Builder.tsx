import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Builder: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // --- LOGIC: Helper functions for Trend/Bias styling ---
  const normalize = (s: string | null) => (s || '').trim().toLowerCase();

  const updateTrendClass = (el: HTMLElement) => {
    if (!el) return;
    const txt = normalize(el.textContent);
    el.classList.remove('positive', 'negative', 'neutral');
    if (/\bneutral\b/.test(txt)) el.classList.add('neutral');
    else if (/\bpositive\b/.test(txt)) el.classList.add('positive');
    else if (/\bnegative\b/.test(txt)) el.classList.add('negative');
  };

  const isTrendOrBiasCell = (cell: HTMLElement) => {
    if (!cell) return false;
    const row = cell.closest('tr');
    if (!row) return false;
    const table = row.closest('table');
    if (!table) return false;

    // find the header row
    const headerRow = Array.from(table.querySelectorAll('tr')).find(r => r.querySelectorAll('th').length > 0);
    if (!headerRow) return false;

    const headers = Array.from(headerRow.querySelectorAll('th')).map(h => normalize(h.textContent));
    const targetIdx = headers.findIndex(h => h === 'trend' || h === 'bias');
    if (targetIdx === -1) return false;

    const cells = Array.from(row.querySelectorAll('td, th')) as HTMLElement[];
    const idx = cells.indexOf(cell);
    return idx === targetIdx;
  };

  // --- EFFECT: Event Listeners for editing ---
  useEffect(() => {
    const report = reportRef.current;
    if (!report) return;

    // Initial scan
    const editables = report.querySelectorAll<HTMLElement>('[contenteditable="true"]');
    editables.forEach(n => {
      if (isTrendOrBiasCell(n)) updateTrendClass(n);
    });

    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && isTrendOrBiasCell(target)) {
        if (e.type === 'paste') {
          setTimeout(() => updateTrendClass(target), 50);
        } else {
          updateTrendClass(target);
        }
      }
    };

    report.addEventListener('input', handleInteraction);
    report.addEventListener('blur', handleInteraction, true);
    report.addEventListener('paste', handleInteraction, true);

    return () => {
      report.removeEventListener('input', handleInteraction);
      report.removeEventListener('blur', handleInteraction, true);
      report.removeEventListener('paste', handleInteraction, true);
    };
  }, []);

  const handleContinue = () => {
    if (reportRef.current) {
      localStorage.setItem("reportHTML", reportRef.current.innerHTML);
      navigate("/logo-theme");
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px', backgroundColor: '#fff' }}>
      <style>{`
        [contenteditable="true"] { cursor: text; transition: background 0.2s; }
        [contenteditable="true"]:hover { outline: 1px dashed #aaa; background: #95a7e1; color: black; }
        [contenteditable="true"]:focus { outline: 2px solid #ffb300; background: #fff2a8; color: black; }
        button#submitBtn { margin-top: 20px; background: #aa0365; color: #fff; padding: 10px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div id="report" ref={reportRef}>
        <style>{`
          header { text-align: center; border-bottom: 2px solid #eee; }
          header img { width: 900px; margin-bottom: 10px; }
          .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .report-title { font-size: 40px; font-weight: 800; color: #000; }
          .report-date { font-size: 16px; font-weight: bold; color: #000; }
          h2 { font-size: 1.3rem; font-weight: 700; margin: 20px 0 10px; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 0.95rem; }
          th { background: #aa0365; color: #fff; font-weight: 600; }
          .positive { color: #00C853 !important; font-weight: 600; }
          .negative { color: #D50000 !important; font-weight: 600; }
          .neutral { color: #0505d6 !important; font-weight: 600; }
          .highlight { background: #f3f3f3 !important; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
          .highlight ul { margin: 0; padding-left: 1.2em; list-style-type: disc; }
          .highlight li::marker { color: #000 !important; }
          .small-note { font-size: 0.85rem; color: #666; margin-top: 10px; }
          footer { margin-top: 20px; text-align: center; font-size: 0.9rem; color: #aa0365; }
        `}</style>

        <header>
          <img src="https://iili.io/KAmsRLb.png" alt="Logo" />
          <div className="report-header">
            <div className="report-title">The Morning Report</div>
            <div className="report-date" contentEditable suppressContentEditableWarning>Monday, September 8th 2025</div>
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th>INDICES</th><th>CMP</th><th>SUPPORT</th><th>RESIST</th><th>21 DMA</th><th>200 DMA</th><th>RANGE</th><th>TREND</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NIFTY</td>
              <td contentEditable suppressContentEditableWarning>24632</td>
              <td contentEditable suppressContentEditableWarning>24409</td>
              <td contentEditable suppressContentEditableWarning>24857</td>
              <td contentEditable suppressContentEditableWarning>24775</td>
              <td contentEditable suppressContentEditableWarning>24047</td>
              <td contentEditable suppressContentEditableWarning>24550-24901</td>
              <td contentEditable suppressContentEditableWarning className="positive">Positive</td>
            </tr>
            <tr>
              <td>BANK-NIFTY</td>
              <td contentEditable suppressContentEditableWarning>55432</td>
              <td contentEditable suppressContentEditableWarning>54850</td>
              <td contentEditable suppressContentEditableWarning>56000</td>
              <td contentEditable suppressContentEditableWarning>55984</td>
              <td contentEditable suppressContentEditableWarning>52760</td>
              <td contentEditable suppressContentEditableWarning>54920-55820</td>
              <td contentEditable suppressContentEditableWarning className="positive">Positive</td>
            </tr>
          </tbody>
        </table>

        <h2>Preferred Trade</h2>
        <div className="highlight">
          <ul>
            <li contentEditable suppressContentEditableWarning>NIFTY (CMP 24632): Buy at CMP. Stop at 24261. Targets 24750/24857. Aggressive targets at 25000-25300 zone.</li>
            <br />
            <li contentEditable suppressContentEditableWarning>BANKNIFTY (CMP 55432): Buy at CMP. Stop at 54501. Targets 55750/56100. Aggressive targets at 56700 mark.</li>
          </ul>
        </div>

        <h2>Option Call</h2>
        <div className="highlight">
          <ul>
            <li contentEditable suppressContentEditableWarning>BUY NIFTY 16th September PE Strike Price 24600 at CMP 77.70. Maximum Loss: ₹ 5827.50. Profit: Unlimited. Stop: Exit Put Option if NIFTY September FUTURES moves above 24891. Analyst's Remark: Profit-taking likely amidst long unwinding.</li>
          </ul>
        </div>

        <h2>All About Stocks</h2>
        <table>
          <thead>
            <tr>
              <th>STOCKS</th><th>CMP</th><th>SUPPORT</th><th>RESIST</th><th>21 DMA</th><th>200 DMA</th><th>BIAS</th><th>PREFERRED TRADE</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Eternal", cmp: "318", s: "313", r: "333", d21: "300", d200: "250", bias: "Positive", trade: "Buy at CMP. Stop 303. Targets 321/333." },
              { name: "Maruti", cmp: "12936", s: "12511", r: "13501", d21: "12551", d200: "12004", bias: "Positive", trade: "Buy at CMP. Stop at 12331. Targets 13287/13501." },
              { name: "SBIN", cmp: "827", s: "808", r: "843", d21: "811", d200: "791", bias: "Positive", trade: "Buy at CMP. Stop at 805. Targets 843/857." }
            ].map((stock, i) => (
              <tr key={i}>
                <td contentEditable suppressContentEditableWarning>{stock.name}</td>
                <td contentEditable suppressContentEditableWarning>{stock.cmp}</td>
                <td contentEditable suppressContentEditableWarning>{stock.s}</td>
                <td contentEditable suppressContentEditableWarning>{stock.r}</td>
                <td contentEditable suppressContentEditableWarning>{stock.d21}</td>
                <td contentEditable suppressContentEditableWarning>{stock.d200}</td>
                <td contentEditable suppressContentEditableWarning className="positive">{stock.bias}</td>
                <td contentEditable suppressContentEditableWarning>{stock.trade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Medium Term Trades and Technical Strategy sections simplified for brevity but follow same pattern */}
        <h2>Medium Term Trades</h2>
        <table>
            <thead>
                <tr><th>STOCKS</th><th>CMP</th><th>SUPPORT</th><th>RESIST</th><th>21 DMA</th><th>200 DMA</th><th>BIAS</th><th>PREFERRED TRADE</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td contentEditable suppressContentEditableWarning>CIPLA</td>
                    <td contentEditable suppressContentEditableWarning>1564</td>
                    <td contentEditable suppressContentEditableWarning>1409</td>
                    <td contentEditable suppressContentEditableWarning>1702</td>
                    <td contentEditable suppressContentEditableWarning>1514</td>
                    <td contentEditable suppressContentEditableWarning>1488</td>
                    <td contentEditable suppressContentEditableWarning className="positive">Positive</td>
                    <td contentEditable suppressContentEditableWarning>Buy at CMP, targeting 1595/1702 mark...</td>
                </tr>
            </tbody>
        </table>

        <footer>
          <p className="small-note" contentEditable suppressContentEditableWarning>
            Disclaimer : Stock market investments are subject to market risks. All information provided is for educational and informational purposes only and represents personal views.
          </p>
          <div style={{ backgroundColor: '#aa0365', padding: '10px', marginTop: '10px' }}></div>
        </footer>
      </div>

      <button id="submitBtn" onClick={handleContinue}>Submit & Continue</button>
    </div>
  );
};

export default Builder;