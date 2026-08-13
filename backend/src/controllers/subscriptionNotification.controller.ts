import type { Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { emailService } from "../services/email";

type ReminderKind = "30_DAY" | "7_DAY" | "1_DAY";

type NotificationPassResult = {
  remindersAttempted: number;
  expiryNotificationsAttempted: number;
};

const formatDate = (value: Date | string): string =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

const getReminderKind = (
  expiresAt: Date | string
): ReminderKind | null => {
  const remaining =
    new Date(expiresAt).getTime() - Date.now();

  if (remaining <= 0) return null;
  if (remaining <= 86_400_000) return "1_DAY";
  if (remaining <= 7 * 86_400_000) return "7_DAY";
  if (remaining <= 30 * 86_400_000) return "30_DAY";
  return null;
};

const insertDeliveryEvent = async ({
  db,
  subscriptionId,
  eventType,
  metadata,
}: {
  db: PoolClient;
  subscriptionId: string;
  eventType: string;
  metadata: Record<string, unknown>;
}) =>
  db.query(
    `
      INSERT INTO subscription_events (
        subscription_id,
        event_type,
        previous_status,
        new_status,
        actor_user_id,
        reason,
        metadata
      )
      VALUES (
        $1,
        $2,
        NULL,
        NULL,
        NULL,
        'Automated subscription notification attempt',
        $3::jsonb
      )
    `,
    [subscriptionId, eventType, JSON.stringify(metadata)]
  );

const insertUserNotification = async ({
  db,
  userId,
  type,
  title,
  message,
  subscriptionId,
  notificationKey,
}: {
  db: PoolClient;
  userId: string;
  type: string;
  title: string;
  message: string;
  subscriptionId: string;
  notificationKey: string;
}) =>
  db.query(
    `
      INSERT INTO subscription_notifications (
        user_id,
        subscription_id,
        notification_key,
        type,
        title,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (subscription_id, notification_key)
      DO NOTHING
      RETURNING id
    `,
    [
      userId,
      subscriptionId,
      notificationKey,
      type,
      title,
      message,
    ]
  );

const deliverReminder = async (
  subscription: any,
  reminderKind: ReminderKind
): Promise<boolean> => {
  const db = await pool.connect();
  let transactionOpen = false;
  const eventType =
    `SUBSCRIPTION_EXPIRY_REMINDER_${reminderKind}`;

  try {
    await db.query("BEGIN");
    transactionOpen = true;
    await db.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`${subscription.id}:${eventType}`]
    );

    const existingNotification = await db.query(
      `
        SELECT 1
        FROM subscription_notifications
        WHERE subscription_id = $1
          AND notification_key = $2
        LIMIT 1
      `,
      [subscription.id, eventType]
    );

    if (existingNotification.rows.length > 0) {
      await db.query("COMMIT");
      transactionOpen = false;
      return false;
    }

    const existingDeliveryEvent = await db.query(
      `
        SELECT 1
        FROM subscription_events
        WHERE subscription_id = $1
          AND event_type = $2
        LIMIT 1
      `,
      [subscription.id, eventType]
    );

    const delivery =
      existingDeliveryEvent.rows.length > 0
        ? null
        : await emailService.send(
            "SUBSCRIPTION_EXPIRY_REMINDER",
            subscription.email,
            {
              name: subscription.name || "Subscriber",
              expiryDate: formatDate(
                subscription.expires_at
              ),
            }
          );

    const reminderDays =
      reminderKind === "30_DAY"
        ? 30
        : reminderKind === "7_DAY"
          ? 7
          : 1;

    const insertedNotification =
      await insertUserNotification({
      db,
      userId: subscription.user_id,
      type: "Subscription Renewal Reminder",
      title: "Subscription renewal reminder",
      message:
        `Your ${subscription.plan_name_snapshot} subscription expires ` +
        `in ${reminderDays} day${reminderDays === 1 ? "" : "s"} ` +
        `on ${formatDate(subscription.expires_at)}. Renew from Settings to avoid interruption.`,
      subscriptionId: subscription.id,
      notificationKey: eventType,
    });

    if (delivery) {
      await insertDeliveryEvent({
        db,
        subscriptionId: subscription.id,
        eventType,
        metadata: {
          reminderKind,
          expiresAt: subscription.expires_at,
          emailSent: delivery.sent,
          emailSkipped: delivery.skipped,
          emailReason: delivery.reason || null,
        },
      });
    }

    await db.query("COMMIT");
    transactionOpen = false;
    return (insertedNotification.rowCount || 0) > 0;
  } catch (error) {
    if (transactionOpen) {
      await db.query("ROLLBACK");
    }
    throw error;
  } finally {
    db.release();
  }
};

