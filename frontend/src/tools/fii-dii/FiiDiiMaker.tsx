import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import CompanyLibrary, { CompanyLibraryState } from "../../components/company-library/CompanyLibrary";
import { sendCompanyReport } from "../../services/companyBrands.service";
import { createFiiDiiSvg, DATA_FIELDS, DataKey, emptyFiiDiiData, FiiDiiData, svgToPng } from "./sheet";
import "./FiiDiiMaker.css";

const GROUPS = [
  { id: "today", title: "Today's activity" },
  { id: "week", title: "Week till date" },
  { id: "month", title: "Month till date" },
  { id: "fy", title: "FY till date" },
] as const;

const messageFrom = (error: unknown) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};

const cleanFilename = (name: string) => name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Company";
const pngDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("Could not prepare the report image"));
  reader.readAsDataURL(blob);
});

export default function FiiDiiMaker() {
  const [data, setData] = useState<FiiDiiData>(emptyFiiDiiData);
  const [library, setLibrary] = useState<CompanyLibraryState>({ companies: [], selectedIds: [], previewId: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { companies, selectedIds, previewId } = library;
  const previewCompany = companies.find(company => company.id === previewId) || companies[0];
  const previewSvg = useMemo(() => previewCompany ? createFiiDiiSvg(data, previewCompany) : "", [data, previewCompany]);

  const updateValue = (key: DataKey, value: string) => setData(current => ({
    ...current, values: { ...current.values, [key]: value },
  }));

  const reportIsIncomplete = () => {
    const incomplete = DATA_FIELDS.some(field => {
      const raw = data.values[field.key];
      return raw === "" || !Number.isFinite(Number(raw)) || Math.abs(Number(raw) * 10 - Math.round(Number(raw) * 10)) > 0.00001;
    });
    return incomplete || !data.date || !data.giftTime.trim() || !data.giftLevel.trim() || !data.giftChange.trim();
  };

  const downloadBulk = async () => {
    const selected = companies.filter(company => selectedIds.includes(company.id));
    if (!selected.length) return setMessage("Select at least one company.");
    if (reportIsIncomplete()) return setMessage("Enter every figure to one decimal place, plus the date and Gift Nifty details.");
    setBusy(true);
    setMessage("Creating report images…");
    try {
      const zip = new JSZip();
      for (const company of selected) {
        const image = await svgToPng(createFiiDiiSvg(data, company));
        zip.file(`${cleanFilename(company.name)}_FII_DII_${data.date}.png`, image);
      }
      saveAs(await zip.generateAsync({ type: "blob" }), `FII_DII_${data.date}.zip`);
      setMessage(`${selected.length} PNG report${selected.length === 1 ? "" : "s"} downloaded in one ZIP.`);
    } catch (error) { setMessage(messageFrom(error)); }
    finally { setBusy(false); }
  };

  const emailSelected = async () => {
    const selected = companies.filter(company => selectedIds.includes(company.id));
    if (!selected.length) return setMessage("Select at least one company to email.");
    if (selected.length > 15) return setMessage("Send up to 15 company reports at a time.");
    const missingEmail = selected.filter(company => !company.recipientEmail);
    if (missingEmail.length) return setMessage(`Save a client email in settings for: ${missingEmail.map(company => company.name).join(", ")}.`);
    if (reportIsIncomplete()) return setMessage("Enter every figure to one decimal place, plus the date and Gift Nifty details.");
    if (!window.confirm(`Send ${selected.length} FII/DII report email${selected.length === 1 ? "" : "s"} from the configured Gmail account?\n\n${selected.map(company => `${company.name}: ${company.recipientEmail}`).join("\n")}`)) return;
    setBusy(true);
    const errors: string[] = [];
    let accepted = 0;
    for (const company of selected) {
      setMessage(`Sending ${company.name} (${accepted + errors.length + 1}/${selected.length})…`);
      try {
        const image = await svgToPng(createFiiDiiSvg(data, company));
        await sendCompanyReport(company.id, data.date, await pngDataUrl(image));
        accepted++;
      } catch (error) { errors.push(`${company.name}: ${messageFrom(error)}`); }
    }
    setMessage(`${accepted} report email${accepted === 1 ? "" : "s"} accepted by Gmail.${errors.length ? ` Failed: ${errors.join(" · ")}` : ""}`);
    setBusy(false);
  };

  return <div className="fii-maker">
    <div className="fii-maker__intro">
      <div>
        <p className="fii-maker__eyebrow">MORNING / EMPLOYEE TOOLS</p>
        <h1>FII/DII activity maker</h1>
        <p>Enter the figures once, select companies, and download branded reports together.</p>
      </div>
      <div className="fii-maker__actions"><button className="fii-maker__primary" onClick={downloadBulk} disabled={busy}>Download selected as ZIP</button><button className="fii-maker__primary" onClick={() => void emailSelected()} disabled={busy}>Email selected reports</button></div>
    </div>

    {message && <div className="fii-maker__message" role="status">{message}</div>}

    <div className="fii-maker__layout">
      <div className="fii-maker__controls">
        <section className="fii-maker__panel">
          <div className="fii-maker__panel-head"><span className="fii-maker__step">01</span><div><h2>Daily figures</h2><p>Use rupees in crores; reports show one decimal place.</p></div></div>
          <label className="fii-maker__date">Report date<input type="date" value={data.date} onChange={event => setData(current => ({ ...current, date: event.target.value }))} /></label>
          <div className="fii-maker__groups">
            {GROUPS.map(group => <div className="fii-maker__group" key={group.id}>
              <h3>{group.title}</h3>
              <div className="fii-maker__fields">
                {DATA_FIELDS.filter(field => field.group === group.id).map(field => <label key={field.key}>{field.label}
                  <input type="number" step="0.1" inputMode="decimal" placeholder="0.0" value={data.values[field.key]} onChange={event => updateValue(field.key, event.target.value)} />
                </label>)}
              </div>
            </div>)}
          </div>
          <div className="fii-maker__group">
            <h3>Gift Nifty</h3>
            <div className="fii-maker__fields fii-maker__fields--three">
              <label>Time<input type="time" value={data.giftTime} onChange={event => setData(current => ({ ...current, giftTime: event.target.value }))} /></label>
              <label>Level<input type="text" inputMode="decimal" placeholder="22788" value={data.giftLevel} onChange={event => setData(current => ({ ...current, giftLevel: event.target.value }))} /></label>
              <label>Change<input type="text" inputMode="decimal" placeholder="-63" value={data.giftChange} onChange={event => setData(current => ({ ...current, giftChange: event.target.value }))} /></label>
            </div>
          </div>
        </section>

        <div className="fii-maker__panel"><CompanyLibrary onChange={setLibrary} onMessage={setMessage} disabled={busy} /></div>
      </div>

      <section className="fii-maker__panel fii-maker__preview">
        <div className="fii-maker__panel-head"><span className="fii-maker__step">03</span><div><h2>Live preview</h2><p>Each selected company receives the same figures with its own logo and color.</p></div></div>
        {previewCompany ? <><p className="fii-maker__preview-name">Preview: {previewCompany.name}. Click another logo to switch.</p>
          <div className="fii-maker__sheet-wrap"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`} alt={`FII DII activity sheet preview for ${previewCompany.name}`} /></div></>
          : <div className="fii-maker__preview-empty">Your report preview appears here after adding a logo.</div>}
        <button className="fii-maker__primary fii-maker__download" onClick={downloadBulk} disabled={busy}>Download {selectedIds.length || "selected"} reports as ZIP</button>
        <button className="fii-maker__primary fii-maker__download" onClick={() => void emailSelected()} disabled={busy}>Email {selectedIds.length || "selected"} reports</button>
      </section>
    </div>
  </div>;
}
