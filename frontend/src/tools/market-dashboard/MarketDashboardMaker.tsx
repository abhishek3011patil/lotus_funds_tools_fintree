import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toBlob } from "html-to-image";
import { jsPDF } from "jspdf";
import CompanyLibrary, { CompanyLibraryState } from "../../components/company-library/CompanyLibrary";
import { sendCompanyReport, type CompanyBrand } from "../../services/companyBrands.service";
import { createMarketDashboardData, MarketDashboardData, SECTION_ORDER } from "./data";
import MarketDashboardSheet from "./MarketDashboardSheet";
import "./MarketDashboardMaker.css";

const cleanFilename = (name: string) => name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Company";
const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const blobDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("Could not prepare the report"));
  reader.readAsDataURL(blob);
});
const messageFrom = (error: unknown) => error instanceof Error ? error.message : "Something went wrong";

const textFields: Array<[keyof Pick<MarketDashboardData, "source" | "preparedBy" | "sebiNumber" | "email">, string]> = [
  ["source", "Source"], ["preparedBy", "Prepared by"], ["sebiNumber", "SEBI registration number"], ["email", "Email ID"],
];

export default function MarketDashboardMaker() {
  const [data, setData] = useState(createMarketDashboardData);
  const [library, setLibrary] = useState<CompanyLibraryState>({ companies: [], selectedIds: [], previewId: "" });
  const [renderCompany, setRenderCompany] = useState<CompanyBrand | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const previewHostRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { companies, selectedIds, previewId } = library;
  const previewCompany = useMemo(() => companies.find(company => company.id === previewId) || companies[0] || null, [companies, previewId]);
  const displayedCompany = renderCompany || previewCompany;

  useEffect(() => {
    const host = previewHostRef.current;
    if (!host) return;
    const update = () => setScale(Math.min(1, host.clientWidth / 1152));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const updateValue = (sectionId: string, rowIndex: number, valueIndex: number, value: string) => setData(current => ({
    ...current,
    sections: {
      ...current.sections,
      [sectionId]: {
        ...current.sections[sectionId],
        rows: current.sections[sectionId].rows.map((row, index) => index === rowIndex
          ? { ...row, values: row.values.map((cell, cellIndex) => cellIndex === valueIndex ? value : cell) }
          : row),
      },
    },
  }));

  const uploadChart = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Use an image file for the daily chart.");
    if (file.size > 5 * 1024 * 1024) return setMessage("Chart image must be under 5 MB.");
    const reader = new FileReader();
    reader.onload = () => setData(current => ({ ...current, chartDataUrl: String(reader.result) }));
    reader.onerror = () => setMessage("Could not read the chart image.");
    reader.readAsDataURL(file);
  };

  const createPng = async (company: CompanyBrand) => {
    setRenderCompany(company);
    await nextPaint();
    if (!sheetRef.current) throw new Error("Report preview is not ready");
    const blob = await toBlob(sheetRef.current, { width: 1152, height: 2048, pixelRatio: 1, backgroundColor: "#ffffff", cacheBust: false });
    if (!blob) throw new Error("Could not create the report image");
    return blob;
  };

  const createPdf = async (png: Blob) => {
    const pngUrl = await blobDataUrl(png);
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1152, 2048], hotfixes: ["px_scaling"], compress: true });
    pdf.addImage(pngUrl, "PNG", 0, 0, 1152, 2048, undefined, "FAST");
    return pdf.output("blob");
  };

  const selectedCompanies = () => companies.filter(company => selectedIds.includes(company.id));

  const downloadReports = async () => {
    const selected = selectedCompanies();
    if (!selected.length) return setMessage("Select at least one company.");
    setBusy(true);
    setMessage("Creating PNG and PDF reports…");
    try {
      const zip = new JSZip();
      for (const company of selected) {
        const png = await createPng(company);
        const base = `${cleanFilename(company.name)}_Market_Dashboard_${data.date}`;
        zip.file(`${base}.png`, png);
        zip.file(`${base}.pdf`, await createPdf(png));
      }
      saveAs(await zip.generateAsync({ type: "blob" }), `Market_Dashboard_${data.date}_PNG_PDF.zip`);
      setMessage(`${selected.length} dashboard${selected.length === 1 ? "" : "s"} downloaded as PNG and PDF.`);
    } catch (error) { setMessage(messageFrom(error)); }
    finally { setRenderCompany(null); setBusy(false); }
  };

  const emailReports = async () => {
    const selected = selectedCompanies();
    if (!selected.length) return setMessage("Select at least one company to email.");
    if (selected.length > 15) return setMessage("Send up to 15 company reports at a time.");
    const missing = selected.filter(company => !company.recipientEmail);
    if (missing.length) return setMessage(`Save a client email for: ${missing.map(company => company.name).join(", ")}.`);
    if (!window.confirm(`Send ${selected.length} daily market dashboard email${selected.length === 1 ? "" : "s"}?`)) return;
    setBusy(true);
    let accepted = 0;
    const errors: string[] = [];
    for (const company of selected) {
      setMessage(`Sending ${company.name} (${accepted + errors.length + 1}/${selected.length})…`);
      try {
        const png = await createPng(company);
        await sendCompanyReport(company.id, data.date, await blobDataUrl(png), "market-dashboard");
        accepted++;
      } catch (error) { errors.push(`${company.name}: ${messageFrom(error)}`); }
    }
    setRenderCompany(null);
    setMessage(`${accepted} dashboard email${accepted === 1 ? "" : "s"} accepted.${errors.length ? ` Failed: ${errors.join(" · ")}` : ""}`);
    setBusy(false);
  };

  return <div className="market-maker">
    <div className="market-maker__intro">
      <div><p className="market-maker__eyebrow">MORNING / EMPLOYEE TOOLS</p><h1>Daily market dashboard</h1><p>Update the market data and chart once, then create branded PNG and PDF reports.</p></div>
      <div className="market-maker__actions"><button onClick={() => void downloadReports()} disabled={busy}>Download PNG + PDF</button><button onClick={() => void emailReports()} disabled={busy}>Email selected reports</button></div>
    </div>
    {message && <div className="market-maker__message" role="status">{message}</div>}
    <div className="market-maker__layout">
      <div className="market-maker__controls">
        <section className="market-maker__panel">
          <div className="market-maker__panel-head"><span>01</span><div><h2>Report details</h2><p>These details and disclosures can be changed for every report.</p></div></div>
          <div className="market-maker__form-grid">
            <label>Report date<input type="date" value={data.date} onChange={event => setData(current => ({ ...current, date: event.target.value }))} /></label>
            {textFields.map(([key, label]) => <label key={key}>{label}<input value={data[key]} onChange={event => setData(current => ({ ...current, [key]: event.target.value }))} /></label>)}
          </div>
        </section>
        <section className="market-maker__panel">
          <div className="market-maker__panel-head"><span>02</span><div><h2>Daily market data</h2><p>Open a section and replace its values. Blank cells stay blank in the report.</p></div></div>
          <div className="market-maker__data-groups">
            {SECTION_ORDER.map(sectionId => { const section = data.sections[sectionId]; return <details key={sectionId} open={sectionId === "indian"}>
              <summary>{section.title}</summary>
              <div className="market-maker__table-editor">
                {section.rows.map((row, rowIndex) => <div className="market-maker__data-row" key={row.label}><strong>{row.label}</strong>{row.values.map((value, valueIndex) => <input key={valueIndex} aria-label={`${row.label} ${section.headers?.[valueIndex] || "value"}`} placeholder={section.headers?.[valueIndex] || "Value"} value={value} onChange={event => updateValue(sectionId, rowIndex, valueIndex, event.target.value)} />)}</div>)}
              </div>
            </details>; })}
          </div>
          <label className="market-maker__wide-field">F&amp;O ban<textarea rows={3} value={data.foBan} onChange={event => setData(current => ({ ...current, foBan: event.target.value }))} /></label>
        </section>
        <section className="market-maker__panel">
          <div className="market-maker__panel-head"><span>03</span><div><h2>Chart of the day</h2><p>Upload the new graph each morning; it fills the chart area in the template.</p></div></div>
          <label className="market-maker__upload">Upload daily graph<input type="file" accept="image/*" onChange={event => uploadChart(event.target.files?.[0])} /></label>
          <label className="market-maker__wide-field">Chart caption<input value={data.chartCaption} onChange={event => setData(current => ({ ...current, chartCaption: event.target.value }))} /></label>
        </section>
        <section className="market-maker__panel">
          <div className="market-maker__panel-head"><span>04</span><div><h2>Disclaimer and disclosure</h2><p>All footer wording is editable.</p></div></div>
          <label className="market-maker__wide-field">Disclaimer<textarea rows={5} value={data.disclaimer} onChange={event => setData(current => ({ ...current, disclaimer: event.target.value }))} /></label>
          <label className="market-maker__wide-field">Analyst disclosure<textarea rows={5} value={data.analystDisclosure} onChange={event => setData(current => ({ ...current, analystDisclosure: event.target.value }))} /></label>
          <label className="market-maker__wide-field">Full disclosure URL<input value={data.disclosureUrl} placeholder="https://…" onChange={event => setData(current => ({ ...current, disclosureUrl: event.target.value }))} /></label>
        </section>
        <div className="market-maker__panel"><CompanyLibrary onChange={setLibrary} onMessage={setMessage} disabled={busy} /></div>
      </div>
      <section className="market-maker__panel market-maker__preview">
        <div className="market-maker__panel-head"><span>05</span><div><h2>Live template preview</h2><p>The full supplied layout scales to the available space without dropping sections.</p></div></div>
        {displayedCompany ? <>
          <p className="market-maker__preview-name">Preview: {displayedCompany.name}. Click another saved logo to switch.</p>
          <div className="market-maker__preview-host" ref={previewHostRef} style={{ height: 2048 * scale }}>
            <div className="market-maker__preview-scale" style={{ transform: `scale(${scale})` }}><MarketDashboardSheet ref={sheetRef} data={data} company={displayedCompany} /></div>
          </div>
        </> : <div className="market-maker__preview-empty">Add a company logo to show the branded dashboard preview.</div>}
        <button className="market-maker__full-button" onClick={() => void downloadReports()} disabled={busy}>Download {selectedIds.length || "selected"} as PNG + PDF</button>
        <button className="market-maker__full-button" onClick={() => void emailReports()} disabled={busy}>Email {selectedIds.length || "selected"} reports</button>
      </section>
    </div>
  </div>;
}
