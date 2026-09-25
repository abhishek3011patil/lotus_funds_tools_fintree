import crypto from "crypto";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";
import { hashBrokerInvitation } from "../services/brokerOnboarding.service";
import { emailService } from "../services/email";

export const requireBroker = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "BROKER") return res.status(403).json({ message: "Broker access required." });
  try {
    const result = await pool.query(
      `SELECT b.id, b.legal_name FROM broker_details b
       JOIN users u ON u.id = b.user_id
       WHERE b.user_id = $1 AND u.is_active = true`, [req.user.id]
    );
    if (!result.rows[0]) return res.status(403).json({ message: "An active broker account is required." });
    res.locals.broker = result.rows[0];
    next();
  } catch (error) { next(error); }
};

const analystColumns = `ra.id, concat_ws(' ', ra.first_name, ra.surname) AS name,
  ra.sebi_reg_no AS "sebiRegistration", ra.expertise AS category,
  ra.sebi_expiry_date AS "registrationExpiry",
  CASE WHEN lower(ra.status) = 'approved' AND u.is_active = true THEN 'ACTIVE'
       WHEN lower(ra.status) = 'rejected' THEN 'REJECTED'
       WHEN ra.user_id IS NOT NULL THEN 'INACTIVE' ELSE 'PENDING' END AS status`;

export const listBrokerAnalysts = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ${analystColumns}, link.onboarding_method AS "onboardingMethod", link.created_at AS "joinedAt"
     FROM broker_research_analysts link JOIN ra_details ra ON ra.id = link.ra_id
     LEFT JOIN users u ON u.id = ra.user_id
     WHERE link.broker_id = $1 AND link.status = 'ACTIVE' ORDER BY link.created_at DESC`,
    [res.locals.broker.id]
  );
  res.json(result.rows);
};

export const searchExistingAnalysts = async (req: AuthRequest, res: Response) => {
  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search.length < 2) return res.json([]);
  const result = await pool.query(
    `SELECT ${analystColumns} FROM ra_details ra JOIN users u ON u.id = ra.user_id
     WHERE lower(ra.status) = 'approved' AND u.is_active = true
       AND (concat_ws(' ', ra.first_name, ra.surname) ILIKE $2 OR ra.sebi_reg_no ILIKE $2)
       AND NOT EXISTS (SELECT 1 FROM broker_research_analysts link
         WHERE link.broker_id = $1 AND link.ra_id = ra.id AND link.status = 'ACTIVE')
     ORDER BY ra.first_name, ra.surname LIMIT 25`, [res.locals.broker.id, `%${search}%`]
  );
  res.json(result.rows);
};

export const addExistingAnalyst = async (req: AuthRequest, res: Response) => {
  const raId = String(req.body.raId || "");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raId)) return res.status(400).json({ message: "Select a valid Research Analyst." });
  const result = await pool.query(
    `INSERT INTO broker_research_analysts (broker_id, ra_id, onboarding_method)
     SELECT $1, ra.id, 'EXISTING' FROM ra_details ra JOIN users u ON u.id = ra.user_id
     WHERE ra.id = $2 AND lower(ra.status) = 'approved' AND u.is_active = true
     ON CONFLICT (broker_id, ra_id) DO UPDATE SET status = 'ACTIVE', updated_at = now()
     RETURNING ra_id`, [res.locals.broker.id, raId]
  );
  if (!result.rows.length) return res.status(404).json({ message: "An active, approved Research Analyst was not found." });
  res.status(201).json({ message: "Research Analyst added." });
};

export const removeBrokerAnalyst = async (req: AuthRequest, res: Response) => {
  const raId = String(req.params.raId || "");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raId)) {
    return res.status(400).json({ message: "Select a valid Research Analyst." });
  }
  const result = await pool.query(
    `UPDATE broker_research_analysts SET status = 'INACTIVE', updated_at = now()
     WHERE broker_id = $1 AND ra_id = $2 RETURNING ra_id`,
    [res.locals.broker.id, raId]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Research Analyst association was not found." });
  return res.status(204).send();
};

export const createBrokerInvitation = async (req: AuthRequest, res: Response) => {
  const method = req.body.method;
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!["DIRECT", "LINK"].includes(method) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return res.status(400).json({ message: "Provide a valid onboarding method and email address." });
  }
  if (req.body.sendEmail && !email) return res.status(400).json({ message: "An email address is required to send the link." });
  const token = crypto.randomBytes(32).toString("hex");
  const registrationPath = `/registration?brokerInvite=${token}`;
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
  if (req.body.sendEmail && !frontendUrl) return res.status(503).json({ message: "Registration email URL is not configured. You can still generate a link." });
  const result = await pool.query(
    `INSERT INTO broker_ra_invitations (broker_id, token_hash, email, onboarding_method, expires_at)
     VALUES ($1, $2, $3, $4, now() + interval '7 days') RETURNING expires_at`,
    [res.locals.broker.id, hashBrokerInvitation(token), email || null, method]
  );
  let emailSent = false;
  if (req.body.sendEmail) {
    try {
      const delivery = await emailService.send("BROKER_RA_INVITATION", email, {
        brokerName: res.locals.broker.legal_name, registrationUrl: `${frontendUrl}${registrationPath}`,
      });
      emailSent = delivery.sent;
    } catch { /* The generated link remains available when email delivery fails. */ }
  }
  res.status(201).json({ registrationPath, expiresAt: result.rows[0].expires_at, emailSent });
};

export const getBrokerInvitation = async (req: AuthRequest, res: Response) => {
  const token = String(req.params.token || "");
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message: "Invalid registration link." });
  const result = await pool.query(
    `SELECT b.legal_name AS "brokerName", i.email, i.expires_at AS "expiresAt"
     FROM broker_ra_invitations i JOIN broker_details b ON b.id = i.broker_id
     WHERE i.token_hash = $1 AND i.used_at IS NULL AND i.expires_at > now()`, [hashBrokerInvitation(token)]
  );
  if (!result.rows[0]) return res.status(410).json({ message: "This registration link has expired or has already been used. Request a new link from your broker." });
  res.json(result.rows[0]);
};

export const listBrokerCalls = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT rc.id, rc.created_at AS date_time, rc.action, rc.exchange_type AS exchange,
       rc.call_type AS type, rc.trade_type AS category, rc.display_name AS instrument,
       rc.symbol, rc.expiry_date AS expiry, coalesce(rc.entry_price, rc.entry_price_low, rc.entry_price_upper) AS entry,
       rc.exit_price, rc.status, rc.version_type, rc.attachments, rc.file_url,
       concat_ws(' ', ra.first_name, ra.surname) AS researcher_name,
       CASE WHEN rc.exit_price IS NULL THEN 0
         WHEN upper(rc.action) = 'SELL' THEN coalesce(rc.entry_price, rc.entry_price_low, rc.entry_price_upper) - rc.exit_price
         ELSE rc.exit_price - coalesce(rc.entry_price, rc.entry_price_low, rc.entry_price_upper) END AS profit_loss
     FROM broker_research_analysts link
     JOIN ra_details ra ON ra.id = link.ra_id
     JOIN research_calls rc ON rc.ra_user_id = ra.user_id
     WHERE link.broker_id = $1 AND link.status = 'ACTIVE'
       AND rc.status IN ('PUBLISHED', 'CLOSED') AND rc.is_latest IS TRUE
     ORDER BY rc.created_at DESC, rc.id`, [res.locals.broker.id]
  );
  res.json(result.rows);
};
