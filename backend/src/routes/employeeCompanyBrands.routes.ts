import { Router, Response } from "express";
import { pool } from "../db";
import { authenticate, AuthRequest } from "../middlewares/auth.middleware";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { getEmailConfig, getMissingEmailConfig } from "../services/email/email.config";

const router = Router();
const permitted = new Set(["EMPLOYEE", "ADMIN", "SUPERADMIN"]);
const colorPattern = /^#[0-9a-fA-F]{6}$/;
const imagePattern = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const emailPattern = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const pngPattern = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/;

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const validEmail = (value: string) => value === "" || (value.length <= 254 && emailPattern.test(value));

router.use(authenticate);
router.use((req: AuthRequest, res: Response, next) => {
  if (!permitted.has(String(req.user?.role || "").toUpperCase())) {
    return res.status(403).json({ message: "Employee tools access required" });
  }
  next();
});

const selectBrands = `SELECT id, name, color, recipient_email, logo_mime, encode(logo_data, 'base64') AS logo_base64
  FROM employee_company_brands ORDER BY lower(name)`;
const serialize = (row: any) => ({
  id: row.id,
  name: row.name,
  color: row.color,
  recipientEmail: row.recipient_email || "",
  logoDataUrl: `data:${row.logo_mime};base64,${String(row.logo_base64).replace(/\s/g, "")}`,
});

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(selectBrands);
    return res.json({ companies: result.rows.map(serialize) });
  } catch (error) {
    console.error("Company library list failed", error);
    return res.status(500).json({ message: "Unable to load companies" });
  }
});

router.post("/", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const color = String(req.body?.color || "").trim();
  const recipientEmail = normalizeEmail(req.body?.recipientEmail);
  const logoDataUrl = String(req.body?.logoDataUrl || "");
  const image = imagePattern.exec(logoDataUrl);
  if (name.length < 2 || name.length > 100 || !colorPattern.test(color) || !image || !validEmail(recipientEmail)) {
    return res.status(400).json({ message: "Provide a name, color, and PNG, JPG, or WebP logo" });
  }
  const logo = Buffer.from(image[2], "base64");
  if (!logo.length || logo.length > 1024 * 1024) {
    return res.status(400).json({ message: "Logo must be under 1 MB" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO employee_company_brands (name, color, recipient_email, logo_mime, logo_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, color, recipient_email, logo_mime, encode(logo_data, 'base64') AS logo_base64`,
      [name, color, recipientEmail || null, image[1], logo]
    );
    return res.status(201).json({ company: serialize(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ message: "Company already exists" });
    console.error("Company library save failed", error);
    return res.status(500).json({ message: "Unable to save company" });
  }
});

router.patch("/:id", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const color = String(req.body?.color || "").trim();
  const recipientEmail = normalizeEmail(req.body?.recipientEmail);
  if (name.length < 2 || name.length > 100 || !colorPattern.test(color) || !validEmail(recipientEmail)) {
    return res.status(400).json({ message: "Provide a valid name, color, and recipient email" });
  }
  try {
    const result = await pool.query(
      `UPDATE employee_company_brands SET name=$2, color=$3, recipient_email=$4, updated_at=now()
       WHERE id=$1 RETURNING id, name, color, recipient_email, logo_mime, encode(logo_data, 'base64') AS logo_base64`,
      [req.params.id, name, color, recipientEmail || null]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Company not found" });
    return res.json({ company: serialize(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ message: "Company already exists" });
    console.error("Company library update failed", error);
    return res.status(500).json({ message: "Unable to update company" });
  }
});

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many report emails. Please try again shortly." },
});

router.post("/:id/send-report", sendLimiter, async (req, res) => {
  const reportDate = String(req.body?.date || "");
  const match = pngPattern.exec(String(req.body?.pngDataUrl || ""));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !match) {
    return res.status(400).json({ message: "Provide a report date and PNG image" });
  }
  const png = Buffer.from(match[1], "base64");
  if (!png.length || png.length > 1400000 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return res.status(400).json({ message: "Report PNG is invalid or too large" });
  }
  const config = getEmailConfig();
  if (!config.enabled || getMissingEmailConfig(config).length) {
    return res.status(503).json({ message: "Gmail sending is not configured" });
  }
  try {
    const result = await pool.query(
      "SELECT name, recipient_email FROM employee_company_brands WHERE id = $1",
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Company not found" });
    const company = result.rows[0];
    if (!company.recipient_email || !validEmail(company.recipient_email)) {
      return res.status(400).json({ message: "Save a valid client email for this company first" });
    }
    const transport = nodemailer.createTransport(
      config.provider === "gmail"
        ? { service: "gmail", auth: { user: config.user, pass: config.password } }
        : { host: config.host, port: config.port, secure: config.secure, auth: { user: config.user, pass: config.password } }
    );
    const info = await transport.sendMail({
      from: { name: config.fromName, address: config.fromAddress },
      to: company.recipient_email,
      subject: `FII/DII activity report - ${reportDate}`,
      text: `Please find attached the FII/DII activity report for ${reportDate}.`,
      attachments: [{ filename: `FII_DII_${reportDate}.png`, content: png, contentType: "image/png" }],
    });
    if (!info.accepted?.some(address =>
      (typeof address === "string" ? address : address.address).toLowerCase() === company.recipient_email
    )) {
      return res.status(502).json({ message: "Gmail did not accept this recipient" });
    }
    return res.json({ message: "Gmail accepted the report", recipientEmail: company.recipient_email });
  } catch (error) {
    console.error("FII/DII email send failed", error);
    return res.status(502).json({ message: "Could not send the report through Gmail" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM employee_company_brands WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Company not found" });
    return res.status(204).send();
  } catch (error) {
    console.error("Company library delete failed", error);
    return res.status(500).json({ message: "Unable to delete company" });
  }
});

export default router;
