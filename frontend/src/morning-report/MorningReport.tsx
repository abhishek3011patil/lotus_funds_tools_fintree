import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MorningReport: React.FC = () => {
  const navigate = useNavigate();
  const [reportHTML, setReportHTML] = useState<string>('');

  useEffect(() => {
    // Logic preserved: Fetch from localStorage
    const savedReport = localStorage.getItem("reportHTML");
    if (savedReport) {
      setReportHTML(savedReport);
    }
  }, []);

  const handleContinue = () => {
    // This assumes your next route is '/logo-theme'
    navigate('/logo-theme');
  };

  return (
    <>
      <style>{`
        .report-body-container {
          font-family: 'Inter', sans-serif;
          max-width: 900px;
          margin: auto;
          padding: 20px;
          background: #fff;
          color: #000;
          line-height: 1.45;
        }

        /* HEADER */
        header {
          text-align: center;
          border-bottom: 2px solid #ddd;
          margin-bottom: 18px;
          display: flex;        /* Added to help centering */
          flex-direction: column;
          align-items: center;
        }
        header img {
         max-width: 100%;      
          max-height: 150px;    /* Prevents the logo from becoming huge */
          width: auto;          /* Maintains original aspect ratio */
          height: auto;
          display: block;
          margin: 0 auto 10px auto;
          object-fit: contain;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end; /* Aligns date to the bottom of the title text */
          gap: 20px;            /* Forces a minimum gap between title and date */
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .report-title {
          font-size: 32px;      /* Slightly reduced to create more breathing room */
          font-weight: 700;
          margin: 0;
          flex-shrink: 1;
        }
        .report-date {
          font-size: 15px;
          font-weight: 650;
          margin: 0;
          white-space: nowrap;  /* Prevents the date from breaking into two lines */
          padding-bottom: 5px
        }

        /* COLORS */
        .positive { color: #00C853; font-weight: 600; }
        .negative { color: #D50000; font-weight: 600; }
        .neutral  { color: #757575; font-weight: 600; }

        /* GRIDS */
        .index-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }
        .stock-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        /* GENERIC CARD */
        .card {
          background: #fafafa;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 10px;
          font-size: 12.5px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
        }
        .card-trend {
          font-size: 12.5px;
          font-weight: 600;
        }

        .mini-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
        }
        .mini-table td {
          padding: 4px 6px;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }

        .trade-note {
          font-size: 12.3px;
          line-height: 1.45;
          text-align: center;
        }

        .highlight, .spotlight-box {
          background: #fafafa;
          padding: 14px;
          border-radius: 6px;
          border: 1px solid #ddd;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .spotlight-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .spotlight-title span { color: #aa0365; }

        .spotlight-grid {
          display: grid;
          grid-template-columns: 40% 60%;
          gap: 14px;
        }

        .spotlight-chart {
          border: 1px solid #ddd;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spotlight-content { padding: 0px 16px 6px 0px; }

        .spotlight-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .spotlight-table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
          font-size: 12.5px;
        }

        .spotlight-note {
          font-size: 12.5px;
          line-height: 1.45;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        th, td {
          padding: 8px;
          border: 1px solid #ddd;
          font-size: 0.9rem;
        }
        th {
          background: #aa0365;
          color: #fff;
        }

        footer {
          margin-top: 18px;
          text-align: center;
          font-size: 0.85rem;
        }

        .nav-controls {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #fff;
          padding: 15px;
          border-radius: 50px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          gap: 10px;
          z-index: 100;
        }

        .btn-continue {
          background: #aa0365;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
        }

        @media(max-width: 900px) {
          .index-card-grid, .stock-card-grid, .spotlight-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Navigation Controls (React Specific) */}
      <div className="nav-controls">
        <button className="btn-continue" onClick={handleContinue}>
          Submit & Continue →
        </button>
      </div>

      <div className="report-body-container">
        {reportHTML ? (
          <div 
            id="reportPreview" 
            dangerouslySetInnerHTML={{ __html: reportHTML }} 
          />
        ) : (
          <div id="reportPreview">
            No report data found. Please go back and generate the report.
          </div>
        )}
      </div>
    </>
  );
};

export default MorningReport;