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
 * active broker associated with that RA when the latest call is publishable.
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
         )
       )
     ) AS allowed`,
    [filename, userId, role],
  );

  return result.rows[0]?.allowed === true;
};
