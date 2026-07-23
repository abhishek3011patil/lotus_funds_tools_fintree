import type {
  Response,
} from "express";
import { pool } from "../db";
import type {
  AuthRequest,
} from "../middlewares/auth.middleware";
import {
  expireDueSubscriptions,
  getUsagePeriod,
  type LimitResetPeriod,
} from "../services/subscriptionAccess.service";

export const getMySubscriptionAccess =
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Authenticated user is required.",
      });
      return;
    }

    try {
      await expireDueSubscriptions({
        userId,
        batchSize: 10,
      });

      const result = await pool.query(
        `
          SELECT
            subscription.id,
            subscription.status,
            subscription.starts_at,
            subscription.expires_at,
            subscription.plan_id,
            subscription.plan_code_snapshot,
            subscription.plan_name_snapshot,
            subscription.tier_code_snapshot,
            subscription.price_paise_snapshot,
            subscription.duration_days_snapshot,
            subscription.plan_version_snapshot,
            plan.audience_type
          FROM subscriptions subscription
          INNER JOIN subscription_plans plan
            ON plan.id =
               subscription.plan_id
          WHERE subscription.user_id = $1
          ORDER BY
            CASE
              WHEN subscription.status =
                   'ACTIVE'
              THEN 0
              ELSE 1
            END,
            subscription.created_at DESC
          LIMIT 1
        `,
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(200).json({
          success: true,
          hasSubscription: false,
          hasActiveSubscription: false,
          subscription: null,
          features: [],
          limits: [],
          nextStep:
            "PURCHASE_SUBSCRIPTION",
        });
        return;
      }

      const subscription =
        result.rows[0];

      const featureResult =
        await pool.query(
          `
            SELECT
              feature.feature_key,
              feature.display_name,
              feature.description,
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
            WHERE plan_feature.plan_id =
                  $1
              AND feature.is_active = true
            ORDER BY
              plan_feature.display_order,
              feature.display_name
          `,
          [subscription.plan_id]
        );

      const limitResult =
        await pool.query(
          `
            SELECT
              limit_key,
              display_name,
              limit_value,
              is_unlimited,
              enforcement_mode,
              reset_period
            FROM subscription_plan_limits
            WHERE plan_id = $1
            ORDER BY display_name
          `,
          [subscription.plan_id]
        );

      const limits = [];

      for (
        const limit of limitResult.rows
      ) {
        let usage:
          | {
              used: number;
              reserved: number;
              remaining: number | null;
              resetsAt: string;
            }
          | null = null;

        if (
          limit.enforcement_mode ===
          "EVENT_COUNT"
        ) {
          const period = getUsagePeriod({
            resetPeriod:
              limit.reset_period as
                LimitResetPeriod,
            startsAt:
              subscription.starts_at,
            expiresAt:
              subscription.expires_at,
          });

          const usageResult =
            await pool.query(
              `
                SELECT
                  COALESCE(
                    SUM(units)
                      FILTER (
                        WHERE status =
                              'CONSUMED'
                      ),
                    0
                  )::bigint AS used,

                  COALESCE(
                    SUM(units)
                      FILTER (
                        WHERE status =
                              'RESERVED'
                          AND (
                            reserved_until
                              IS NULL
                            OR reserved_until >
                               NOW()
                          )
                      ),
                    0
                  )::bigint AS reserved

                FROM subscription_usage_events
                WHERE subscription_id = $1
                  AND limit_key = $2
                  AND period_start = $3
                  AND period_end = $4
              `,
              [
                subscription.id,
                limit.limit_key,
                period.start,
                period.end,
              ]
            );

          const used = Number(
            usageResult.rows[0].used
          );

          const reserved = Number(
            usageResult.rows[0].reserved
          );

          const maximum =
            limit.is_unlimited
              ? null
              : Number(
                  limit.limit_value
                );

          usage = {
            used,
            reserved,
            remaining:
              maximum === null
                ? null
                : Math.max(
                    maximum -
                      used -
                      reserved,
                    0
                  ),
            resetsAt:
              period.end.toISOString(),
          };
        }

        limits.push({
          key: limit.limit_key,
          displayName:
            limit.display_name,
          value: limit.is_unlimited
            ? null
            : Number(
                limit.limit_value
              ),
          unlimited:
            limit.is_unlimited,
          enforcementMode:
            limit.enforcement_mode,
          resetPeriod:
            limit.reset_period,
          usage,
        });
      }

      res.status(200).json({
        success: true,
        hasSubscription: true,
        hasActiveSubscription:
          subscription.status ===
            "ACTIVE" &&
          new Date(
            subscription.expires_at
          ).getTime() > Date.now(),

        subscription: {
          id: subscription.id,
          status:
            subscription.status,
          audienceType:
            subscription.audience_type,
          planId:
            subscription.plan_id,
          planCode:
            subscription.plan_code_snapshot,
          planName:
            subscription.plan_name_snapshot,
          tierCode:
            subscription.tier_code_snapshot,
          pricePaise: Number(
            subscription.price_paise_snapshot
          ),
          durationDays: Number(
            subscription.duration_days_snapshot
          ),
          version: Number(
            subscription.plan_version_snapshot
          ),
          startsAt:
            subscription.starts_at,
          expiresAt:
            subscription.expires_at,
        },

        features:
          featureResult.rows.map(
            (feature) => ({
              key:
                feature.feature_key,
              displayName:
                feature.display_name,
              description:
                feature.description,
              enabled:
                feature.is_enabled,
              value:
                feature.value_type ===
                "NUMBER"
                  ? Number(
                      feature.numeric_value
                    )
                  : feature.value_type ===
                      "TEXT"
                    ? feature.text_value
                    : feature.is_enabled,
            })
          ),

        limits,

        nextStep:
          subscription.status ===
          "EXPIRED"
            ? "RENEW_SUBSCRIPTION"
            : null,
      });
    } catch (error) {
      console.error(
        "GET MY SUBSCRIPTION ACCESS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load subscription access.",
      });
    }
  };
