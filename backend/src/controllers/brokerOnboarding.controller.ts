import crypto from "crypto";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";
import { hashBrokerInvitation } from "../services/brokerOnboarding.service";
import { emailService } from "../services/email";
import { deliverBrokerPublication } from "../services/brokerDelivery.service";

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
  ra.sebi_expiry_date AS "registrationExpiry"`;

const analystAccountStatus = `CASE WHEN lower(ra.status) = 'approved' AND u.is_active = true THEN 'ACTIVE'
       WHEN lower(ra.status) = 'rejected' THEN 'REJECTED'
       WHEN ra.user_id IS NOT NULL THEN 'INACTIVE' ELSE 'PENDING' END`;

export const listBrokerAnalysts = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ${analystColumns},
       CASE WHEN link.status = 'PENDING' THEN 'PENDING' ELSE (${analystAccountStatus}) END AS status,
       link.onboarding_method AS "onboardingMethod", link.created_at AS "joinedAt"
     FROM broker_research_analysts link JOIN ra_details ra ON ra.id = link.ra_id
     LEFT JOIN users u ON u.id = ra.user_id
     WHERE link.broker_id = $1 AND link.status IN ('ACTIVE', 'PENDING') ORDER BY link.created_at DESC`,
    [res.locals.broker.id]
  );
  res.json(result.rows);
};

export const searchExistingAnalysts = async (req: AuthRequest, res: Response) => {
  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search.length === 1) return res.json([]);
  const result = await pool.query(
    `SELECT ${analystColumns}, ${analystAccountStatus} AS status FROM ra_details ra JOIN users u ON u.id = ra.user_id
     WHERE lower(ra.status) = 'approved' AND u.is_active = true
       AND ($2 = '' OR concat_ws(' ', ra.first_name, ra.surname) ILIKE $3 OR ra.sebi_reg_no ILIKE $3)
       AND NOT EXISTS (SELECT 1 FROM broker_research_analysts link
         WHERE link.broker_id = $1 AND link.ra_id = ra.id AND link.status IN ('ACTIVE', 'PENDING'))
     ORDER BY ra.first_name, ra.surname
     LIMIT CASE WHEN $2 = '' THEN 8 ELSE 25 END`,
    [res.locals.broker.id, search, `%${search}%`]
  );
  res.json(result.rows);
};

export const addExistingAnalyst = async (req: AuthRequest, res: Response) => {
  const raId = String(req.body.raId || "");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raId)) return res.status(400).json({ message: "Select a valid Research Analyst." });
  const result = await pool.query(
    `WITH eligible AS (
       SELECT ra.id, ra.user_id, u.email, concat_ws(' ', ra.first_name, ra.surname) AS name
       FROM ra_details ra JOIN users u ON u.id = ra.user_id
       WHERE ra.id = $2 AND lower(ra.status) = 'approved' AND u.is_active = true
     ), requested AS (
       INSERT INTO broker_research_analysts (broker_id, ra_id, onboarding_method, status)
       SELECT $1, id, 'EXISTING', 'PENDING' FROM eligible
       ON CONFLICT (broker_id, ra_id) DO UPDATE
         SET status = 'PENDING', onboarding_method = 'EXISTING', updated_at = now()
         WHERE broker_research_analysts.status IN ('INACTIVE', 'REJECTED')
       RETURNING ra_id
     ), notified AS (
       INSERT INTO subscription_notifications (
         user_id, subscription_id, client_ra_subscription_id,
         notification_key, type, title, message
       )
       SELECT eligible.user_id, NULL, NULL,
         CONCAT('BROKER_RA_CONNECTION_REQUEST:', $1::text, ':', $2::text, ':', EXTRACT(EPOCH FROM NOW())::text),
         'Broker Connection Request',
         'New broker connection request',
         CONCAT($3::text, ' wants to add you as a Research Analyst. Review the request from Clients > Brokers.')
       FROM eligible JOIN requested ON requested.ra_id = eligible.id
       ON CONFLICT DO NOTHING
       RETURNING id
     )
     SELECT eligible.email, eligible.name FROM eligible
     JOIN requested ON requested.ra_id = eligible.id`,
    [res.locals.broker.id, raId, res.locals.broker.legal_name]
  );
  if (!result.rows.length) {
    return res.status(409).json({ message: "This Research Analyst already has an active or pending connection with your brokerage." });
  }

  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
  let emailSent = false;
  if (frontendUrl && result.rows[0].email) {
    try {
      const delivery = await emailService.send("BROKER_RA_CONNECTION_REQUEST", result.rows[0].email, {
        raName: result.rows[0].name,
        brokerName: res.locals.broker.legal_name,
        requestsUrl: `${frontendUrl}/ra/clients#brokers`,
      });
      emailSent = delivery.sent;
    } catch { /* The in-app request remains available when email delivery fails. */ }
  }

  return res.status(201).json({ message: "Connection request sent to the Research Analyst.", emailSent });
};

