import { forwardRef } from "react";
import type { CompanyBrand } from "../../services/companyBrands.service";
import type { DashboardSection, MarketDashboardData } from "./data";

type Props = { data: MarketDashboardData; company: CompanyBrand };

const formatDate = (raw: string) => {
  const date = new Date(`${raw}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return "Select a date";
  const day = date.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] || "th";
  return `${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)}, ${new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)} ${day}${suffix} ${date.getFullYear()}`;
};

function SectionTable({ section, className = "" }: { section: DashboardSection; className?: string }) {
  return <section className={`md-sheet__section ${className}`}>
    <div className="md-sheet__section-title">{section.title}</div>
    <table>
      {section.headers && <thead><tr><th /><>{section.headers.map(header => <th key={header}>{header}</th>)}</></tr></thead>}
      <tbody>{section.rows.map(row => <tr key={row.label}><td>{row.label}</td>{row.values.map((value, index) => <td key={index}>{value || " "}</td>)}</tr>)}</tbody>
    </table>
  </section>;
}

const MarketDashboardSheet = forwardRef<HTMLDivElement, Props>(({ data, company }, ref) => (
  <div ref={ref} className="md-sheet" style={{ "--brand": company.color } as React.CSSProperties}>
    <header className="md-sheet__topbar">
      <div className="md-sheet__logo"><img src={company.logoDataUrl} alt="" /></div>
      <h1>Daily Market Dashboard</h1>
    </header>
    <section className="md-sheet__meta">
      <div>
        <div><strong>Source:</strong> {data.source}</div>
        <div><strong>Prepared by:</strong> {data.preparedBy}</div>
        <div><strong>SEBI Registration Number:</strong> {data.sebiNumber || "—"}</div>
        <div><strong>Email ID:</strong> {data.email || "—"}</div>
      </div>
      <div className="md-sheet__date">{formatDate(data.date)}</div>
    </section>
    <div className="md-sheet__columns">
      <div>
        <SectionTable section={data.sections.indian} className="md-sheet__indices" />
        <SectionTable section={data.sections.global} className="md-sheet__global" />
        <SectionTable section={data.sections.institutional} />
        <section className="md-sheet__section"><div className="md-sheet__section-title">F&amp;O BAN</div><div className="md-sheet__ban">{data.foBan || "NO STOCKS IN BAN"}</div></section>
      </div>
      <aside>
        <SectionTable section={data.sections.energy} />
        <SectionTable section={data.sections.bonds} />
        <SectionTable section={data.sections.metals} />
        <SectionTable section={data.sections.forex} />
      </aside>
    </div>
    <section className="md-sheet__chart">
      <div className="md-sheet__section-title">CHART OF THE DAY</div>
      <div className="md-sheet__chart-frame"><img src={data.chartDataUrl} alt="Chart of the day" /></div>
      <div className="md-sheet__chart-caption">{data.chartCaption}</div>
    </section>
    <footer className="md-sheet__disclaimer">
      <div><strong>DISCLAIMER CUM DISCLOSURE:</strong> {data.disclaimer}</div>
      <div><strong>Research Analyst:</strong> {data.analystDisclosure}</div>
      {data.disclosureUrl && <div>Read Full Disclaimer / Disclosure at: {data.disclosureUrl}</div>}
    </footer>
    <div className="md-sheet__bottom-band" />
  </div>
));

MarketDashboardSheet.displayName = "MarketDashboardSheet";
export default MarketDashboardSheet;
