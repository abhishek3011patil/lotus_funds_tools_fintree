import type { PoolClient } from "pg";
import { pool } from "../db";

export type SubscriptionAudience =
  | "RA"
  | "BROKER"
  | "CLIENT";

export type LimitResetPeriod =
  | "DAILY"
  | "MONTHLY"
  | "SUBSCRIPTION"
  | "LIFETIME";

export type UsagePeriod = {
  start: Date;
  end: Date;
};

const FAR_FUTURE =
  new Date("9999-12-31T23:59:59.999Z");

export const getUsagePeriod = ({
  resetPeriod,
  startsAt,
  expiresAt,
  now = new Date(),
}: {
  resetPeriod: LimitResetPeriod;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  now?: Date;
}): UsagePeriod => {
  switch (resetPeriod) {
    case "DAILY": {
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      return { start, end };
    }

    case "MONTHLY": {
      const start = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        )
      );

      const end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          1
        )
      );

      return { start, end };
    }

    case "SUBSCRIPTION": {
      const start = startsAt
        ? new Date(startsAt)
        : now;

      const end = expiresAt
        ? new Date(expiresAt)
        : FAR_FUTURE;

      return { start, end };
    }

    case "LIFETIME":
    default:
      return {
        start: startsAt
          ? new Date(startsAt)
          : new Date(0),
        end: FAR_FUTURE,
      };
  }
};

export const expireDueSubscriptions =
  async ({
    userId,
    batchSize = 500,
    client,
  }: {
    userId?: string;
    batchSize?: number;
    client?: PoolClient;
  } = {}): Promise<number> => {
    const db = client || (await pool.connect());
    const ownsClient = !client;
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      const values: unknown[] = [
        Math.max(
          1,
          Math.min(batchSize, 2000)
        ),
      ];

      let userFilter = "";

      if (userId) {
        values.push(userId);
        userFilter =
          `AND subscription.user_id = $${values.length}`;
      }

      const due = await db.query(
        `
          SELECT
            subscription.id,
            subscription.status,
            subscription.user_id,
            subscription.expires_at
          FROM subscriptions subscription
          WHERE subscription.status = 'ACTIVE'
            AND subscription.expires_at IS NOT NULL
            AND subscription.expires_at <= NOW()
            ${userFilter}
          ORDER BY subscription.expires_at
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        `,
        values
      );

      for (const subscription of due.rows) {
        await db.query(
          `
            UPDATE subscriptions
            SET
              status = 'EXPIRED',
              updated_at = NOW()
            WHERE id = $1
              AND status = 'ACTIVE'
          `,
          [subscription.id]
        );

        await db.query(
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
              'SUBSCRIPTION_EXPIRED',
              'ACTIVE',
              'EXPIRED',
              NULL,
              'Subscription reached its expiry date',
              $2::jsonb
            )
          `,
          [
            subscription.id,
            JSON.stringify({
              expiredAt:
                subscription.expires_at,
              automatic: true,
            }),
          ]
        );
      }

      await db.query("COMMIT");
      transactionOpen = false;

      return due.rows.length;
    } catch (error) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "SUBSCRIPTION EXPIRY ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      throw error;
    } finally {
      if (ownsClient) {
        db.release();
      }
    }
  };

export const getPlanLimit =
  async ({
    subscriptionId,
    limitKey,
    client,
  }: {
    subscriptionId: string;
    limitKey: string;
    client?: PoolClient;
  }) => {
    const db = client || pool;

    const result = await db.query(
      `
        SELECT
          plan_limit.limit_key,
          plan_limit.display_name,
          plan_limit.limit_value,
          plan_limit.is_unlimited,
          plan_limit.enforcement_mode,
          plan_limit.reset_period
        FROM subscriptions subscription
        INNER JOIN subscription_plan_limits
          plan_limit
          ON plan_limit.plan_id =
             subscription.plan_id
        WHERE subscription.id = $1
          AND plan_limit.limit_key = $2
        LIMIT 1
      `,
      [subscriptionId, limitKey]
    );

    return result.rows[0] || null;
  };

export const assertResourceLimit =
  async ({
    subscriptionId,
    limitKey,
    currentUsage,
    requestedUnits = 1,
    client,
  }: {
    subscriptionId: string;
    limitKey: string;
    currentUsage: number;
    requestedUnits?: number;
    client?: PoolClient;
  }): Promise<{
    allowed: true;
    limit: number | null;
    remaining: number | null;
  }> => {
    const limit = await getPlanLimit({
      subscriptionId,
      limitKey,
      client,
    });

    if (!limit) {
      throw new Error(
        `Plan limit ${limitKey} is not configured.`
      );
    }

    if (
      limit.enforcement_mode !==
      "RESOURCE_COUNT"
    ) {
      throw new Error(
        `${limitKey} is not a RESOURCE_COUNT limit.`
      );
    }

    if (limit.is_unlimited) {
      return {
        allowed: true,
        limit: null,
        remaining: null,
      };
    }

    const maximum =
      Number(limit.limit_value);

    if (
      !Number.isSafeInteger(maximum) ||
      maximum < 0
    ) {
      throw new Error(
        `Plan limit ${limitKey} is invalid.`
      );
    }

    if (
      currentUsage + requestedUnits >
      maximum
    ) {
      const error = new Error(
        `${limit.display_name} limit reached.`
      ) as Error & {
        statusCode?: number;
        code?: string;
        details?: unknown;
      };

      error.statusCode = 429;
      error.code =
        "SUBSCRIPTION_LIMIT_REACHED";
      error.details = {
        limitKey,
        currentUsage,
        requestedUnits,
        maximum,
        remaining: Math.max(
          maximum - currentUsage,
          0
        ),
      };

      throw error;
    }

    return {
      allowed: true,
      limit: maximum,
      remaining: Math.max(
        maximum -
          currentUsage -
          requestedUnits,
        0
      ),
    };
  };
