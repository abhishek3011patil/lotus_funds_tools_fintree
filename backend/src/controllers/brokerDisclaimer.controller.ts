import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

const ALLOWED_BLOCKS = new Set([
  "company_name", "trade_name", "sebi_registration_no", "registration_category",
  "membership_code", "registered_address", "email", "mobile", "website",
  "authorized_person_name", "authorized_person_designation", "compliance_officer_name",
  "exchanges", "segments", "current_date",
]);

const getClientIp = (req: AuthRequest) => {
  const forwarded = req.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || req.ip || "Unknown").split(",")[0].trim();
};

const brokerRow = async (userId: string) => pool.query(
  `SELECT legal_name, trade_name, sebi_registration_no, registration_category, membership_code,
    registered_address, email, mobile, website, authorized_person_name,
    authorized_person_designation, compliance_officer_name,
    CONCAT_WS(', ', CASE WHEN exchange_nse THEN 'NSE' END, CASE WHEN exchange_bse THEN 'BSE' END,
      CASE WHEN exchange_smi THEN 'SMI' END, CASE WHEN exchange_ncdex THEN 'NCDEX' END) AS exchanges,
    CONCAT_WS(', ', CASE WHEN segment_cash THEN 'Cash' END, CASE WHEN segment_fo THEN 'F&O' END,
      CASE WHEN segment_currency THEN 'Currency' END) AS segments,
    disclaimer_template, disclaimer_updated_at
   FROM broker_details WHERE user_id=$1 LIMIT 1`,
  [userId]
);

const blockValues = (row: Record<string, unknown>) => ({
  company_name: row.legal_name || "",
  trade_name: row.trade_name || row.legal_name || "",
  sebi_registration_no: row.sebi_registration_no || "",
  registration_category: row.registration_category || "",
  membership_code: row.membership_code || "",
  registered_address: row.registered_address || "",
  email: row.email || "",
  mobile: row.mobile || "",
  website: row.website || "",
  authorized_person_name: row.authorized_person_name || "",
  authorized_person_designation: row.authorized_person_designation || "",
  compliance_officer_name: row.compliance_officer_name || "",
  exchanges: row.exchanges || "",
  segments: row.segments || "",
  current_date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date()),
});

const requireBroker = (req: AuthRequest, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ success: false, message: "Authentication is required." }); return false; }
  if (String(req.user.role || "").toUpperCase() !== "BROKER") { res.status(403).json({ success: false, message: "Broker access is required." }); return false; }
  return true;
};

export const getBrokerDisclaimer = async (req: AuthRequest, res: Response) => {
  if (!requireBroker(req, res)) return;
  try {
    const result = await brokerRow(req.user!.id);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Broker profile not found." });
    const row = result.rows[0];
    const version = await pool.query("SELECT COALESCE(MAX(version_number),0)::int AS version FROM broker_disclaimer_history WHERE broker_user_id=$1", [req.user!.id]);
    return res.json({ success: true, disclaimer: row.disclaimer_template || "", disclaimerUpdatedAt: row.disclaimer_updated_at, version: version.rows[0].version, blocks: blockValues(row) });
  } catch (error) {
    console.error("GET BROKER DISCLAIMER ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load the broker disclaimer." });
  }
};

export const updateBrokerDisclaimer = async (req: AuthRequest, res: Response) => {
  if (!requireBroker(req, res)) return;
  const template = String(req.body?.disclaimer || "").trim();
  if (template.length < 20) return res.status(400).json({ success: false, message: "Disclaimer must be at least 20 characters." });
  if (template.length > 10000) return res.status(400).json({ success: false, message: "Disclaimer must be 10,000 characters or fewer." });
  const tokens = [...template.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map(match => match[1].toLowerCase());
  const invalid = tokens.find(token => !ALLOWED_BLOCKS.has(token));
  if (invalid) return res.status(400).json({ success: false, message: `Unknown disclaimer block: {{${invalid}}}.` });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query("SELECT legal_name,disclaimer_template,disclaimer_updated_at FROM broker_details WHERE user_id=$1 FOR UPDATE", [req.user!.id]);
    if (!current.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Broker profile not found." }); }
    const versionResult = await client.query("SELECT COALESCE(MAX(version_number),0)+1 AS next_version FROM broker_disclaimer_history WHERE broker_user_id=$1", [req.user!.id]);
    const version = Number(versionResult.rows[0].next_version);
    await client.query("INSERT INTO broker_disclaimer_history (broker_user_id,disclaimer_template,version_number) VALUES ($1,$2,$3)", [req.user!.id, template, version]);
    const updated = await client.query("UPDATE broker_details SET disclaimer_template=$1,disclaimer_updated_at=NOW(),updated_at=NOW() WHERE user_id=$2 RETURNING disclaimer_template,disclaimer_updated_at", [template, req.user!.id]);
    await client.query("COMMIT");
    await createAuditLog({ adminId: req.user!.id, adminName: req.user?.name || "Broker", adminRole: "BROKER", action: "DISCLAIMER_UPDATED", module: "BROKER_PROFILE", targetEntity: current.rows[0].legal_name || req.user!.id, targetType: "DISCLAIMER", description: `Broker disclaimer updated. Version ${version} created.`, ipAddress: getClientIp(req), device: String(req.headers["user-agent"] || ""), oldValue: { disclaimer: current.rows[0].disclaimer_template, disclaimerUpdatedAt: current.rows[0].disclaimer_updated_at }, newValue: { disclaimer: template, version, disclaimerUpdatedAt: updated.rows[0].disclaimer_updated_at } });
    return res.json({ success: true, disclaimer: updated.rows[0].disclaimer_template, disclaimerUpdatedAt: updated.rows[0].disclaimer_updated_at, version, message: "Broker disclaimer saved." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("UPDATE BROKER DISCLAIMER ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to save the broker disclaimer." });
  } finally { client.release(); }
};
