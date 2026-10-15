import { Router, Response } from "express";
import { pool } from "../db";
import { authenticate, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();
const permitted = new Set(["EMPLOYEE", "ADMIN", "SUPERADMIN"]);
const colorPattern = /^#[0-9a-fA-F]{6}$/;
const imagePattern = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

router.use(authenticate);
router.use((req: AuthRequest, res: Response, next) => {
  if (!permitted.has(String(req.user?.role || "").toUpperCase())) {
    return res.status(403).json({ message: "Employee tools access required" });
  }
  next();
});

const selectBrands = `SELECT id, name, color, logo_mime, encode(logo_data, 'base64') AS logo_base64
  FROM employee_company_brands ORDER BY lower(name)`;
const serialize = (row: any) => ({
  id: row.id,
  name: row.name,
  color: row.color,
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
  const logoDataUrl = String(req.body?.logoDataUrl || "");
  const image = imagePattern.exec(logoDataUrl);
  if (name.length < 2 || name.length > 100 || !colorPattern.test(color) || !image) {
    return res.status(400).json({ message: "Provide a name, color, and PNG, JPG, or WebP logo" });
  }
  const logo = Buffer.from(image[2], "base64");
  if (!logo.length || logo.length > 1024 * 1024) {
    return res.status(400).json({ message: "Logo must be under 1 MB" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO employee_company_brands (name, color, logo_mime, logo_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, color, logo_mime, encode(logo_data, 'base64') AS logo_base64`,
      [name, color, image[1], logo]
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
  if (name.length < 2 || name.length > 100 || !colorPattern.test(color)) {
    return res.status(400).json({ message: "Provide a valid name and color" });
  }
  try {
    const result = await pool.query(
      `UPDATE employee_company_brands SET name=$2, color=$3, updated_at=now()
       WHERE id=$1 RETURNING id, name, color, logo_mime, encode(logo_data, 'base64') AS logo_base64`,
      [req.params.id, name, color]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Company not found" });
    return res.json({ company: serialize(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ message: "Company already exists" });
    console.error("Company library update failed", error);
    return res.status(500).json({ message: "Unable to update company" });
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
