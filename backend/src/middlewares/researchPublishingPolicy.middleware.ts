import type {
  NextFunction,
  Response,
} from "express";
import { pool } from "../db";
import type { AuthRequest } from "./auth.middleware";

type PublishingActor = {
  role: string;
  user_status: string;
  is_active: boolean;
  ra_status: string | null;
  sebi_reg_no: string | null;
  sebi_expiry_date: string | null;
  sebi_is_valid: boolean;
  nism_reg_no: string | null;
  nism_valid_till: string | null;
  nism_certificate: string | null;
  nism_is_valid: boolean;
  has_publish_entitlement: boolean;
};

const deny = (
  res: Response,
  code: string,
  message: string
): void => {
  res.status(403).json({
    success: false,
    code,
    message,
  });
};

/**
 * Authoritative, deny-by-default policy for research publishing.
 *
 * Role, account state, RA approval, SEBI validity, and plan entitlement
 * are read from the database. JWT claims and request-supplied plan data
 * are deliberately not used to make the authorization decision.
 */
export const requireResearchPublishingAuthorization =
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      });
      return;
    }

    try {
      const result = await pool.query<PublishingActor>(
        `
          SELECT
            account.role,
            account.status AS user_status,
            account.is_active,
            ra.status AS ra_status,
            ra.sebi_reg_no,
            ra.sebi_expiry_date,
            (
              ra.sebi_expiry_date IS NOT NULL
              AND ra.sebi_expiry_date >= CURRENT_DATE
            ) AS sebi_is_valid,
            ra.nism_reg_no,
            ra.nism_valid_till,
            ra.nism_certificate,
            (
              ra.nism_valid_till IS NOT NULL
              AND ra.nism_valid_till >= CURRENT_DATE
            ) AS nism_is_valid,
            EXISTS (
              SELECT 1
              FROM subscriptions subscription
              INNER JOIN subscription_plans plan
                ON plan.id = subscription.plan_id
              INNER JOIN subscription_plan_features plan_feature
                ON plan_feature.plan_id = plan.id
              INNER JOIN subscription_features feature
                ON feature.id = plan_feature.feature_id
              WHERE subscription.user_id = account.id
                AND subscription.status = 'ACTIVE'
                AND subscription.starts_at IS NOT NULL
                AND subscription.starts_at <= NOW()
                AND subscription.expires_at IS NOT NULL
                AND subscription.expires_at > NOW()
                AND plan.audience_type = 'RA'
                AND plan.is_active = TRUE
                AND feature.feature_key = 'RA_RESEARCH_CALLS'
                AND feature.is_active = TRUE
                AND plan_feature.is_enabled = TRUE
            ) AS has_publish_entitlement
          FROM users account
          LEFT JOIN ra_details ra
            ON ra.user_id = account.id
          WHERE account.id = $1
          LIMIT 1
        `,
        [userId]
      );

      const actor = result.rows[0];

      if (!actor) {
        deny(
          res,
          "PUBLISH_NOT_AUTHORIZED",
          "Research publishing is not authorized."
        );
        return;
      }

      if (actor.role !== "RESEARCH_ANALYST") {
        deny(
          res,
          "RA_ROLE_REQUIRED",
          "Only research analysts may publish research."
        );
        return;
      }

      if (
        actor.user_status?.toLowerCase() !==
          "active" ||
        actor.is_active !== true
      ) {
        deny(
          res,
          "ACCOUNT_NOT_ACTIVE",
          "An active account is required."
        );
        return;
      }

      if (
        actor.ra_status?.toLowerCase() !==
        "approved"
      ) {
        deny(
          res,
          "RA_NOT_APPROVED",
          "Research analyst approval is required."
        );
        return;
      }

      if (!actor.sebi_reg_no?.trim()) {
        deny(
          res,
          "SEBI_VERIFICATION_REQUIRED",
          "Valid SEBI registration is required."
        );
        return;
      }

      if (
        !actor.sebi_expiry_date ||
        actor.sebi_is_valid !== true
      ) {
        deny(
          res,
          "SEBI_REGISTRATION_EXPIRED",
          "SEBI registration has expired."
        );
        return;
      }

      if (
        !actor.nism_reg_no?.trim() ||
        !actor.nism_certificate?.trim()
      ) {
        deny(
          res,
          "NISM_VERIFICATION_REQUIRED",
          "Valid NISM certification is required."
        );
        return;
      }

      if (
        !actor.nism_valid_till ||
        actor.nism_is_valid !== true
      ) {
        deny(
          res,
          "NISM_CERTIFICATION_EXPIRED",
          "NISM certification has expired."
        );
        return;
      }

      if (
        actor.has_publish_entitlement !== true
      ) {
        deny(
          res,
          "PUBLISH_ENTITLEMENT_REQUIRED",
          "The active RA plan does not permit research publishing."
        );
        return;
      }

      // Downstream middleware must use the current database role,
      // not a potentially stale role embedded in the JWT.
      req.user!.role = actor.role;
      next();
    } catch (error) {
      console.error(
        "RESEARCH PUBLISH POLICY ERROR:",
        error
      );

      res.status(503).json({
        success: false,
        code:
          "PUBLISH_AUTHORIZATION_UNAVAILABLE",
        message:
          "Publishing authorization could not be verified.",
      });
    }
  };
