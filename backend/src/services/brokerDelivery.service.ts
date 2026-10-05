import { pool } from "../db";
import type { PoolClient } from "pg";
import { createClient } from "../utils/telegramClientFactory";
import { queueWhatsAppResearchCall } from "./deliveryQueue.service";
import { loadResearchCallMedia, sendTelegramMessageWithMedia } from "./researchCallMedia.service";

type BrokerDeliveryEvent =
  | "RESEARCH_CALL_PUBLISHED"
  | "RESEARCH_CALL_ERRATA"
  | "RESEARCH_CALL_EXITED";

const addBrokerAttribution = (message: string, broker: { name: string; sebi: string | null }) =>
  [
    message.trim(),
    "",
    `Distributed by: ${broker.name}`,
    broker.sebi ? `Broker SEBI Registration No: ${broker.sebi}` : "",
  ].filter(Boolean).join("\n");

export const sendTelegramToOwnerParticipants = async (
  ownerUserId: string,
  message: string,
  tracking?: {
    brokerId: string;
    researchCallId: string;
    rootCallId: string;
    eventType: BrokerDeliveryEvent;
  },
  db: PoolClient | typeof pool = pool,
) => {
  const [ownerResult, participantsResult] = await Promise.all([
    db.query(`SELECT telegram_session FROM users WHERE id = $1`, [ownerUserId]),
    db.query(
      `SELECT telegram_user_id, telegram_client_name, entity_type, broker_client_id
       FROM telegram_users
       WHERE user_id = $1 AND is_active = TRUE`,
      [ownerUserId],
    ),
  ]);
  const session = ownerResult.rows[0]?.telegram_session;
  const participants = participantsResult.rows;
  if (!session || participants.length === 0) return { queued: 0 };
  const media = tracking ? await loadResearchCallMedia(tracking.researchCallId, db) : [];

  const trackedParticipants = await Promise.all(participants.map(async participant => {
    if (!tracking || !participant.broker_client_id) return { ...participant, deliveryId: null };
    const result = await db.query(
      `INSERT INTO broker_call_deliveries
         (broker_id, broker_client_id, research_call_id, root_call_id, event_type, channel, message_text, status)
       VALUES ($1, $2, $3, $4, $5, 'TELEGRAM', $6, 'QUEUED')
       ON CONFLICT (broker_client_id, research_call_id, event_type, channel) DO UPDATE SET
         message_text = EXCLUDED.message_text, status = 'QUEUED', error_message = NULL,
         queued_at = NOW(), sent_at = NULL, updated_at = NOW()
       RETURNING id`,
      [tracking.brokerId, participant.broker_client_id, tracking.researchCallId,
        tracking.rootCallId, tracking.eventType, message],
    );
    return { ...participant, deliveryId: result.rows[0]?.id || null };
  }));

  setImmediate(async () => {
    try {
      const telegram = await createClient(session);
      for (const participant of trackedParticipants) {
        try {
          const target = participant.entity_type === "GROUP" || participant.entity_type === "CHANNEL"
            ? participant.telegram_client_name
            : participant.telegram_user_id;
          const entity = await telegram.getEntity(target);
          const mediaFailures = await sendTelegramMessageWithMedia(telegram, entity, message, media);
          if (participant.deliveryId) {
            await pool.query(
              `UPDATE broker_call_deliveries SET status = $1, sent_at = NOW(),
                 error_message = $2, updated_at = NOW() WHERE id = $3`,
              [mediaFailures.length ? "FAILED" : "SENT",
                mediaFailures.length ? `Text sent; attachment delivery failed: ${JSON.stringify(mediaFailures)}` : null,
                participant.deliveryId],
            );
          }
          if (mediaFailures.length) {
            console.error("BROKER TELEGRAM MEDIA ERROR", { ownerUserId, participant: target, mediaFailures });
          }
        } catch (error) {
          console.error("BROKER TELEGRAM DELIVERY ERROR", {
            ownerUserId,
            participant: participant.telegram_client_name || participant.telegram_user_id,
            error,
          });
          if (participant.deliveryId) {
            await pool.query(
              `UPDATE broker_call_deliveries SET status = 'FAILED', error_message = $1,
                 updated_at = NOW() WHERE id = $2`,
              [error instanceof Error ? error.message : "Telegram delivery failed", participant.deliveryId],
            );
          }
        }
      }
      await telegram.disconnect();
    } catch (error) {
      console.error("BROKER TELEGRAM SESSION ERROR", { ownerUserId, error });
    }
  });

  return { queued: participants.length };
};

export const deliverBrokerPublication = async ({
  brokerId,
  brokerUserId,
  researchCallId,
  rootCallId,
  eventType,
  message,
  client,
}: {
  brokerId: string;
  brokerUserId: string;
  researchCallId: string;
  rootCallId: string;
  eventType: BrokerDeliveryEvent;
  message: string;
  client?: PoolClient;
}) => {
  const db = client ?? pool;
  const brokerResult = await db.query(
    `SELECT COALESCE(NULLIF(TRIM(trade_name), ''), legal_name) AS name,
            sebi_registration_no AS sebi
     FROM broker_details WHERE id = $1`,
    [brokerId],
  );
  const broker = brokerResult.rows[0];
  if (!broker) throw new Error("Broker profile was not found.");
  const attributedMessage = addBrokerAttribution(message, broker);

  const whatsapp = await queueWhatsAppResearchCall({
    researchCallId,
    originalCallId: rootCallId,
    raUserId: brokerUserId,
    eventType,
    message: attributedMessage,
    client,
    brokerDelivery: { brokerId, rootCallId },
  });
  const telegram = await sendTelegramToOwnerParticipants(brokerUserId, attributedMessage, {
    brokerId, researchCallId, rootCallId, eventType,
  }, db);
  return { message: attributedMessage, whatsappQueued: whatsapp.queued, telegramQueued: telegram.queued };
};

export const distributeBrokerCallUpdate = async ({
  researchCallId,
  rootCallId,
  eventType,
  message,
  client,
}: {
  researchCallId: string;
  rootCallId: string;
  eventType: Exclude<BrokerDeliveryEvent, "RESEARCH_CALL_PUBLISHED">;
  message: string;
  client?: PoolClient;
}) => {
  const db = client ?? pool;
  const publications = await db.query(
    `SELECT publication.broker_id, broker.user_id AS broker_user_id
     FROM broker_call_publications publication
     JOIN broker_details broker ON broker.id = publication.broker_id
     JOIN users account ON account.id = broker.user_id
     WHERE publication.root_call_id = $1 AND publication.status = 'ACTIVE'
       AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE`,
    [rootCallId],
  );

  for (const publication of publications.rows) {
    await deliverBrokerPublication({
      brokerId: publication.broker_id,
      brokerUserId: publication.broker_user_id,
      researchCallId,
      rootCallId,
      eventType,
      message,
      client,
    });
  }
  return { brokers: publications.rowCount ?? 0 };
};
