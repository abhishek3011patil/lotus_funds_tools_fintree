import { pool } from "../db";
import type { PoolClient } from "pg";

type QueueWhatsAppResearchCallInput = {
  researchCallId: string;
  raUserId: string;
  eventType:
    | "RESEARCH_CALL_PUBLISHED"
    | "RESEARCH_CALL_ERRATA"
    | "RESEARCH_CALL_EXITED";
    
  message: string;
  originalCallId?: string | null;
  client?: PoolClient;
  brokerDelivery?: {
    brokerId: string;
    rootCallId: string;
  };
  clientUserIds?: string[];
};

export const queueWhatsAppResearchCall = async ({
  researchCallId,
  raUserId,
  eventType,
  message,
  originalCallId = null,
  client,
  brokerDelivery,
  clientUserIds,
}: QueueWhatsAppResearchCallInput) => {
  const db = client ?? pool;

  const participantsResult = await db.query(
    `
      SELECT
        id,
        phone_number,
        broker_client_id
      FROM whatsapp_participants
      WHERE ra_user_id = $1
        AND consent_confirmed = TRUE
        AND is_active = TRUE
        ${clientUserIds ? "AND client_user_id = ANY($2::uuid[])" : ""}
    `,
    clientUserIds ? [raUserId, clientUserIds] : [raUserId]
  );

  if ((participantsResult.rowCount ?? 0) === 0) {
    console.log(
      `No active WhatsApp participants found for RA: ${raUserId}`
    );

    return {
      queued: 0,
    };
  }

  for (const participant of participantsResult.rows) {
    let brokerDeliveryId: string | null = null;
    if (brokerDelivery && participant.broker_client_id) {
      const deliveryResult = await db.query(
        `INSERT INTO broker_call_deliveries
           (broker_id, broker_client_id, research_call_id, root_call_id, event_type, channel, message_text, status)
         VALUES ($1, $2, $3, $4, $5, 'WHATSAPP', $6, 'QUEUED')
         ON CONFLICT (broker_client_id, research_call_id, event_type, channel) DO UPDATE SET
           message_text = EXCLUDED.message_text, status = 'QUEUED', error_message = NULL,
           provider_message_id = NULL, queued_at = NOW(), sent_at = NULL, updated_at = NOW()
         RETURNING id`,
        [brokerDelivery.brokerId, participant.broker_client_id, researchCallId,
          brokerDelivery.rootCallId, eventType, message],
      );
      brokerDeliveryId = deliveryResult.rows[0]?.id || null;
    }
    await db.query(
      `
        INSERT INTO whatsapp_message_jobs (
          research_call_id,
          original_call_id,
          ra_user_id,
          participant_id,
          phone_number,
          event_type,
          message,
          status,
          attempts,
          error_message,
          created_at,
          updated_at
          ,broker_delivery_id
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          'PENDING',
          0,
          NULL,
          NOW(),
          NOW(),
          $8
        )
      `,
      [
        researchCallId,
        originalCallId,
        raUserId,
        participant.id,
        participant.phone_number,
        eventType,
        message,
        brokerDeliveryId,
      ]
    );
  }

  return {
    queued: participantsResult.rowCount ?? 0,
  };
};