const deliverExpiredNotification = async (
  subscription: any
): Promise<boolean> => {
  const db = await pool.connect();
  let transactionOpen = false;
  const eventType =
    "SUBSCRIPTION_EXPIRED_NOTIFICATION";

  try {
    await db.query("BEGIN");
    transactionOpen = true;
    await db.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`${subscription.id}:${eventType}`]
    );

    const existingNotification = await db.query(
      `
        SELECT 1
        FROM subscription_notifications
        WHERE subscription_id = $1
          AND notification_key = $2
        LIMIT 1
      `,
      [subscription.id, eventType]
    );

    if (existingNotification.rows.length > 0) {
      await db.query("COMMIT");
      transactionOpen = false;
      return false;
    }

    const existingDeliveryEvent = await db.query(
      `
        SELECT 1
        FROM subscription_events
        WHERE subscription_id = $1
          AND event_type = $2
        LIMIT 1
      `,
      [subscription.id, eventType]
    );

    const delivery =
      existingDeliveryEvent.rows.length > 0
        ? null
        : await emailService.send(
            "SUBSCRIPTION_EXPIRED",
            subscription.email,
            {
              name: subscription.name || "Subscriber",
              expiryDate: formatDate(
                subscription.expires_at
              ),
            }
          );

    const insertedNotification =
      await insertUserNotification({
      db,
      userId: subscription.user_id,
      type: "Subscription Expired",
      title: "Subscription expired",
      message:
        `Your ${subscription.plan_name_snapshot} subscription expired ` +
        `on ${formatDate(subscription.expires_at)}. Renew from Settings to restore subscription-protected features.`,
      subscriptionId: subscription.id,
      notificationKey: eventType,
    });

    if (delivery) {
      await insertDeliveryEvent({
        db,
        subscriptionId: subscription.id,
        eventType,
        metadata: {
          expiresAt: subscription.expires_at,
          emailSent: delivery.sent,
          emailSkipped: delivery.skipped,
          emailReason: delivery.reason || null,
        },
      });
    }

    await db.query("COMMIT");
    transactionOpen = false;
    return (insertedNotification.rowCount || 0) > 0;
  } catch (error) {
    if (transactionOpen) {
      await db.query("ROLLBACK");
    }
    throw error;
  } finally {
    db.release();
  }
};

