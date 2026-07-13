import { pool } from "../db";

type QueueWhatsAppResearchCallInput = {
  researchCallId: string;
  raUserId: string;
  eventType:
    | "RESEARCH_CALL_PUBLISHED"
    | "RESEARCH_CALL_ERRATA";
  originalCallId?: string | null;
};

export const queueWhatsAppResearchCall = async ({
  researchCallId,
  raUserId,
  eventType,
  originalCallId = null,
}: QueueWhatsAppResearchCallInput) => {
  const participantsResult = await pool.query(
    `
      SELECT
        id,
        participant_name,
        phone_number
      FROM whatsapp_participants
      WHERE ra_user_id = $1
        AND consent_confirmed = TRUE
        AND is_active = TRUE
    `,
    [raUserId]
  );

  if (participantsResult.rowCount === 0) {
    console.log(
      `No active WhatsApp participants found for RA: ${raUserId}`
    );

    return {
      queued: 0,
    };
  }

  for (const participant of participantsResult.rows) {
    await pool.query(
      `
        INSERT INTO whatsapp_message_jobs (
          research_call_id,
          original_call_id,
          ra_user_id,
          participant_id,
          phone_number,
          event_type,
          status,
          attempts,
          error_message,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'PENDING',
          0,
          NULL,
          NOW(),
          NOW()
        )
      `,
      [
        researchCallId,
        originalCallId,
        raUserId,
        participant.id,
        participant.phone_number,
        eventType,
      ]
    );
  }

  return {
    queued: participantsResult.rowCount,
  };
};