export const listRAConnectionRequests = async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT b.id AS "brokerId", b.legal_name AS "brokerName",
       link.created_at AS "requestedAt", link.status
     FROM broker_research_analysts link
     JOIN ra_details ra ON ra.id = link.ra_id
     JOIN broker_details b ON b.id = link.broker_id
     WHERE ra.user_id = $1 AND link.status = 'PENDING'
     ORDER BY link.updated_at DESC`,
    [req.user!.id]
  );
  return res.json(result.rows);
};

export const listRAConnectedBrokers = async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT b.id AS "brokerId", b.legal_name AS "brokerName",
       link.updated_at AS "connectedAt", link.status
     FROM broker_research_analysts link
     JOIN ra_details ra ON ra.id = link.ra_id
     JOIN broker_details b ON b.id = link.broker_id
     WHERE ra.user_id = $1 AND link.status = 'ACTIVE'
     ORDER BY link.updated_at DESC`,
    [req.user!.id]
  );
  return res.json(result.rows);
};

export const removeRAConnectedBroker = async (req: AuthRequest, res: Response) => {
  const brokerId = String(req.params.brokerId || "");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(brokerId)) {
    return res.status(400).json({ message: "Select a valid broker connection." });
  }
  const result = await pool.query(
    `UPDATE broker_research_analysts link SET status = 'INACTIVE', updated_at = now()
     FROM ra_details ra
     WHERE link.broker_id = $2 AND link.ra_id = ra.id
       AND ra.user_id = $1 AND link.status = 'ACTIVE'
     RETURNING link.broker_id`,
    [req.user!.id, brokerId]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Connected broker was not found." });
  return res.status(204).send();
};

