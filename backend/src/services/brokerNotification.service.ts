import { pool } from "../db";

export const notifyAssociatedBrokersOfResearchCall = async ({ raUserId, callId, symbol, action }: { raUserId: string; callId: string; symbol: string; action: string }) => {
  await pool.query(
    `INSERT INTO subscription_notifications (user_id, notification_key, type, title, message)
     SELECT account.id, CONCAT('BROKER_RESEARCH_CALL:', $2::text), 'New Research Call', 'New research call available',
            CONCAT('A new ', $4::text, ' research call is available for ', $3::text, '.')
     FROM broker_research_analysts link JOIN ra_details analyst ON analyst.id = link.ra_id
     JOIN broker_details broker ON broker.id = link.broker_id JOIN users account ON account.id = broker.user_id
     WHERE analyst.user_id = $1 AND link.status = 'ACTIVE' ON CONFLICT DO NOTHING`,
    [raUserId, callId, symbol, action],
  );
};
