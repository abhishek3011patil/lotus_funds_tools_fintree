import crypto from "crypto";
import type { Response } from "express";
import { Api } from "telegram";
import bigInt from "big-integer";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createClient } from "../utils/telegramClientFactory";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const normalizePhone = (value: unknown) => String(value || "").replace(/\D/g, "");
const kycHash = (value: string) => crypto.createHmac("sha256", process.env.KYC_HASH_PEPPER || process.env.JWT_SECRET || "tarkashh").update(value).digest("hex");
const mask = (last4: unknown, prefix: string) => last4 ? `${prefix}${last4}` : null;

const syncPortalClients = async (brokerId: string) => {
  await pool.query(
    `INSERT INTO broker_clients (broker_id, client_user_id, source, name, email, phone_number, aadhaar_last4, status)
     SELECT subscription.broker_id, client.id, 'PORTAL', COALESCE(client.name, 'Client'), client.email,
            COALESCE(profile.phone_number, ''), RIGHT(COALESCE(profile.aadhaar_number, ''), 4),
            CASE WHEN subscription.status = 'ACTIVE' AND subscription.expires_at > NOW()
              THEN 'ACTIVE' ELSE 'INACTIVE' END
     FROM client_broker_subscriptions subscription
     JOIN users client ON client.id = subscription.client_user_id AND client.role = 'CLIENT'
     LEFT JOIN client_profiles profile ON profile.user_id = client.id
     WHERE subscription.broker_id = $1 AND subscription.subscribed_at IS NOT NULL
     ON CONFLICT (broker_id, client_user_id) DO UPDATE SET
       name = EXCLUDED.name, email = EXCLUDED.email,
       phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE broker_clients.phone_number END,
       aadhaar_last4 = COALESCE(NULLIF(EXCLUDED.aadhaar_last4, ''), broker_clients.aadhaar_last4),
       status = EXCLUDED.status, updated_at = NOW()`,
    [brokerId],
  );
};

export const listBrokerClients = async (req: AuthRequest, res: Response) => {
  const brokerId = res.locals.broker.id;
  await syncPortalClients(brokerId);
  const search = String(req.query.search || "").trim();
  const pattern = `%${search}%`;
  const result = await pool.query(
    `SELECT client.id, client.client_user_id AS "clientUserId", client.source, client.name, client.email,
            client.phone_number AS "phoneNumber", client.status, client.created_at AS "createdAt",
            client.updated_at AS "updatedAt",
            client.aadhaar_last4 AS "aadhaarLast4", client.pan_last4 AS "panLast4",
            EXISTS (SELECT 1 FROM whatsapp_participants participant
                    WHERE participant.ra_user_id = $1 AND participant.broker_client_id = client.id
                      AND participant.is_active = TRUE AND participant.consent_confirmed = TRUE) AS "whatsappAdded",
            EXISTS (SELECT 1 FROM telegram_users participant
                    WHERE participant.user_id = $1 AND participant.broker_client_id = client.id
                      AND participant.is_active = TRUE) AS "telegramAdded",
            (SELECT COUNT(DISTINCT delivery.root_call_id)::int FROM broker_call_deliveries delivery
             WHERE delivery.broker_client_id = client.id AND delivery.status = 'SENT') AS "receivedCallCount",
            (SELECT MAX(delivery.sent_at) FROM broker_call_deliveries delivery
             WHERE delivery.broker_client_id = client.id AND delivery.status = 'SENT') AS "lastDeliveryAt"
     FROM broker_clients client
     WHERE client.broker_id = $2
       AND ($3 = '' OR client.name ILIKE $4 OR COALESCE(client.email, '') ILIKE $4 OR client.phone_number ILIKE $4)
     ORDER BY client.created_at DESC`,
    [req.user!.id, brokerId, search, pattern],
  );
  return res.json({
    success: true,
    clients: result.rows.map(row => ({
      ...row,
      aadhaarMasked: mask(row.aadhaarLast4, "XXXXXXXX"),
      panMasked: mask(row.panLast4, "XXXXXX"),
      aadhaarLast4: undefined,
      panLast4: undefined,
    })),
  });
};

