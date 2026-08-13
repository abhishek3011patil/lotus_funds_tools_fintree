import type { PoolClient } from "pg";
import { pool } from "../db";

type RaClientSubscriptionEvent = "ACTIVATED" | "EXPIRED";

export const createRaClientSubscriptionNotification = async ({
  db,
  clientRaSubscriptionId,
  event,
}: {
  db: PoolClient;
  clientRaSubscriptionId: string;
  event: RaClientSubscriptionEvent;
}) => {
  const isActivation = event === "ACTIVATED";
  const notificationKeyPrefix = isActivation
    ? "CLIENT_RA_SUBSCRIPTION_ACTIVATED"
    : "CLIENT_RA_SUBSCRIPTION_EXPIRED";
  const type = isActivation
    ? "New Client Subscription"
    : "Client Subscription Expired";
  const title = isActivation
    ? "A new client subscribed"
    : "A client subscription expired";

  return db.query(
    `INSERT INTO subscription_notifications (
       user_id,
       subscription_id,
       client_ra_subscription_id,
       notification_key,
       type,
       title,
       message
     )
     SELECT
       subscription.ra_user_id,
       NULL,
       subscription.id,
       CONCAT($2::text, ':', subscription.latest_payment_order_id::text),
       $3::text,
       $4::text,
       CASE
         WHEN $5::text = 'ACTIVATED' THEN
           CONCAT(
             COALESCE(NULLIF(client.name, ''), client.email, 'A client'),
             ' subscribed to you. Access is active until ',
             TO_CHAR(subscription.expires_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY'),
             '.'
           )
         ELSE
           CONCAT(
             COALESCE(NULLIF(client.name, ''), client.email, 'A client'),
             '''s subscription expired on ',
             TO_CHAR(subscription.expires_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY'),
             '.'
           )
       END
     FROM client_ra_subscriptions subscription
     INNER JOIN users client ON client.id = subscription.client_user_id
     WHERE subscription.id = $1
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [clientRaSubscriptionId, notificationKeyPrefix, type, title, event]
  );
};

export const expireDueRaClientSubscriptions = async ({
  batchSize = 500,
}: {
  batchSize?: number;
} = {}): Promise<{ expired: number; notificationsCreated: number }> => {
  const safeBatchSize = Math.max(1, Math.min(Math.floor(batchSize), 2000));
  const db = await pool.connect();

  try {
    await db.query("BEGIN");
    const dueResult = await db.query(
      `SELECT id
       FROM client_ra_subscriptions
       WHERE status = 'ACTIVE'
         AND expires_at <= NOW()
       ORDER BY expires_at
       FOR UPDATE SKIP LOCKED
       LIMIT $1`,
      [safeBatchSize]
    );

    const ids = dueResult.rows.map((row) => String(row.id));
    if (ids.length === 0) {
      await db.query("COMMIT");
      return { expired: 0, notificationsCreated: 0 };
    }

    await db.query(
      `UPDATE client_ra_subscriptions
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    let notificationsCreated = 0;
    for (const clientRaSubscriptionId of ids) {
      const notification = await createRaClientSubscriptionNotification({
        db,
        clientRaSubscriptionId,
        event: "EXPIRED",
      });
      notificationsCreated += notification.rowCount || 0;
    }

    await db.query("COMMIT");
    return { expired: ids.length, notificationsCreated };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
};
