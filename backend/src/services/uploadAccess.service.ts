import { pool } from "../db";

interface UploadAccessRequest {
  filename: string;
  userId: string;
  role: string;
}

/**
 * Authorizes files without exposing the uploads directory as static content.
 * Profile pictures are visible to signed-in users. Registration documents
 * remain owner-only. Research-call media is visible to the author and to an
 * active broker associated with that RA, or an entitled client in the call's
 * selected audience, when the latest call is publishable.
 */
export const canAccessUploadedFile = async ({
  filename,
  userId,
  role,
}: UploadAccessRequest): Promise<boolean> => {
  const result = await pool.query(
    `SELECT (
       EXISTS (
         SELECT 1 FROM ra_details
         WHERE profile_image = $1
       )
       OR EXISTS (
         SELECT 1 FROM client_profiles
         WHERE profile_image = $1
       )
       OR EXISTS (
         SELECT 1 FROM broker_details
         WHERE profile_image = $1
       )
       OR EXISTS (
         SELECT 1 FROM ra_details
         WHERE user_id = $2
           AND $1 IN (
             pan_card,
             address_proof_document,
             sebi_certificate,
             sebi_receipt,
             nism_certificate,
             cancelled_cheque
           )
       )
       OR EXISTS (
         SELECT 1
         FROM insight_content_images image
         WHERE image.filename = $1
           AND (
             image.owner_user_id = $2
             OR (
               $3 = 'CLIENT'
               AND EXISTS (
                 SELECT 1
                 FROM insight_content content
                 JOIN users publisher ON publisher.id = content.author_user_id
                 WHERE content.author_user_id = image.owner_user_id
                   AND content.status = 'PUBLISHED'
                   AND content.article_body LIKE '%' || image.filename || '%'
                   AND (
                     content.visibility = 'PUBLIC'
                     OR (
                       publisher.role = 'RESEARCH_ANALYST'
                       AND EXISTS (
                         SELECT 1 FROM client_ra_subscriptions subscription
                         WHERE subscription.client_user_id = $2
                           AND subscription.ra_user_id = content.author_user_id
                           AND subscription.status = 'ACTIVE'
                           AND subscription.expires_at > NOW()
                       )
                     )
                     OR (
                       publisher.role = 'BROKER'
                       AND EXISTS (
                         SELECT 1 FROM client_broker_subscriptions subscription
                         JOIN broker_details subscribed_broker ON subscribed_broker.id = subscription.broker_id
                         WHERE subscription.client_user_id = $2
                           AND subscribed_broker.user_id = content.author_user_id
                           AND subscription.status = 'ACTIVE'
                           AND subscription.expires_at > NOW()
                       )
                     )
                   )
               )
             )
           )
       )
       OR EXISTS (
         SELECT 1
         FROM research_calls rc
         WHERE (
           regexp_replace(replace(COALESCE(rc.file_url, ''), chr(92), '/'), '^.*/', '') = $1
           OR EXISTS (
             SELECT 1
             FROM jsonb_array_elements(COALESCE(rc.attachments, '[]'::jsonb)) attachment
             WHERE regexp_replace(
               replace(COALESCE(attachment->>'url', ''), chr(92), '/'),
               '^.*/',
               ''
             ) = $1
           )
         )
         AND (
           rc.ra_user_id = $2
           OR (
             $3 = 'BROKER'
             AND rc.status IN ('PUBLISHED', 'CLOSED')
             AND rc.is_latest IS TRUE
             AND EXISTS (
               SELECT 1
               FROM ra_details ra
               JOIN broker_research_analysts link ON link.ra_id = ra.id
               JOIN broker_details broker ON broker.id = link.broker_id
               JOIN users broker_user ON broker_user.id = broker.user_id
               WHERE ra.user_id = rc.ra_user_id
                 AND broker.user_id = $2
                 AND link.status = 'ACTIVE'
                 AND broker_user.is_active = true
             )
           )
          OR (
            $3 = 'CLIENT'
            AND rc.status IN ('PUBLISHED', 'CLOSED')
            AND COALESCE(rc.is_latest, true) = true
            AND EXISTS (
              SELECT 1 FROM users analyst
              JOIN ra_details ra ON ra.user_id = analyst.id
              WHERE analyst.id = rc.ra_user_id
                AND analyst.role = 'RESEARCH_ANALYST'
                AND analyst.status = 'active'
                AND COALESCE(analyst.is_active, false) = true
                AND ra.status = 'approved'
            )
            AND (
              COALESCE(rc.audience_mode, 'ALL_CONNECTED') = 'ALL_CONNECTED'
              OR rc.audience_recipient_snapshot @> jsonb_build_array(
                jsonb_build_object('type', 'CLIENT', 'id', $2::text)
              )
            )
            AND (
              EXISTS (
                SELECT 1 FROM client_ra_subscriptions subscription
                WHERE subscription.client_user_id = $2
                  AND subscription.ra_user_id = rc.ra_user_id
                  AND subscription.status = 'ACTIVE'
                  AND subscription.expires_at > NOW()
              )
              OR EXISTS (
                SELECT 1 FROM client_broker_subscriptions subscription
                JOIN broker_details broker ON broker.id = subscription.broker_id
                JOIN subscriptions broker_platform_subscription
                  ON broker_platform_subscription.user_id = broker.user_id
                 AND broker_platform_subscription.status = 'ACTIVE'
                 AND broker_platform_subscription.starts_at <= NOW()
                 AND broker_platform_subscription.expires_at > NOW()
                JOIN subscription_plans broker_plan
                  ON broker_plan.id = broker_platform_subscription.plan_id
                 AND broker_plan.audience_type = 'BROKER'
                JOIN broker_research_analysts link
                  ON link.broker_id = subscription.broker_id AND link.status = 'ACTIVE'
                JOIN ra_details ra ON ra.id = link.ra_id
                WHERE subscription.client_user_id = $2
                  AND ra.user_id = rc.ra_user_id
                  AND subscription.status = 'ACTIVE'
                  AND subscription.expires_at > NOW()
              )
            )
          )
         )
       )
     ) AS allowed`,
    [filename, userId, role],
  );

  return result.rows[0]?.allowed === true;
};
