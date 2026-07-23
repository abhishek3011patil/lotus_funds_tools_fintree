import crypto from "crypto";
import type {
  NextFunction,
  Response,
} from "express";
import { pool } from "../db";
import type {
  AuthRequest,
} from "./auth.middleware";
import {
  expireDueSubscriptions,
  getUsagePeriod,
  type LimitResetPeriod,
  type SubscriptionAudience,
} from "../services/subscriptionAccess.service";

export type SubscriptionContext = {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE";
  audienceType: SubscriptionAudience;
  planCode: string;
  planName: string;
  tierCode: string;
  startsAt: string;
  expiresAt: string;
  featureValues: Record<
    string,
    boolean | number | string
  >;
};

export interface SubscriptionRequest
  extends AuthRequest {
  subscription?: SubscriptionContext;

  subscriptionUsageReservation?: {
    id: string;
    limitKey: string;
    periodStart: string;
    periodEnd: string;
    limit: number;
    usedBeforeReservation: number;
    idempotencyKey: string;
  };
}

const ROLE_AUDIENCE_MAP: Record<
  string,
  SubscriptionAudience
> = {
  RESEARCH_ANALYST: "RA",
  RA: "RA",
  BROKER: "BROKER",
  CLIENT: "CLIENT",
};

const getAudienceForRole = (
  role: unknown
): SubscriptionAudience | null => {
  if (typeof role !== "string") {
    return null;
  }

  return (
    ROLE_AUDIENCE_MAP[
      role.trim().toUpperCase()
    ] || null
  );
};

const getIdempotencyKey = (
  req: SubscriptionRequest
): string => {
  const supplied =
    req.headers["x-idempotency-key"];

  const value = Array.isArray(supplied)
    ? supplied[0]
    : supplied;

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim().slice(0, 255);
  }

  return crypto.randomUUID();
};

const finalizeReservation = async ({
  reservationId,
  consumed,
}: {
  reservationId: string;
  consumed: boolean;
}): Promise<void> => {
  try {
    await pool.query(
      `
        UPDATE subscription_usage_events
        SET
          status = $1,
          consumed_at =
            CASE
              WHEN $1 = 'CONSUMED'
              THEN NOW()
              ELSE consumed_at
            END,
          released_at =
            CASE
              WHEN $1 = 'RELEASED'
              THEN NOW()
              ELSE released_at
            END,
          reserved_until = NULL
        WHERE id = $2
          AND status = 'RESERVED'
      `,
      [
        consumed
          ? "CONSUMED"
          : "RELEASED",
        reservationId,
      ]
    );
  } catch (error) {
    console.error(
      "FINALIZE SUBSCRIPTION USAGE ERROR:",
      error
    );
  }
};

