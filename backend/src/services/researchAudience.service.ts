import type { Pool, PoolClient } from "pg";

type Queryable = Pick<Pool | PoolClient, "query">;
export type AudienceMode = "ALL_CONNECTED" | "GROUPS";
export type AudienceRecipient = {
  type: "CLIENT" | "BROKER" | "TELEGRAM" | "WHATSAPP";
  id: string;
  name: string;
};
export type AudienceGroupSnapshot = { id: string; name: string };

const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export const parseAudienceSelection = (body: Record<string, unknown>) => {
  const requestedMode = String(body.audience_mode || "ALL_CONNECTED").toUpperCase();
  const mode: AudienceMode = requestedMode === "GROUPS" ? "GROUPS" : "ALL_CONNECTED";
  let groupIds: string[] = [];
  const raw = body.audience_group_ids;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) groupIds = [...new Set(parsed.map(String).filter(id => uuidPattern.test(id)))];
  } catch {
    groupIds = [];
  }
  return { mode, groupIds };
};

export const resolveResearchAudience = async ({
  raUserId,
  mode,
  groupIds,
  db,
}: {
  raUserId: string;
  mode: AudienceMode;
  groupIds: string[];
  db: Queryable;
}) => {
  if (mode === "GROUPS" && groupIds.length === 0) {
    throw new Error("Select at least one audience group.");
  }

  let selectedGroups: AudienceGroupSnapshot[] = [];
  if (mode === "GROUPS") {
    const groups = await db.query(
      `SELECT id, name FROM ra_audience_groups
       WHERE ra_user_id = $1 AND id = ANY($2::uuid[])
       ORDER BY name`,
      [raUserId, groupIds],
    );
    if (groups.rows.length !== groupIds.length) {
      throw new Error("One or more selected audience groups are no longer available.");
    }
    selectedGroups = groups.rows.map(row => ({ id: row.id, name: row.name }));
  }

  const clientResult = await db.query(
    mode === "ALL_CONNECTED"
      ? `SELECT DISTINCT account.id, COALESCE(NULLIF(TRIM(account.name), ''), account.email, 'Client') AS name
         FROM client_ra_subscriptions subscription
         JOIN users account ON account.id = subscription.client_user_id
         WHERE subscription.ra_user_id = $1
           AND subscription.status = 'ACTIVE' AND subscription.expires_at > NOW()
           AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE`
      : `SELECT DISTINCT account.id, COALESCE(NULLIF(TRIM(account.name), ''), account.email, 'Client') AS name
         FROM ra_audience_group_members member
         JOIN ra_audience_groups audience_group ON audience_group.id = member.group_id
         JOIN client_ra_subscriptions subscription
           ON subscription.client_user_id = member.client_user_id
          AND subscription.ra_user_id = audience_group.ra_user_id
         JOIN users account ON account.id = member.client_user_id
         WHERE audience_group.ra_user_id = $1 AND audience_group.id = ANY($2::uuid[])
           AND member.member_type = 'CLIENT'
           AND subscription.status = 'ACTIVE' AND subscription.expires_at > NOW()
           AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE`,
    mode === "ALL_CONNECTED" ? [raUserId] : [raUserId, groupIds],
  );

  const brokerResult = await db.query(
    mode === "ALL_CONNECTED"
      ? `SELECT DISTINCT broker.id,
           COALESCE(NULLIF(TRIM(broker.trade_name), ''), broker.legal_name, 'Broker') AS name
         FROM broker_research_analysts connection
         JOIN ra_details analyst ON analyst.id = connection.ra_id
         JOIN broker_details broker ON broker.id = connection.broker_id
         JOIN users account ON account.id = broker.user_id
         WHERE analyst.user_id = $1 AND connection.status = 'ACTIVE'
           AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE`
      : `SELECT DISTINCT broker.id,
           COALESCE(NULLIF(TRIM(broker.trade_name), ''), broker.legal_name, 'Broker') AS name
         FROM ra_audience_group_members member
         JOIN ra_audience_groups audience_group ON audience_group.id = member.group_id
         JOIN broker_research_analysts connection ON connection.broker_id = member.broker_id
         JOIN ra_details analyst
           ON analyst.id = connection.ra_id AND analyst.user_id = audience_group.ra_user_id
         JOIN broker_details broker ON broker.id = member.broker_id
         JOIN users account ON account.id = broker.user_id
         WHERE audience_group.ra_user_id = $1 AND audience_group.id = ANY($2::uuid[])
           AND member.member_type = 'BROKER' AND connection.status = 'ACTIVE'
           AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE`,
    mode === "ALL_CONNECTED" ? [raUserId] : [raUserId, groupIds],
  );

  const telegramResult = await db.query(
    mode === "ALL_CONNECTED"
      ? `SELECT participant.id,
           COALESCE(NULLIF(TRIM(participant.telegram_client_name), ''), 'Telegram ' || participant.telegram_user_id::text) AS name
         FROM telegram_users participant
         WHERE participant.user_id = $1 AND participant.is_active = TRUE`
      : `SELECT DISTINCT participant.id,
           COALESCE(NULLIF(TRIM(participant.telegram_client_name), ''), 'Telegram ' || participant.telegram_user_id::text) AS name
         FROM ra_audience_group_members member
         JOIN ra_audience_groups audience_group ON audience_group.id = member.group_id
         JOIN telegram_users participant ON participant.id = member.telegram_participant_id
         WHERE audience_group.ra_user_id = $1 AND audience_group.id = ANY($2::uuid[])
           AND member.member_type = 'TELEGRAM' AND participant.user_id = audience_group.ra_user_id
           AND participant.is_active = TRUE`,
    mode === "ALL_CONNECTED" ? [raUserId] : [raUserId, groupIds],
  );

  const whatsappResult = await db.query(
    mode === "ALL_CONNECTED"
      ? `SELECT participant.id, participant.participant_name AS name
         FROM whatsapp_participants participant
         WHERE participant.ra_user_id = $1 AND participant.is_active = TRUE
           AND participant.consent_confirmed = TRUE`
      : `SELECT DISTINCT participant.id, participant.participant_name AS name
         FROM ra_audience_group_members member
         JOIN ra_audience_groups audience_group ON audience_group.id = member.group_id
         JOIN whatsapp_participants participant ON participant.id = member.whatsapp_participant_id
         WHERE audience_group.ra_user_id = $1 AND audience_group.id = ANY($2::uuid[])
           AND member.member_type = 'WHATSAPP' AND participant.ra_user_id = audience_group.ra_user_id
           AND participant.is_active = TRUE AND participant.consent_confirmed = TRUE`,
    mode === "ALL_CONNECTED" ? [raUserId] : [raUserId, groupIds],
  );

  const recipients: AudienceRecipient[] = [
    ...clientResult.rows.map(row => ({ type: "CLIENT" as const, id: row.id, name: row.name })),
    ...brokerResult.rows.map(row => ({ type: "BROKER" as const, id: row.id, name: row.name })),
    ...telegramResult.rows.map(row => ({ type: "TELEGRAM" as const, id: row.id, name: row.name })),
    ...whatsappResult.rows.map(row => ({ type: "WHATSAPP" as const, id: row.id, name: row.name })),
  ];

  if (mode === "GROUPS" && recipients.length === 0) {
    throw new Error("The selected groups have no active recipients.");
  }

  return { mode, selectedGroups, recipients };
};

export const audienceClientIds = (recipients: AudienceRecipient[]) =>
  recipients.filter(recipient => recipient.type === "CLIENT").map(recipient => recipient.id);

export const audienceTelegramParticipantIds = (recipients: AudienceRecipient[]) =>
  recipients.filter(recipient => recipient.type === "TELEGRAM").map(recipient => recipient.id);

export const audienceWhatsAppParticipantIds = (recipients: AudienceRecipient[]) =>
  recipients.filter(recipient => recipient.type === "WHATSAPP").map(recipient => recipient.id);
