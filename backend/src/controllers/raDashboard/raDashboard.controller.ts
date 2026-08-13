import type { Response } from "express";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const readPositiveInteger = (
  value: unknown,
  fallback: number,
  maximum: number
) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};

const allowedStatuses = new Set(["ACTIVE", "EXPIRED", "ALL"]);

export const getRaDashboardSummary = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT client_user_id) FILTER (
           WHERE status = 'ACTIVE' AND expires_at > NOW()
         )::int AS active_clients,
         COUNT(DISTINCT client_user_id) FILTER (
           WHERE status = 'ACTIVE'
             AND expires_at > NOW()
             AND subscribed_at >= DATE_TRUNC('month', CURRENT_DATE)
         )::int AS new_clients_this_month,
         COUNT(DISTINCT client_user_id) FILTER (
           WHERE subscribed_at IS NOT NULL
         )::int AS lifetime_clients
       FROM client_ra_subscriptions
       WHERE ra_user_id = $1`,
      [req.user!.id]
    );

    const row = result.rows[0] || {};
    return res.status(200).json({
      success: true,
      summary: {
        activeClients: Number(row.active_clients || 0),
        newClientsThisMonth: Number(row.new_clients_this_month || 0),
        lifetimeClients: Number(row.lifetime_clients || 0),
      },
    });
  } catch (error) {
    console.error("RA DASHBOARD SUMMARY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load subscribed client totals.",
    });
  }
};

export const listRaSubscribedClients = async (
  req: AuthRequest,
  res: Response
) => {
  const page = readPositiveInteger(req.query.page, 1, 100000);
  const limit = readPositiveInteger(req.query.limit, 10, 50);
  const search = String(req.query.search || "").trim();
  const requestedStatus = String(req.query.status || "ACTIVE").toUpperCase();
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "ACTIVE";
  const offset = (page - 1) * limit;

  const conditions = ["subscription.ra_user_id = $1"];
  const values: unknown[] = [req.user!.id];

  if (status === "ACTIVE") {
    conditions.push("subscription.status = 'ACTIVE'", "subscription.expires_at > NOW()");
  } else if (status === "EXPIRED") {
    conditions.push(
      "(subscription.status = 'EXPIRED' OR (subscription.status = 'ACTIVE' AND subscription.expires_at <= NOW()))"
    );
  } else {
    conditions.push("subscription.subscribed_at IS NOT NULL");
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(COALESCE(client.name, '') ILIKE $${values.length} OR COALESCE(client.email, '') ILIKE $${values.length})`
    );
  }

  const whereSql = conditions.join(" AND ");

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM client_ra_subscriptions subscription
       INNER JOIN users client ON client.id = subscription.client_user_id
       WHERE ${whereSql}`,
      values
    );

    const listValues = [...values, limit, offset];
    const result = await pool.query(
      `SELECT
         subscription.id,
         subscription.client_user_id,
         client.name,
         client.email,
         CASE
           WHEN subscription.status = 'ACTIVE' AND subscription.expires_at <= NOW()
             THEN 'EXPIRED'
           ELSE subscription.status
         END AS status,
         subscription.starts_at,
         subscription.expires_at,
         subscription.subscribed_at
       FROM client_ra_subscriptions subscription
       INNER JOIN users client ON client.id = subscription.client_user_id
       WHERE ${whereSql}
       ORDER BY subscription.subscribed_at DESC NULLS LAST, client.name ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues
    );

    const total = Number(countResult.rows[0]?.total || 0);
    return res.status(200).json({
      success: true,
      clients: result.rows.map((row) => ({
        id: row.client_user_id,
        subscriptionId: row.id,
        name: row.name || "Client",
        email: row.email || null,
        status: row.status,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        subscribedAt: row.subscribed_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("RA SUBSCRIBED CLIENT LIST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load subscribed clients.",
    });
  }
};