export const createBrokerClient = async (req: AuthRequest, res: Response) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = normalizePhone(req.body?.phoneNumber);
  const aadhaar = normalizePhone(req.body?.aadhaarNumber);
  const pan = String(req.body?.panNumber || "").trim().toUpperCase();
  if (!name || phone.length < 10 || phone.length > 15) return res.status(400).json({ message: "Enter a client name and valid phone number with country code." });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (!/^\d{12}$/.test(aadhaar)) return res.status(400).json({ message: "Enter a valid 12-digit Aadhaar number." });
  if (!PAN_PATTERN.test(pan)) return res.status(400).json({ message: "Enter a valid PAN number." });
  try {
    const result = await pool.query(
      `INSERT INTO broker_clients
         (broker_id, source, name, email, phone_number, aadhaar_last4, aadhaar_hash, pan_last4, pan_hash)
       VALUES ($1, 'MANUAL', $2, NULLIF($3, ''), $4, RIGHT($5, 4), $6, RIGHT($7, 4), $8)
       RETURNING id`,
      [res.locals.broker.id, name, email, phone, aadhaar, kycHash(aadhaar), pan, kycHash(pan)],
    );
    return res.status(201).json({ success: true, id: result.rows[0].id, message: "Client added." });
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ message: "This client is already in your directory." });
    throw error;
  }
};

const getOwnedClient = async (brokerId: string, clientId: string) => {
  if (!UUID_PATTERN.test(clientId)) return null;
  const result = await pool.query(`SELECT * FROM broker_clients WHERE id = $1 AND broker_id = $2 AND status = 'ACTIVE'`, [clientId, brokerId]);
  return result.rows[0] || null;
};

export const addBrokerClientToWhatsApp = async (req: AuthRequest, res: Response) => {
  const client = await getOwnedClient(res.locals.broker.id, String(req.params.clientId || ""));
  if (!client) return res.status(404).json({ message: "Client not found." });
  if (req.body?.consentConfirmed !== true) return res.status(400).json({ message: "Confirm the client's WhatsApp consent before adding them." });
  const phone = normalizePhone(req.body?.phoneNumber || client.phone_number);
  if (phone.length < 10 || phone.length > 15) return res.status(400).json({ message: "Enter a valid WhatsApp number with country code." });
  const existing = await pool.query(`SELECT id FROM whatsapp_participants WHERE ra_user_id = $1 AND phone_number = $2 LIMIT 1`, [req.user!.id, phone]);
  if (existing.rows[0]) {
    await pool.query(
      `UPDATE whatsapp_participants SET participant_name = $1, broker_client_id = $2,
         client_user_id = $3, consent_confirmed = TRUE, consent_source = 'BROKER_CLIENT_LINK',
         consent_confirmed_at = NOW(), is_active = TRUE, updated_at = NOW() WHERE id = $4`,
      [client.name, client.id, client.client_user_id, existing.rows[0].id],
    );
  } else {
    await pool.query(
      `INSERT INTO whatsapp_participants
         (ra_user_id, participant_name, phone_number, consent_confirmed, consent_source,
          consent_confirmed_at, is_active, created_by, client_user_id, broker_client_id)
       VALUES ($1, $2, $3, TRUE, 'BROKER_CLIENT_LINK', NOW(), TRUE, $1, $4, $5)`,
      [req.user!.id, client.name, phone, client.client_user_id, client.id],
    );
  }
  await pool.query(`UPDATE broker_clients SET phone_number = $1, updated_at = NOW() WHERE id = $2`, [phone, client.id]);
  return res.json({ success: true, message: "Client added to WhatsApp." });
};

export const removeBrokerClientFromWhatsApp = async (req: AuthRequest, res: Response) => {
  const client = await getOwnedClient(res.locals.broker.id, String(req.params.clientId || ""));
  if (!client) return res.status(404).json({ message: "Client not found." });
  await pool.query(`DELETE FROM whatsapp_participants WHERE ra_user_id = $1 AND broker_client_id = $2`, [req.user!.id, client.id]);
  return res.json({ success: true, message: "Client removed from WhatsApp." });
};

