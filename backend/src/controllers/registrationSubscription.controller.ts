import crypto from "crypto";
import type { Request, Response } from "express";
import { pool } from "../db";

const SELECTABLE_REGISTRATION_STATUSES = new Set([
  "FORM_SUBMITTED",
  "PLAN_SELECTED",
  "PAYMENT_FAILED",
]);

const hashRegistrationToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const secureHashEquals = (
  storedHash: string,
  suppliedHash: string
): boolean => {
  const stored = Buffer.from(storedHash, "hex");
  const supplied = Buffer.from(suppliedHash, "hex");

  return (
    stored.length === supplied.length &&
    crypto.timingSafeEqual(stored, supplied)
  );
};

const getRegistrationToken = (
  req: Request
): string | null => {
  const headerValue = req.header("x-registration-token");

  if (!headerValue) {
    return null;
  }

  const token = headerValue.trim();

  return token.length > 0 ? token : null;
};

/**
 * POST /api/registration/:applicationId/select-plan
 *
 * Headers:
 * x-registration-token: token returned by register-ra/register-broker
 *
 * Body:
 * {
 *   "planId": "uuid"
 * }
 */
export const selectRegistrationPlan = async (
  req: Request,
  res: Response
) => {
  const { applicationId } = req.params;
  const planId =
    typeof req.body?.planId === "string"
      ? req.body.planId.trim()
      : "";

  const registrationToken = getRegistrationToken(req);

  if (!applicationId) {
    return res.status(400).json({
      success: false,
      message: "Registration application ID is required.",
    });
  }

  if (!planId) {
    return res.status(400).json({
      success: false,
      message: "planId is required.",
    });
  }

  if (!registrationToken) {
    return res.status(401).json({
      success: false,
      message: "Registration token is required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `
        SELECT
          id,
          applicant_type,
          status,
          registration_token_hash,
          registration_token_expires_at
        FROM registration_applications
        WHERE id = $1
        FOR UPDATE
      `,
      [applicationId]
    );

    if (applicationResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Registration application was not found.",
      });
    }

    const application = applicationResult.rows[0];

    if (
      !application.registration_token_hash ||
      !application.registration_token_expires_at
    ) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        success: false,
        message:
          "This registration does not have a valid access token.",
      });
    }

    const suppliedTokenHash =
      hashRegistrationToken(registrationToken);

    if (
      !secureHashEquals(
        application.registration_token_hash,
        suppliedTokenHash
      )
    ) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        success: false,
        message: "Invalid registration token.",
      });
    }

    if (
      new Date(application.registration_token_expires_at).getTime() <=
      Date.now()
    ) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        success: false,
        message:
          "Registration token has expired. Restart or resume registration.",
      });
    }

    if (
      !SELECTABLE_REGISTRATION_STATUSES.has(application.status)
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "The subscription plan can no longer be changed at this registration stage.",
        registrationStatus: application.status,
      });
    }

    /*
     * The selected plan must be:
     * - active;
     * - currently effective;
     * - the latest effective version for its audience and tier.
     */
    const planResult = await client.query(
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
          WHERE p.is_active = true
            AND p.effective_from <= NOW()
            AND (
              p.effective_until IS NULL
              OR p.effective_until > NOW()
            )
        )
        SELECT
          id,
          plan_code,
          audience_type,
          tier_code,
          display_name,
          price_paise,
          currency,
          duration_days,
          version
        FROM ranked_plans
        WHERE id = $1
          AND row_number = 1
        LIMIT 1
      `,
      [planId]
    );

    if (planResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "The selected plan was not found or is no longer available.",
      });
    }

    const plan = planResult.rows[0];

    if (plan.audience_type !== application.applicant_type) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `${application.applicant_type} registrations can only select ${application.applicant_type} plans.`,
      });
    }

    // Preserve selection history while ensuring only one current selection.
    await client.query(
      `
        UPDATE registration_plan_selections
        SET replaced_at = NOW()
        WHERE registration_application_id = $1
          AND replaced_at IS NULL
      `,
      [applicationId]
    );

    const selectionResult = await client.query(
      `
        INSERT INTO registration_plan_selections (
          registration_application_id,
          plan_id,
          plan_code_snapshot,
          plan_name_snapshot,
          audience_type_snapshot,
          tier_code_snapshot,
          price_paise_snapshot,
          currency_snapshot,
          duration_days_snapshot,
          plan_version_snapshot
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        )
        RETURNING
          id,
          registration_application_id,
          plan_id,
          plan_code_snapshot,
          plan_name_snapshot,
          audience_type_snapshot,
          tier_code_snapshot,
          price_paise_snapshot,
          currency_snapshot,
          duration_days_snapshot,
          plan_version_snapshot,
          selected_at
      `,
      [
        applicationId,
        plan.id,
        plan.plan_code,
        plan.display_name,
        plan.audience_type,
        plan.tier_code,
        Number(plan.price_paise),
        plan.currency,
        Number(plan.duration_days),
        Number(plan.version),
      ]
    );

    await client.query(
      `
        UPDATE registration_applications
        SET status = 'PLAN_SELECTED'
        WHERE id = $1
      `,
      [applicationId]
    );

    await client.query("COMMIT");

    const selection = selectionResult.rows[0];

    return res.status(200).json({
      success: true,
      message: "Subscription plan selected successfully.",
      registrationStatus: "PLAN_SELECTED",
      selection: {
        id: selection.id,
        applicationId:
          selection.registration_application_id,
        planId: selection.plan_id,
        planCode: selection.plan_code_snapshot,
        displayName: selection.plan_name_snapshot,
        audienceType: selection.audience_type_snapshot,
        tierCode: selection.tier_code_snapshot,
        price: {
          amountPaise: Number(
            selection.price_paise_snapshot
          ),
          amountRupees:
            Number(selection.price_paise_snapshot) / 100,
          currency: selection.currency_snapshot,
        },
        durationDays: Number(
          selection.duration_days_snapshot
        ),
        planVersion: Number(
          selection.plan_version_snapshot
        ),
        selectedAt: selection.selected_at,
      },
      nextStep: "CREATE_PAYMENT_ORDER",
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

    if (error?.code === "22P02") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid registration application ID or plan ID.",
      });
    }

    console.error(
      "SELECT REGISTRATION PLAN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to select the subscription plan.",
    });
  } finally {
    client.release();
  }
};
