import crypto from "crypto";
import { pool } from "../db";

export const hashBrokerInvitation = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export class InvalidBrokerInvitation extends Error {}

// Registration, association and single-use token consumption must succeed together.
export const registerRAWithBrokerInvitation = async (
  sql: string, values: unknown[], token: unknown, email: string
) => {
  if (!token) return pool.query(sql, values);
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    throw new InvalidBrokerInvitation("Invalid broker registration link.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invitation = await client.query(
      `SELECT * FROM broker_ra_invitations
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`, [hashBrokerInvitation(token)]
    );
    const invite = invitation.rows[0];
    if (!invite || (invite.email && invite.email !== email)) {
      throw new InvalidBrokerInvitation("Registration link is expired, already used, or belongs to another email address.");
    }
    const result = await client.query(sql, values);
    const raId = result.rows[0].ra_id;
    await client.query(
      `INSERT INTO broker_research_analysts (broker_id, ra_id, onboarding_method, status)
       VALUES ($1, $2, $3, 'PENDING')`, [invite.broker_id, raId, invite.onboarding_method]
    );
    await client.query(
      `INSERT INTO subscription_notifications (user_id, notification_key, type, title, message)
       SELECT broker.user_id, CONCAT('BROKER_RA_REGISTRATION:', $2::text),
         'New Research Analyst', 'Research Analyst registration received',
         CONCAT(COALESCE(NULLIF(CONCAT_WS(' ', ra.first_name, ra.surname), ''), 'A Research Analyst'),
           ' completed registration through your invitation and is pending onboarding.')
       FROM broker_details broker
       JOIN ra_details ra ON ra.id = $2
       WHERE broker.id = $1
       ON CONFLICT DO NOTHING`,
      [invite.broker_id, raId]
    );
    await client.query(
      "UPDATE broker_ra_invitations SET used_at = now(), ra_id = $2 WHERE id = $1",
      [invite.id, raId]
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
