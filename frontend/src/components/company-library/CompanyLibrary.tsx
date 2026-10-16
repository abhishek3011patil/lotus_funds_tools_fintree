import { useEffect, useRef, useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  CompanyBrand, createCompanyBrand, deleteCompanyBrand, listCompanyBrands, updateCompanyBrand,
} from "../../services/companyBrands.service";
import { dominantBrandColor, readLogo, trimLogo } from "./logoColor";
import "./CompanyLibrary.css";

export type CompanyLibraryState = {
  companies: CompanyBrand[];
  selectedIds: string[];
  previewId: string;
};

type CompanyDraft = Pick<CompanyBrand, "name" | "color" | "recipientEmail">;
type Props = {
  onChange: (state: CompanyLibraryState) => void;
  onMessage: (message: string) => void;
  disabled?: boolean;
};

const messageFrom = (error: unknown) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};

export default function CompanyLibrary({ onChange, onMessage, disabled = false }: Props) {
  const [companies, setCompanies] = useState<CompanyBrand[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState("");
  const [settingsId, setSettingsId] = useState("");
  const [draft, setDraft] = useState<CompanyDraft | null>(null);
  const [working, setWorking] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCompanyBrands().then(items => {
      setCompanies(items);
      setPreviewId(items[0]?.id || "");
    }).catch(error => onMessage(messageFrom(error)));
  }, [onMessage]);

  useEffect(() => onChange({ companies, selectedIds, previewId }), [companies, selectedIds, previewId, onChange]);

  const uploadCompanies = async (files: FileList | null) => {
    if (!files?.length) return;
    setWorking(true);
    const added: CompanyBrand[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPG, or WebP logo");
        if (file.size > 1024 * 1024) throw new Error("Logo must be under 1 MB");
        const logoDataUrl = await trimLogo(await readLogo(file));
        if (logoDataUrl.length > 1.4 * 1024 * 1024) throw new Error("Prepared logo is over 1 MB; use a smaller image");
        const company = await createCompanyBrand({
          name: file.name.replace(/\.[^.]+$/, "").trim(),
          color: await dominantBrandColor(logoDataUrl),
          recipientEmail: "",
          logoDataUrl,
        });
        added.push(company);
      } catch (error) {
        errors.push(`${file.name}: ${messageFrom(error)}`);
      }
    }
    if (added.length) {
      setCompanies(current => [...current, ...added].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIds(current => [...current, ...added.map(company => company.id)]);
      setPreviewId(added[0].id);
    }
    onMessage(errors.length ? errors.join(" · ") : `${added.length} company${added.length === 1 ? "" : "ies"} saved.`);
    if (uploadRef.current) uploadRef.current.value = "";
    setWorking(false);
  };

  const openSettings = (company: CompanyBrand) => {
    if (settingsId === company.id) {
      setSettingsId("");
      setDraft(null);
      return;
    }
    setSettingsId(company.id);
    setDraft({ name: company.name, color: company.color, recipientEmail: company.recipientEmail });
  };

  const save = async (company: CompanyBrand) => {
    if (!draft) return;
    setWorking(true);
    try {
      const saved = await updateCompanyBrand(company.id, draft);
      setCompanies(current => current.map(item => item.id === company.id ? saved : item));
      setSettingsId("");
      setDraft(null);
      onMessage(`${saved.name} settings saved.`);
    } catch (error) { onMessage(messageFrom(error)); }
    finally { setWorking(false); }
  };

  const remove = async (company: CompanyBrand) => {
    if (!window.confirm(`Remove ${company.name} from the shared company library?`)) return;
    setWorking(true);
    try {
      await deleteCompanyBrand(company.id);
      const remaining = companies.filter(item => item.id !== company.id);
      setCompanies(remaining);
      setSelectedIds(current => current.filter(id => id !== company.id));
      if (previewId === company.id) setPreviewId(remaining[0]?.id || "");
      setSettingsId("");
      setDraft(null);
      onMessage(`${company.name} removed.`);
    } catch (error) { onMessage(messageFrom(error)); }
    finally { setWorking(false); }
  };

  return <section className="company-library">
    <div className="company-library__heading"><h2>Company library</h2><p>Client logos, colors, and email addresses are saved for employee tools.</p></div>
    <label className="company-library__upload">Add company logos<input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={disabled || working} onChange={event => void uploadCompanies(event.target.files)} /></label>
    <p className="company-library__hint">A logo’s main color is selected automatically. Use the settings button beside it to save its client email.</p>
    {companies.length > 0 && <div className="company-library__selection">
      <button type="button" onClick={() => setSelectedIds(companies.map(company => company.id))} disabled={disabled || working}>Select all</button>
      <button type="button" onClick={() => setSelectedIds([])} disabled={disabled || working}>Clear</button>
      <span>{selectedIds.length} selected</span>
    </div>}
    <div className="company-library__list">
      {companies.length === 0 ? <p className="company-library__empty">Add your first company logo to begin.</p> : companies.map(company => <div className="company-library__item" key={company.id}>
        <div className="company-library__row">
          <input type="checkbox" aria-label={`Include ${company.name}`} checked={selectedIds.includes(company.id)} disabled={disabled || working} onChange={event => setSelectedIds(current => event.target.checked ? [...current, company.id] : current.filter(id => id !== company.id))} />
          <button type="button" className="company-library__logo" title={`Preview ${company.name}`} onClick={() => setPreviewId(company.id)}><img src={company.logoDataUrl} alt="" /></button>
          <div className="company-library__identity"><strong>{company.name}</strong><span>{company.recipientEmail || "No client email saved"}</span></div>
          <span className="company-library__color" style={{ backgroundColor: company.color }} title={`Brand color ${company.color}`} />
          <button type="button" className="company-library__settings-button" aria-label={`Settings for ${company.name}`} aria-expanded={settingsId === company.id} onClick={() => openSettings(company)} disabled={disabled || working}><SettingsOutlinedIcon fontSize="small" /></button>
        </div>
        {settingsId === company.id && draft && <div className="company-library__settings">
          <label>Company name<input value={draft.name} maxLength={100} onChange={event => setDraft(current => current && { ...current, name: event.target.value })} /></label>
          <label>Brand color<input type="color" value={draft.color} onChange={event => setDraft(current => current && { ...current, color: event.target.value })} /></label>
          <label>Client email<input type="email" value={draft.recipientEmail} placeholder="client@example.com" onChange={event => setDraft(current => current && { ...current, recipientEmail: event.target.value })} /></label>
          <div className="company-library__actions"><button type="button" onClick={() => void save(company)} disabled={working}>Save settings</button><button type="button" onClick={() => void remove(company)} disabled={working}>Remove company</button></div>
        </div>}
      </div>)}
    </div>
  </section>;
}
