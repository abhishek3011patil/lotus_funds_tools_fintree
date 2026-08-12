import type { Response } from "express";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const formatCall = (row: any) => ({
  id: row.id,
  stockName: row.display_name || row.symbol,
  symbol: row.symbol,
  recommendationType: row.action,
  status: row.status,
  createdAt: row.created_at,
  entryPrice: row.entry_price,
  targetPrice: row.target_price,
  stopLoss: row.stop_loss,
  raId: row.ra_id,
  raName: row.ra_name,
  raOrganization: row.ra_organization,
});

export const getClientDashboard = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const clientUserId = req.user!.id;

    await pool.query(
      `UPDATE client_ra_subscriptions
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE client_user_id = $1
         AND status = 'ACTIVE'
         AND expires_at <= NOW()`,
      [clientUserId]
    );

    const [
      summaryResult,
      subscriptionsResult,
      recentCallsResult,
      expiringResult,
      discoverResult,
      notificationsResult,
    ] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(DISTINCT subscription.ra_user_id)::int AS subscribed_ra_count,
           COUNT(DISTINCT subscription.ra_user_id)
             FILTER (WHERE subscription.expires_at <= NOW() + INTERVAL '30 days')::int
             AS expiring_soon_count,
           COUNT(DISTINCT research_call.id)
             FILTER (WHERE research_call.created_at::date = CURRENT_DATE)::int
             AS new_calls_today,
           COUNT(DISTINCT research_call.id)
             FILTER (WHERE research_call.status = 'PUBLISHED')::int
             AS active_calls
         FROM client_ra_subscriptions subscription
         LEFT JOIN research_calls research_call
           ON research_call.ra_user_id = subscription.ra_user_id
          AND COALESCE(research_call.is_latest, true) = true
         WHERE subscription.client_user_id = $1
           AND subscription.status = 'ACTIVE'
           AND subscription.expires_at > NOW()`,
        [clientUserId]
      ),
      pool.query(
        `SELECT
           subscription.ra_user_id AS id,
           COALESCE(NULLIF(TRIM(CONCAT_WS(' ', details.first_name, details.surname)), ''), analyst.name) AS name,
           details.org_name AS organization,
           details.profile_image,
           subscription.expires_at
         FROM client_ra_subscriptions subscription
         INNER JOIN users analyst ON analyst.id = subscription.ra_user_id
         INNER JOIN ra_details details ON details.user_id = analyst.id
         WHERE subscription.client_user_id = $1
           AND subscription.status = 'ACTIVE'
           AND subscription.expires_at > NOW()
         ORDER BY subscription.subscribed_at DESC
         LIMIT 5`,
        [clientUserId]
      ),
      pool.query(
        `SELECT
           research_call.id,
           research_call.symbol,
           research_call.display_name,
           research_call.action,
           research_call.status,
           research_call.created_at,
           research_call.entry_price,
           research_call.target_price,
           research_call.stop_loss,
           analyst.id AS ra_id,
           analyst.name AS ra_name,
           details.org_name AS ra_organization
         FROM research_calls research_call
         INNER JOIN client_ra_subscriptions subscription
           ON subscription.ra_user_id = research_call.ra_user_id
          AND subscription.client_user_id = $1
          AND subscription.status = 'ACTIVE'
          AND subscription.expires_at > NOW()
         INNER JOIN users analyst ON analyst.id = research_call.ra_user_id
         INNER JOIN ra_details details ON details.user_id = analyst.id
         WHERE COALESCE(research_call.is_latest, true) = true
         ORDER BY research_call.created_at DESC
         LIMIT 6`,
        [clientUserId]
      ),
      pool.query(
        `SELECT
           subscription.id,
           subscription.ra_user_id,
           analyst.name AS ra_name,
           details.org_name AS organization,
           subscription.expires_at,
           GREATEST(0, CEIL(EXTRACT(EPOCH FROM (subscription.expires_at - NOW())) / 86400))::int
             AS days_remaining
         FROM client_ra_subscriptions subscription
         INNER JOIN users analyst ON analyst.id = subscription.ra_user_id
         INNER JOIN ra_details details ON details.user_id = analyst.id
         WHERE subscription.client_user_id = $1
           AND subscription.status = 'ACTIVE'
           AND subscription.expires_at > NOW()
           AND subscription.expires_at <= NOW() + INTERVAL '30 days'
         ORDER BY subscription.expires_at
         LIMIT 4`,
        [clientUserId]
      ),
      pool.query(
        `SELECT
           analyst.id,
           COALESCE(NULLIF(TRIM(CONCAT_WS(' ', details.first_name, details.surname)), ''), analyst.name) AS name,
           details.org_name AS organization,
           details.profile_image,
           details.sebi_reg_no,
           details.expertise,
           details.markets,
           details.short_bio
         FROM users analyst
         INNER JOIN ra_details details ON details.user_id = analyst.id
         WHERE analyst.role = 'RESEARCH_ANALYST'
           AND analyst.status = 'active'
           AND COALESCE(analyst.is_active, false) = true
           AND details.status = 'approved'
           AND NOT EXISTS (
             SELECT 1
             FROM client_ra_subscriptions subscription
             WHERE subscription.client_user_id = $1
               AND subscription.ra_user_id = analyst.id
               AND subscription.status = 'ACTIVE'
               AND subscription.expires_at > NOW()
           )
         ORDER BY (
           SELECT COUNT(*)
           FROM research_calls research_call
           WHERE research_call.ra_user_id = analyst.id
         ) DESC, analyst.name
         LIMIT 3`,
        [clientUserId]
      ),
      pool.query(
        `SELECT id, type, title, message, is_read, created_at
         FROM subscription_notifications
         WHERE user_id = $1
           AND COALESCE(is_deleted, false) = false
         ORDER BY created_at DESC
         LIMIT 5`,
        [clientUserId]
      ),
    ]);

    const unreadResult = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM subscription_notifications
       WHERE user_id = $1
         AND COALESCE(is_deleted, false) = false
         AND COALESCE(is_read, false) = false`,
      [clientUserId]
    );

    const summary = summaryResult.rows[0] || {};
    return res.status(200).json({
      success: true,
      summary: {
        subscribedRaCount: Number(summary.subscribed_ra_count || 0),
        newCallsToday: Number(summary.new_calls_today || 0),
        activeCalls: Number(summary.active_calls || 0),
        unreadNotifications: Number(unreadResult.rows[0]?.unread_count || 0),
        expiringSoonCount: Number(summary.expiring_soon_count || 0),
      },
      subscriptions: subscriptionsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        organization: row.organization,
        profileImage: row.profile_image
          ? `/uploads/${String(row.profile_image).replace(/^[/\\]+/, "")}`
          : null,
        expiresAt: row.expires_at,
      })),
      recentCalls: recentCallsResult.rows.map(formatCall),
      expiringSubscriptions: expiringResult.rows.map((row) => ({
        id: row.id,
        raId: row.ra_user_id,
        raName: row.ra_name,
        organization: row.organization,
        expiresAt: row.expires_at,
        daysRemaining: Number(row.days_remaining),
      })),
      discoverAnalysts: discoverResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        organization: row.organization,
        profileImage: row.profile_image
          ? `/uploads/${String(row.profile_image).replace(/^[/\\]+/, "")}`
          : null,
        sebiRegistrationNumber: row.sebi_reg_no,
        expertise: row.expertise,
        markets: row.markets,
        shortBio: row.short_bio,
      })),
      notifications: notificationsResult.rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("CLIENT DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load the client dashboard.",
    });
  }
};