export const respondToRAConnectionRequest = async (req: AuthRequest, res: Response) => {
  const brokerId = String(req.params.brokerId || "");
  const action = String(req.body.action || "").toUpperCase();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(brokerId)) {
    return res.status(400).json({ message: "Select a valid broker request." });
  }
  if (!["ACCEPT", "DECLINE"].includes(action)) {
    return res.status(400).json({ message: "Choose whether to accept or decline the request." });
  }

  const nextStatus = action === "ACCEPT" ? "ACTIVE" : "REJECTED";
  const result = await pool.query(
    `UPDATE broker_research_analysts link SET status = $3, updated_at = now()
     FROM ra_details ra
     WHERE link.broker_id = $2 AND link.ra_id = ra.id
       AND ra.user_id = $1 AND link.status = 'PENDING'
     RETURNING link.broker_id`,
    [req.user!.id, brokerId, nextStatus]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Pending broker request was not found." });
  return res.json({ message: action === "ACCEPT" ? "Broker request accepted." : "Broker request declined." });
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
       rc.published_message_text, COALESCE(rc.parent_call_id, rc.id) AS root_call_id,
       COALESCE(NULLIF(TRIM(b.trade_name), ''), b.legal_name) AS broker_name,
       b.sebi_registration_no AS broker_sebi_registration,
       (publication.id IS NOT NULL AND publication.status = 'ACTIVE') AS broker_published,
       concat_ws(' ', ra.first_name, ra.surname) AS researcher_name,
       CASE WHEN rc.exit_price IS NULL THEN 0
         WHEN upper(rc.action) = 'SELL' THEN coalesce(rc.entry_price, rc.entry_price_low, rc.entry_price_upper) - rc.exit_price
         ELSE rc.exit_price - coalesce(rc.entry_price, rc.entry_price_low, rc.entry_price_upper) END AS profit_loss
     FROM broker_research_analysts link
     JOIN broker_details b ON b.id = link.broker_id
     JOIN ra_details ra ON ra.id = link.ra_id
     JOIN research_calls rc ON rc.ra_user_id = ra.user_id
     LEFT JOIN broker_call_publications publication
       ON publication.broker_id = link.broker_id
      AND publication.root_call_id = COALESCE(rc.parent_call_id, rc.id)
     WHERE link.broker_id = $1 AND link.status = 'ACTIVE'
       AND rc.status IN ('PUBLISHED', 'CLOSED') AND rc.is_latest IS TRUE
       AND (
         COALESCE(rc.audience_mode, 'ALL_CONNECTED') = 'ALL_CONNECTED'
         OR rc.audience_recipient_snapshot @> jsonb_build_array(
           jsonb_build_object('type', 'BROKER', 'id', link.broker_id::text)
         )
       )
     ORDER BY rc.created_at DESC, rc.id`, [res.locals.broker.id]
  );
  res.json(result.rows);
};

export const publishBrokerCall = async (req: AuthRequest, res: Response) => {
  const callId = String(req.params.callId || "");
  const message = String(req.body?.message || "").trim();
  if (!/^[a-f0-9-]{36}$/i.test(callId)) return res.status(400).json({ message: "Select a valid research call." });
  if (!message || message.length > 12000) return res.status(400).json({ message: "Review the call message before publishing." });

  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await db.query(
      `SELECT rc.id, COALESCE(rc.parent_call_id, rc.id) AS root_call_id
       FROM research_calls rc
       JOIN ra_details ra ON ra.user_id = rc.ra_user_id
       JOIN broker_research_analysts link ON link.ra_id = ra.id
       WHERE rc.id = $1 AND rc.is_latest = TRUE AND rc.status = 'PUBLISHED'
         AND link.broker_id = $2 AND link.status = 'ACTIVE'
         AND (
           COALESCE(rc.audience_mode, 'ALL_CONNECTED') = 'ALL_CONNECTED'
           OR rc.audience_recipient_snapshot @> jsonb_build_array(
             jsonb_build_object('type', 'BROKER', 'id', link.broker_id::text)
           )
         )
       FOR UPDATE OF rc`,
      [callId, res.locals.broker.id],
    );
    if (!result.rows[0]) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "This associated Research Analyst call is no longer available." });
    }
    const call = result.rows[0];
    const publication = await db.query(
      `INSERT INTO broker_call_publications (broker_id, research_call_id, root_call_id, message_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (broker_id, root_call_id) DO NOTHING
       RETURNING id`,
      [res.locals.broker.id, call.id, call.root_call_id, message],
    );
    if (!publication.rows[0]) {
      await db.query("ROLLBACK");
      return res.status(409).json({ message: "This call has already been published by your brokerage." });
    }
    const delivery = await deliverBrokerPublication({
      brokerId: res.locals.broker.id,
      brokerUserId: req.user!.id,
      researchCallId: call.id,
      rootCallId: call.root_call_id,
      eventType: "RESEARCH_CALL_PUBLISHED",
      message,
      client: db,
    });
    await db.query("COMMIT");
    return res.status(201).json({
      success: true,
      message: "Call published to the broker's enabled client channels.",
      publicationId: publication.rows[0].id,
      delivery: { whatsappQueued: delivery.whatsappQueued, telegramQueued: delivery.telegramQueued },
    });
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    console.error("BROKER CALL PUBLISH ERROR", error);
    return res.status(500).json({ message: "Unable to publish this call." });
  } finally {
    db.release();
  }
};
