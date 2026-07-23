import type { Request, Response } from "express";
import { pool } from "../db";

type AudienceType = "RA" | "BROKER" | "CLIENT";

const VALID_AUDIENCE_TYPES = new Set<AudienceType>([
  "RA",
  "BROKER",
  "CLIENT",
]);

const parseAudienceType = (
  value: unknown
): AudienceType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase() as AudienceType;

  return VALID_AUDIENCE_TYPES.has(normalized)
    ? normalized
    : null;
};

const mapPlanRow = (row: any) => ({
  id: row.id,
  planCode: row.plan_code,
  audienceType: row.audience_type,
  tierCode: row.tier_code,
  displayName: row.display_name,
  shortDescription: row.short_description,
  fullDescription: row.full_description,

  price: {
    amountPaise: Number(row.price_paise),
    amountRupees: Number(row.price_paise) / 100,
    currency: row.currency,
  },

  billingPeriod: row.billing_period,
  durationDays: Number(row.duration_days),
  trialDays: Number(row.trial_days),

  isPopular: row.is_popular,
  displayOrder: Number(row.display_order),
  version: Number(row.version),

  effectiveFrom: row.effective_from,
  effectiveUntil: row.effective_until,

  features: Array.isArray(row.features)
    ? row.features
    : [],

  limits: Array.isArray(row.limits)
    ? row.limits
    : [],
});

/**
 * GET /api/subscription-plans?audienceType=RA
 *
 * Public endpoint used during registration.
 * Returns the latest active/effective version of all 3 tiers
 * belonging to RA, BROKER, or CLIENT.
 */
export const getSubscriptionPlans = async (
  req: Request,
  res: Response
) => {
  const audienceType = parseAudienceType(
    req.query.audienceType
  );

  if (!audienceType) {
    return res.status(400).json({
      success: false,
      message:
        "audienceType is required and must be RA, BROKER, or CLIENT.",
    });
  }

  try {
    const result = await pool.query(
      `
        WITH ranked_plans AS (
          SELECT
            p.*,
            ROW_NUMBER() OVER (
              PARTITION BY p.audience_type, p.tier_code
              ORDER BY
                p.version DESC,
                p.effective_from DESC,
                p.created_at DESC
            ) AS row_number
          FROM subscription_plans p
          WHERE p.audience_type = $1
            AND p.is_active = true
            AND p.effective_from <= NOW()
            AND (
              p.effective_until IS NULL
              OR p.effective_until > NOW()
            )
        )
        SELECT
          p.id,
          p.plan_code,
          p.audience_type,
          p.tier_code,
          p.display_name,
          p.short_description,
          p.full_description,
          p.price_paise,
          p.currency,
          p.billing_period,
          p.duration_days,
          p.trial_days,
          p.is_popular,
          p.display_order,
          p.version,
          p.effective_from,
          p.effective_until,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'key', f.feature_key,
                  'name', f.display_name,
                  'description', f.description,
                  'valueType', f.value_type,
                  'enabled', pf.is_enabled,
                  'numericValue', pf.numeric_value,
                  'textValue', pf.text_value,
                  'displayOrder', pf.display_order
                )
                ORDER BY
                  pf.display_order,
                  f.display_name
              )
              FROM subscription_plan_features pf
              INNER JOIN subscription_features f
                ON f.id = pf.feature_id
              WHERE pf.plan_id = p.id
                AND f.is_active = true
                AND pf.is_enabled = true
            ),
            '[]'::jsonb
          ) AS features,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'key', pl.limit_key,
                  'name', pl.display_name,
                  'value',
                    CASE
                      WHEN pl.is_unlimited THEN NULL
                      ELSE pl.limit_value
                    END,
                  'isUnlimited', pl.is_unlimited
                )
                ORDER BY pl.display_name
              )
              FROM subscription_plan_limits pl
              WHERE pl.plan_id = p.id
            ),
            '[]'::jsonb
          ) AS limits

        FROM ranked_plans p
        WHERE p.row_number = 1
        ORDER BY
          p.display_order ASC,
          p.tier_code ASC
      `,
      [audienceType]
    );

    return res.status(200).json({
      success: true,
      audienceType,
      count: result.rows.length,
      plans: result.rows.map(mapPlanRow),
    });
  } catch (error) {
    console.error(
      "GET SUBSCRIPTION PLANS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load subscription plans.",
    });
  }
};

/**
 * GET /api/subscription-plans/:planId
 *
 * Returns one active/effective plan.
 * The plan-selection endpoint added next must still revalidate
 * the selected plan directly from the database.
 */
export const getSubscriptionPlanById = async (
  req: Request,
  res: Response
) => {
  const { planId } = req.params;

  if (!planId) {
    return res.status(400).json({
      success: false,
      message: "Plan ID is required.",
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          p.id,
          p.plan_code,
          p.audience_type,
          p.tier_code,
          p.display_name,
          p.short_description,
          p.full_description,
          p.price_paise,
          p.currency,
          p.billing_period,
          p.duration_days,
          p.trial_days,
          p.is_popular,
          p.display_order,
          p.version,
          p.effective_from,
          p.effective_until,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'key', f.feature_key,
                  'name', f.display_name,
                  'description', f.description,
                  'valueType', f.value_type,
                  'enabled', pf.is_enabled,
                  'numericValue', pf.numeric_value,
                  'textValue', pf.text_value,
                  'displayOrder', pf.display_order
                )
                ORDER BY
                  pf.display_order,
                  f.display_name
              )
              FROM subscription_plan_features pf
              INNER JOIN subscription_features f
                ON f.id = pf.feature_id
              WHERE pf.plan_id = p.id
                AND f.is_active = true
                AND pf.is_enabled = true
            ),
            '[]'::jsonb
          ) AS features,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'key', pl.limit_key,
                  'name', pl.display_name,
                  'value',
                    CASE
                      WHEN pl.is_unlimited THEN NULL
                      ELSE pl.limit_value
                    END,
                  'isUnlimited', pl.is_unlimited
                )
                ORDER BY pl.display_name
              )
              FROM subscription_plan_limits pl
              WHERE pl.plan_id = p.id
            ),
            '[]'::jsonb
          ) AS limits

        FROM subscription_plans p
        WHERE p.id = $1
          AND p.is_active = true
          AND p.effective_from <= NOW()
          AND (
            p.effective_until IS NULL
            OR p.effective_until > NOW()
          )
        LIMIT 1
      `,
      [planId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Subscription plan was not found or is not currently available.",
      });
    }

    return res.status(200).json({
      success: true,
      plan: mapPlanRow(result.rows[0]),
    });
  } catch (error: any) {
    // PostgreSQL invalid UUID input.
    if (error?.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID.",
      });
    }

    console.error(
      "GET SUBSCRIPTION PLAN BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load the subscription plan.",
    });
  }
};