export const addBrokerClientToTelegram = async (req: AuthRequest, res: Response) => {
  const client = await getOwnedClient(res.locals.broker.id, String(req.params.clientId || ""));
  if (!client) return res.status(404).json({ message: "Client not found." });
  if (req.body?.consentConfirmed !== true) return res.status(400).json({ message: "Confirm the client's Telegram consent before adding them." });
  const digits = normalizePhone(req.body?.phoneNumber || client.phone_number);
  if (digits.length < 10 || digits.length > 15) return res.status(400).json({ message: "Enter a valid Telegram phone number with country code." });
  const phone = `+${digits}`;
  const sessionResult = await pool.query(`SELECT telegram_session FROM users WHERE id = $1`, [req.user!.id]);
  const session = sessionResult.rows[0]?.telegram_session;
  if (!session) return res.status(400).json({ message: "Connect the broker Telegram account before adding clients." });
  const telegram = await createClient(session);
  try {
    const imported = await telegram.invoke(new Api.contacts.ImportContacts({
      contacts: [new Api.InputPhoneContact({ clientId: bigInt(Date.now()), phone, firstName: client.name, lastName: "" })],
    }));
    const entity: any = imported.users?.[0];
    if (!entity?.id) return res.status(404).json({ message: "No Telegram user was found with this phone number." });
    const telegramId = entity.id.toString();
    const telegramName = entity.username ? `@${entity.username}` : [entity.firstName, entity.lastName].filter(Boolean).join(" ") || phone;
    const existing = await pool.query(`SELECT id FROM telegram_users WHERE telegram_user_id = $1 AND user_id = $2 LIMIT 1`, [telegramId, req.user!.id]);
    if (existing.rows[0]) {
      await pool.query(
        `UPDATE telegram_users SET telegram_client_name = $1, phone_number = $2, entity_type = 'USER',
          is_active = TRUE, client_user_id = $3, broker_client_id = $4 WHERE id = $5`,
        [telegramName, phone, client.client_user_id, client.id, existing.rows[0].id],
      );
    } else {
      await pool.query(
        `INSERT INTO telegram_users
          (telegram_user_id, telegram_client_name, phone_number, user_id, entity_type, is_active, client_user_id, broker_client_id)
         VALUES ($1, $2, $3, $4, 'USER', TRUE, $5, $6)`,
        [telegramId, telegramName, phone, req.user!.id, client.client_user_id, client.id],
      );
    }
    await pool.query(`UPDATE broker_clients SET phone_number = $1, updated_at = NOW() WHERE id = $2`, [digits, client.id]);
    return res.json({ success: true, message: "Client added to Telegram." });
  } finally {
    await telegram.disconnect();
  }
};

export const removeBrokerClientFromTelegram = async (req: AuthRequest, res: Response) => {
  const client = await getOwnedClient(res.locals.broker.id, String(req.params.clientId || ""));
  if (!client) return res.status(404).json({ message: "Client not found." });
  await pool.query(`DELETE FROM telegram_users WHERE user_id = $1 AND broker_client_id = $2`, [req.user!.id, client.id]);
  return res.json({ success: true, message: "Client removed from Telegram." });
};

export const listBrokerClientDeliveries = async (req: AuthRequest, res: Response) => {
  const client = await getOwnedClient(res.locals.broker.id, String(req.params.clientId || ""));
  if (!client) return res.status(404).json({ message: "Client not found." });
  const result = await pool.query(
    `SELECT delivery.id, delivery.event_type AS "eventType", delivery.channel, delivery.status,
            delivery.queued_at AS "queuedAt", delivery.sent_at AS "sentAt",
            delivery.error_message AS "errorMessage", call.symbol, call.display_name AS "instrument",
            analyst.name AS "researchAnalyst"
     FROM broker_call_deliveries delivery
     JOIN research_calls call ON call.id = delivery.research_call_id
     JOIN users analyst ON analyst.id = call.ra_user_id
     WHERE delivery.broker_id = $1 AND delivery.broker_client_id = $2
     ORDER BY delivery.queued_at DESC LIMIT 100`,
    [res.locals.broker.id, client.id],
  );
  return res.json({ success: true, deliveries: result.rows });
};
