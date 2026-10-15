import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  CompanyBrand, createCompanyBrand, deleteCompanyBrand, listCompanyBrands, updateCompanyBrand,
} from "../../services/companyBrands.service";
import { dominantBrandColor, readLogo, trimLogo } from "./logoColor";
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

export default function FiiDiiMaker() {
  const [data, setData] = useState<FiiDiiData>(emptyFiiDiiData);
  const [companies, setCompanies] = useState<CompanyBrand[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCompanyBrands().then(items => {
      setCompanies(items);
      setPreviewId(items[0]?.id || "");
    }).catch(error => setMessage(messageFrom(error)));
  }, []);

  const previewCompany = companies.find(company => company.id === previewId) || companies[0];
  const previewSvg = useMemo(() => previewCompany ? createFiiDiiSvg(data, previewCompany) : "", [data, previewCompany]);

  const updateValue = (key: DataKey, value: string) => setData(current => ({
    ...current, values: { ...current.values, [key]: value },
  }));

  const uploadCompanies = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMessage("");
    const added: CompanyBrand[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPG, or WebP logo");
        if (file.size > 1024 * 1024) throw new Error("Logo must be under 1 MB");
        const logoDataUrl = await trimLogo(await readLogo(file));
        if (logoDataUrl.length > 1.4 * 1024 * 1024) throw new Error("Prepared logo is over 1 MB; use a smaller image");
        const color = await dominantBrandColor(logoDataUrl);
        const name = file.name.replace(/\.[^.]+$/, "").trim();
        added.push(await createCompanyBrand({ name, color, logoDataUrl }));
      } catch (error) {
        errors.push(`${file.name}: ${messageFrom(error)}`);
      }
    }
    if (added.length) {
      setCompanies(current => [...current, ...added].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIds(current => [...current, ...added.map(company => company.id)]);
      setPreviewId(added[0].id);
    }
    setMessage(errors.length ? errors.join(" · ") : `${added.length} company${added.length === 1 ? "" : "ies"} saved to the company library.`);
    if (uploadRef.current) uploadRef.current.value = "";
    setBusy(false);
  };

  const updateCompanyLocal = (id: string, changes: Partial<CompanyBrand>) => setCompanies(current =>
    current.map(company => company.id === id ? { ...company, ...changes } : company));

  const saveCompany = async (company: CompanyBrand) => {
    try {
      const saved = await updateCompanyBrand(company.id, { name: company.name.trim(), color: company.color });
      updateCompanyLocal(company.id, saved);
      setMessage(`${saved.name} saved.`);
    } catch (error) { setMessage(messageFrom(error)); }
  };

  const removeCompany = async (company: CompanyBrand) => {
    if (!window.confirm(`Remove ${company.name} from the shared company library?`)) return;
    try {
      await deleteCompanyBrand(company.id);
      const remaining = companies.filter(item => item.id !== company.id);
      setCompanies(remaining);
      setSelectedIds(current => current.filter(id => id !== company.id));
      if (previewId === company.id) setPreviewId(remaining[0]?.id || "");
      setMessage(`${company.name} removed.`);
    } catch (error) { setMessage(messageFrom(error)); }
  };

  const downloadBulk = async () => {
    const selected = companies.filter(company => selectedIds.includes(company.id));
    if (!selected.length) return setMessage("Select at least one company.");
    const incomplete = DATA_FIELDS.some(field => {
      const raw = data.values[field.key];
      return raw === "" || !Number.isFinite(Number(raw)) || Math.abs(Number(raw) * 10 - Math.round(Number(raw) * 10)) > 0.00001;
    });
    if (incomplete || !data.date || !data.giftTime.trim() || !data.giftLevel.trim() || !data.giftChange.trim()) {
      return setMessage("Enter every figure to one decimal place, plus the date and Gift Nifty details.");
    }
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

  return <div className="fii-maker">
    <div className="fii-maker__intro">
      <div>
        <p className="fii-maker__eyebrow">MORNING / EMPLOYEE TOOLS</p>
        <h1>FII/DII activity maker</h1>
        <p>Enter the figures once, select companies, and download branded reports together.</p>
      </div>
      <button className="fii-maker__primary" onClick={downloadBulk} disabled={busy}>Download selected as ZIP</button>
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

        <section className="fii-maker__panel">
          <div className="fii-maker__panel-head"><span className="fii-maker__step">02</span><div><h2>Company library</h2><p>Uploaded logos and brand colors are saved for other employee tools.</p></div></div>
          <label className="fii-maker__upload">Add company logos<input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => void uploadCompanies(event.target.files)} disabled={busy} /></label>
          <p className="fii-maker__hint">Color is selected from the main nonblack logo color. Adjust it below if needed.</p>
          {companies.length > 0 && <div className="fii-maker__selection"><button onClick={() => setSelectedIds(companies.map(company => company.id))}>Select all</button><button onClick={() => setSelectedIds([])}>Clear</button><span>{selectedIds.length} selected</span></div>}
          <div className="fii-maker__company-list">
            {companies.length === 0 ? <p className="fii-maker__empty">Add your first company logo to begin.</p> : companies.map(company => <div className="fii-maker__company" key={company.id}>
              <input type="checkbox" aria-label={`Include ${company.name}`} checked={selectedIds.includes(company.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, company.id] : current.filter(id => id !== company.id))} />
              <button className="fii-maker__logo" title="Preview this company" onClick={() => setPreviewId(company.id)}><img src={company.logoDataUrl} alt="" /></button>
              <div className="fii-maker__company-edit"><input aria-label="Company name" value={company.name} onChange={event => updateCompanyLocal(company.id, { name: event.target.value })} /><div><input type="color" aria-label={`${company.name} brand color`} value={company.color} onChange={event => updateCompanyLocal(company.id, { color: event.target.value })} /><span>{company.color.toUpperCase()}</span></div></div>
              <button className="fii-maker__small" onClick={() => void saveCompany(company)}>Save</button>
              <button className="fii-maker__remove" title={`Remove ${company.name}`} aria-label={`Remove ${company.name}`} onClick={() => void removeCompany(company)}>×</button>
            </div>)}
          </div>
        </section>
      </div>

      <section className="fii-maker__panel fii-maker__preview">
        <div className="fii-maker__panel-head"><span className="fii-maker__step">03</span><div><h2>Live preview</h2><p>Each selected company receives the same figures with its own logo and color.</p></div></div>
        {previewCompany ? <><select aria-label="Preview company" value={previewCompany.id} onChange={event => setPreviewId(event.target.value)}>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
          <div className="fii-maker__sheet-wrap"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`} alt={`FII DII activity sheet preview for ${previewCompany.name}`} /></div></>
          : <div className="fii-maker__preview-empty">Your report preview appears here after adding a logo.</div>}
        <button className="fii-maker__primary fii-maker__download" onClick={downloadBulk} disabled={busy}>Download {selectedIds.length || "selected"} reports as ZIP</button>
      </section>
    </div>
  </div>;
}