export const requireActiveSubscription =
  async (
    req: SubscriptionRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message:
          "Authenticated user is required.",
      });
      return;
    }

    const audienceType =
      getAudienceForRole(req.user?.role);

    if (!audienceType) {
      res.status(403).json({
        success: false,
        code:
          "SUBSCRIPTION_ROLE_NOT_SUPPORTED",
        message:
          "This account role does not support subscription access.",
      });
      return;
    }

    try {
      /*
       * Real-time safeguard: even if the worker has not run
       * yet, a request cannot use an expired subscription.
       */
      await expireDueSubscriptions({
        userId,
        batchSize: 10,
      });

      const active = await pool.query(
        `
          SELECT
            subscription.id,
            subscription.user_id,
            subscription.plan_id,
            subscription.status,
            subscription.starts_at,
            subscription.expires_at,
            subscription.plan_code_snapshot,
            subscription.plan_name_snapshot,
            subscription.tier_code_snapshot,
            plan.audience_type
          FROM subscriptions subscription
          INNER JOIN subscription_plans plan
            ON plan.id =
               subscription.plan_id
          WHERE subscription.user_id = $1
            AND subscription.status =
                'ACTIVE'
            AND subscription.starts_at
                IS NOT NULL
            AND subscription.starts_at <=
                NOW()
            AND subscription.expires_at
                IS NOT NULL
            AND subscription.expires_at >
                NOW()
            AND plan.audience_type = $2
          ORDER BY
            subscription.expires_at DESC,
            subscription.created_at DESC
          LIMIT 1
        `,
        [userId, audienceType]
      );

      if (active.rows.length === 0) {
        const latest = await pool.query(
          `
            SELECT
              status,
              starts_at,
              expires_at,
              plan_name_snapshot,
              tier_code_snapshot
            FROM subscriptions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [userId]
        );

        const latestSubscription =
          latest.rows[0] || null;

        res.status(403).json({
          success: false,
          code:
            "ACTIVE_SUBSCRIPTION_REQUIRED",
          message:
            latestSubscription?.status ===
            "EXPIRED"
              ? "Your subscription has expired."
              : "An active subscription is required.",
          subscription:
            latestSubscription,
          nextStep:
            latestSubscription?.status ===
            "EXPIRED"
              ? "RENEW_SUBSCRIPTION"
              : "PURCHASE_SUBSCRIPTION",
        });
        return;
      }

      const row = active.rows[0];

      req.subscription = {
        id: row.id,
        userId: row.user_id,
        planId: row.plan_id,
        status: "ACTIVE",
        audienceType:
          row.audience_type,
        planCode:
          row.plan_code_snapshot,
        planName:
          row.plan_name_snapshot,
        tierCode:
          row.tier_code_snapshot,
        startsAt:
          row.starts_at,
        expiresAt:
          row.expires_at,
        featureValues: {},
      };

      next();
    } catch (error) {
      console.error(
        "ACTIVE SUBSCRIPTION CHECK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        code:
          "SUBSCRIPTION_CHECK_FAILED",
        message:
          "Unable to verify subscription access.",
      });
    }
  };

export const requireSubscriptionFeature =
  (featureKey: string) =>
  async (
    req: SubscriptionRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const subscription =
      req.subscription;

    if (!subscription) {
      res.status(500).json({
        success: false,
        code:
          "SUBSCRIPTION_MIDDLEWARE_ORDER",
        message:
          "requireActiveSubscription must run before feature checks.",
      });
      return;
    }

    try {
      const result = await pool.query(
        `
          SELECT
            feature.feature_key,
            feature.value_type,
            plan_feature.is_enabled,
            plan_feature.numeric_value,
            plan_feature.text_value
          FROM subscription_plan_features
            plan_feature
          INNER JOIN subscription_features
            feature
            ON feature.id =
               plan_feature.feature_id
          WHERE plan_feature.plan_id = $1
            AND feature.feature_key = $2
            AND feature.is_active = true
          LIMIT 1
        `,
        [
          subscription.planId,
          featureKey,
        ]
      );

      if (
        result.rows.length === 0 ||
        result.rows[0].is_enabled !== true
      ) {
        res.status(403).json({
          success: false,
          code:
            "SUBSCRIPTION_FEATURE_NOT_INCLUDED",
          message:
            "This feature is not included in your current plan.",
          featureKey,
          plan: {
            code: subscription.planCode,
            name: subscription.planName,
            tier: subscription.tierCode,
          },
          nextStep: "UPGRADE_PLAN",
        });
        return;
      }

      const feature =
        result.rows[0];

      let value:
        | boolean
        | number
        | string = true;

      if (
        feature.value_type === "NUMBER"
      ) {
        value = Number(
          feature.numeric_value
        );
      } else if (
        feature.value_type === "TEXT"
      ) {
        value =
          feature.text_value || "";
      }

      subscription.featureValues[
        featureKey
      ] = value;

      next();
    } catch (error) {
      console.error(
        "SUBSCRIPTION FEATURE CHECK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        code:
          "SUBSCRIPTION_FEATURE_CHECK_FAILED",
        message:
          "Unable to verify plan feature access.",
      });
    }
  };

export const reserveSubscriptionEventLimit =
  ({
    limitKey,
    units = 1,
    reservationMinutes = 15,
  }: {
    limitKey: string;
    units?: number;
    reservationMinutes?: number;
  }) =>
  async (
    req: SubscriptionRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const subscription =
      req.subscription;

    if (!subscription) {
      res.status(500).json({
        success: false,
        code:
          "SUBSCRIPTION_MIDDLEWARE_ORDER",
        message:
          "requireActiveSubscription must run before limit checks.",
      });
      return;
    }

    if (
      !Number.isSafeInteger(units) ||
      units <= 0
    ) {
      res.status(500).json({
        success: false,
        code:
          "INVALID_SUBSCRIPTION_LIMIT_UNITS",
        message:
          "Subscription limit units must be a positive integer.",
      });
      return;
    }

    const db = await pool.connect();
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      const configuration =
        await db.query(
          `
            SELECT
              subscription.id,
              subscription.starts_at,
              subscription.expires_at,
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
              AND subscription.status =
                  'ACTIVE'
              AND subscription.expires_at >
                  NOW()
              AND plan_limit.limit_key = $2
            FOR UPDATE OF subscription
          `,
          [
            subscription.id,
            limitKey,
          ]
        );

      if (
        configuration.rows.length === 0
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(403).json({
          success: false,
          code:
            "SUBSCRIPTION_LIMIT_NOT_CONFIGURED",
          message:
            "This operation is not included in the current plan.",
          limitKey,
          nextStep: "UPGRADE_PLAN",
        });
        return;
      }

      const limit =
        configuration.rows[0];

      if (
        limit.enforcement_mode !==
        "EVENT_COUNT"
      ) {
        throw new Error(
          `${limitKey} is not configured as an EVENT_COUNT limit.`
        );
      }

      if (limit.is_unlimited) {
        await db.query("COMMIT");
        transactionOpen = false;
        next();
        return;
      }

      const maximum = Number(
        limit.limit_value
      );

      if (
        !Number.isSafeInteger(maximum) ||
        maximum < 0
      ) {
        throw new Error(
          `Invalid plan limit configuration for ${limitKey}.`
        );
      }

      const period = getUsagePeriod({
        resetPeriod:
          limit.reset_period as
            LimitResetPeriod,
        startsAt:
          limit.starts_at,
        expiresAt:
          limit.expires_at,
      });

      /*
       * Release reservations left by requests that never
       * reached a completed HTTP response.
       */
      await db.query(
        `
          UPDATE subscription_usage_events
          SET
            status = 'RELEASED',
            released_at = NOW(),
            reserved_until = NULL
          WHERE subscription_id = $1
            AND limit_key = $2
            AND status = 'RESERVED'
            AND reserved_until IS NOT NULL
            AND reserved_until <= NOW()
        `,
        [
          subscription.id,
          limitKey,
        ]
      );

      const idempotencyKey =
        getIdempotencyKey(req);

      const existing = await db.query(
        `
          SELECT
            id,
            status,
            reserved_until
          FROM subscription_usage_events
          WHERE subscription_id = $1
            AND limit_key = $2
            AND idempotency_key = $3
          FOR UPDATE
        `,
        [
          subscription.id,
          limitKey,
          idempotencyKey,
        ]
      );

      if (
        existing.rows.length > 0 &&
        existing.rows[0].status ===
          "CONSUMED"
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          code:
            "DUPLICATE_SUBSCRIPTION_OPERATION",
          message:
            "This operation was already counted.",
          idempotencyKey,
        });
        return;
      }

      if (
        existing.rows.length > 0 &&
        existing.rows[0].status ===
          "RESERVED"
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          code:
            "SUBSCRIPTION_OPERATION_IN_PROGRESS",
          message:
            "The same operation is already in progress.",
          idempotencyKey,
        });
        return;
      }

      const usageResult =
        await db.query(
          `
            SELECT
              COALESCE(
                SUM(units),
                0
              )::bigint AS used
            FROM subscription_usage_events
            WHERE subscription_id = $1
              AND limit_key = $2
              AND period_start = $3
              AND period_end = $4
              AND status IN (
                'RESERVED',
                'CONSUMED'
              )
          `,
          [
            subscription.id,
            limitKey,
            period.start,
            period.end,
          ]
        );

      const used = Number(
        usageResult.rows[0].used
      );

      if (used + units > maximum) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(429).json({
          success: false,
          code:
            "SUBSCRIPTION_LIMIT_REACHED",
          message:
            `${limit.display_name} limit reached.`,
          limit: {
            key: limitKey,
            maximum,
            used,
            requestedUnits: units,
            remaining: Math.max(
              maximum - used,
              0
            ),
            resetsAt: period.end,
          },
          nextStep: "UPGRADE_PLAN",
        });
        return;
      }

      let reservationId: string;

      if (existing.rows.length > 0) {
        const updated = await db.query(
          `
            UPDATE subscription_usage_events
            SET
              status = 'RESERVED',
              units = $1,
              period_start = $2,
              period_end = $3,
              reserved_until =
                NOW() +
                ($4 * INTERVAL '1 minute'),
              consumed_at = NULL,
              released_at = NULL,
              metadata = $5::jsonb
            WHERE id = $6
            RETURNING id
          `,
          [
            units,
            period.start,
            period.end,
            Math.max(
              1,
              reservationMinutes
            ),
            JSON.stringify({
              method: req.method,
              path:
                req.originalUrl ||
                req.url,
            }),
            existing.rows[0].id,
          ]
        );

        reservationId =
          updated.rows[0].id;
      } else {
        const inserted =
          await db.query(
            `
              INSERT INTO
                subscription_usage_events (
                  subscription_id,
                  limit_key,
                  period_start,
                  period_end,
                  idempotency_key,
                  status,
                  units,
                  reserved_until,
                  metadata
                )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'RESERVED',
                $6,
                NOW() +
                  ($7 * INTERVAL '1 minute'),
                $8::jsonb
              )
              RETURNING id
            `,
            [
              subscription.id,
              limitKey,
              period.start,
              period.end,
              idempotencyKey,
              units,
              Math.max(
                1,
                reservationMinutes
              ),
              JSON.stringify({
                method: req.method,
                path:
                  req.originalUrl ||
                  req.url,
              }),
            ]
          );

        reservationId =
          inserted.rows[0].id;
      }

      await db.query("COMMIT");
      transactionOpen = false;

      req.subscriptionUsageReservation = {
        id: reservationId,
        limitKey,
        periodStart:
          period.start.toISOString(),
        periodEnd:
          period.end.toISOString(),
        limit: maximum,
        usedBeforeReservation: used,
        idempotencyKey,
      };

      let finalized = false;

      const finish = (
        consumed: boolean
      ) => {
        if (finalized) {
          return;
        }

        finalized = true;

        void finalizeReservation({
          reservationId,
          consumed,
        });
      };

      res.once("finish", () => {
        finish(
          res.statusCode >= 200 &&
            res.statusCode < 300
        );
      });

      res.once("close", () => {
        if (!res.writableFinished) {
          finish(false);
        }
      });

      next();
    } catch (error) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "SUBSCRIPTION LIMIT ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      console.error(
        "SUBSCRIPTION LIMIT CHECK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        code:
          "SUBSCRIPTION_LIMIT_CHECK_FAILED",
        message:
          "Unable to verify subscription usage limit.",
      });
    } finally {
      db.release();
    }
  };