export const processDueSubscriptionNotifications = async ({
  batchSize = 500,
}: {
  batchSize?: number;
} = {}): Promise<NotificationPassResult> => {
  const safeBatchSize = Math.max(
    1,
    Math.min(Math.floor(batchSize), 2000)
  );

  const [activeResult, expiredResult] =
    await Promise.all([
      pool.query(
        `
          SELECT
            subscription.id,
            subscription.expires_at,
            subscription.plan_name_snapshot,
            subscription.user_id,
            user_account.name,
            user_account.email
          FROM subscriptions subscription
          INNER JOIN users user_account
            ON user_account.id = subscription.user_id
          WHERE subscription.status = 'ACTIVE'
            AND subscription.expires_at > NOW()
            AND subscription.expires_at <=
                NOW() + INTERVAL '30 days'
            AND NOT EXISTS (
              SELECT 1
              FROM subscription_notifications notification_event
              WHERE notification_event.subscription_id =
                    subscription.id
                AND notification_event.notification_key =
                  CASE
                    WHEN subscription.expires_at <=
                         NOW() + INTERVAL '1 day'
                    THEN 'SUBSCRIPTION_EXPIRY_REMINDER_1_DAY'
                    WHEN subscription.expires_at <=
                         NOW() + INTERVAL '7 days'
                    THEN 'SUBSCRIPTION_EXPIRY_REMINDER_7_DAY'
                    ELSE 'SUBSCRIPTION_EXPIRY_REMINDER_30_DAY'
                  END
            )
          ORDER BY subscription.expires_at
          LIMIT $1
        `,
        [safeBatchSize]
      ),
      pool.query(
        `
          SELECT
            subscription.id,
            subscription.expires_at,
            subscription.plan_name_snapshot,
            subscription.user_id,
            user_account.name,
            user_account.email
          FROM subscriptions subscription
          INNER JOIN users user_account
            ON user_account.id = subscription.user_id
          WHERE subscription.status = 'EXPIRED'
            AND subscription.expires_at IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM subscription_notifications notification_event
              WHERE notification_event.subscription_id =
                    subscription.id
                AND notification_event.notification_key =
                    'SUBSCRIPTION_EXPIRED_NOTIFICATION'
            )
          ORDER BY subscription.expires_at DESC
          LIMIT $1
        `,
        [safeBatchSize]
      ),
    ]);

  let remindersAttempted = 0;
  for (const subscription of activeResult.rows) {
    const kind = getReminderKind(
      subscription.expires_at
    );
    if (
      kind &&
      (await deliverReminder(subscription, kind))
    ) {
      remindersAttempted += 1;
    }
  }

  let expiryNotificationsAttempted = 0;
  for (const subscription of expiredResult.rows) {
    if (
      await deliverExpiredNotification(subscription)
    ) {
      expiryNotificationsAttempted += 1;
    }
  }

  return {
    remindersAttempted,
    expiryNotificationsAttempted,
  };
};

export const runSubscriptionNotificationPass = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result =
      await processDueSubscriptionNotifications();
    res.status(200).json({
      success: true,
      message:
        "Subscription notification pass completed.",
      ...result,
    });
  } catch (error) {
    console.error(
      "SUBSCRIPTION NOTIFICATION PASS ERROR:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Unable to process subscription notifications.",
    });
  }
};

export const getMySubscriptionNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          subscription_id,
          client_ra_subscription_id,
          type,
          title,
          message,
          is_read,
          read_at,
          created_at
        FROM subscription_notifications
        WHERE user_id = $1
          AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error(
      "GET SUBSCRIPTION NOTIFICATIONS ERROR:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Unable to load subscription notifications.",
    });
  }
};

export const markSubscriptionNotificationRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ success: false });
    return;
  }

  const result = await pool.query(
    `
      UPDATE subscription_notifications
      SET is_read = true,
          read_at = COALESCE(read_at, NOW()),
          updated_at = NOW()
      WHERE id = $1
        AND user_id = $2
        AND is_deleted = false
      RETURNING id
    `,
    [req.params.id, req.user.id]
  );

  res.status(result.rows.length > 0 ? 200 : 404).json({
    success: result.rows.length > 0,
    message:
      result.rows.length > 0
        ? "Notification marked as read."
        : "Notification not found.",
  });
};

export const markAllSubscriptionNotificationsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ success: false });
    return;
  }

  await pool.query(
    `
      UPDATE subscription_notifications
      SET is_read = true,
          read_at = COALESCE(read_at, NOW()),
          updated_at = NOW()
      WHERE user_id = $1
        AND is_read = false
        AND is_deleted = false
    `,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
  });
};

export const getSubscriptionNotificationUnreadCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ success: false });
    return;
  }

  const result = await pool.query(
    `
      SELECT COUNT(*)::integer AS count
      FROM subscription_notifications
      WHERE user_id = $1
        AND is_read = false
        AND is_deleted = false
    `,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    count: Number(result.rows[0]?.count || 0),
  });
};
