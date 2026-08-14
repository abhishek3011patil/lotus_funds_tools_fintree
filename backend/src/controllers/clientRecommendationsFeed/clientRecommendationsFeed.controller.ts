import type { Response } from "express";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const safePositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getPagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasMore: page * limit < total,
});

const formatCall = (row: any, locked: boolean) => ({
  id: row.id,
  stockName: row.stock_name,
  displayName: row.display_name,
  recommendationType: row.recommendation_type,
  status: row.status,
  createdAt: row.created_at,
  callType: row.call_type,
  tradeType: row.trade_type,
  exchangeType: row.exchange_type,
  marketType: row.market_type,
  holdingPeriod: row.holding_period,
  raId: row.ra_id,
  raName: row.ra_name,
  raOrganization: row.ra_organization,
  locked,
  entryPrice: locked ? null : row.entry_price,
  entryPriceUpper: locked ? null : row.entry_price_upper,
  targetPrice: locked ? null : row.target_price,
  targetPrice2: locked ? null : row.target_price_2,
  targetPrice3: locked ? null : row.target_price_3,
  stopLoss: locked ? null : row.stop_loss,
  summary: locked ? null : row.summary,
  analystNotes: locked ? null : row.analyst_notes,
});

export const getClientRecommendationsFeed = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const subscribedPage = safePositiveInteger(req.query.subscribedPage, 1);
    const discoverPage = safePositiveInteger(req.query.discoverPage, 1);
    const limit = Math.min(safePositiveInteger(req.query.limit, 6), 24);
    const requestedStatus = String(req.query.status || "ALL").toUpperCase();
    const status = ["ALL", "PUBLISHED", "CLOSED"].includes(requestedStatus)
      ? requestedStatus
      : "ALL";
    const search = String(req.query.search || "").trim();
    const searchPattern = `%${search}%`;
    const raId = String(req.query.raId || "ALL");
    const action = String(req.query.action || "ALL").toUpperCase();
    const exchange = String(req.query.exchange || "ALL").toUpperCase();
    const subscribedOffset = (subscribedPage - 1) * limit;
    const discoverOffset = (discoverPage - 1) * limit;
    const allowedRAIds = Array.isArray(req.allowedRAIds)
      ? req.allowedRAIds
      : [];

    const baseFrom = `
      FROM research_calls research_call
      INNER JOIN users analyst ON analyst.id = research_call.ra_user_id
      INNER JOIN ra_details details ON details.user_id = analyst.id
      WHERE COALESCE(research_call.is_latest, true) = true
        AND analyst.role = 'RESEARCH_ANALYST'
        AND analyst.status = 'active'
        AND COALESCE(analyst.is_active, false) = true
        AND details.status = 'approved'
        AND ($2 = 'ALL' OR research_call.status = $2)
        AND (
          $3 = '' OR
          COALESCE(research_call.symbol, '') ILIKE $4 OR
          COALESCE(research_call.display_name, '') ILIKE $4 OR
          COALESCE(analyst.name, '') ILIKE $4 OR
          COALESCE(details.org_name, '') ILIKE $4
        )
        AND ($5 = 'ALL' OR research_call.ra_user_id::text = $5)
        AND ($6 = 'ALL' OR UPPER(COALESCE(research_call.action, '')) = $6)
        AND ($7 = 'ALL' OR UPPER(COALESCE(research_call.exchange_type, '')) = $7)`;

    const callFields = `
      SELECT
        research_call.id,
        research_call.symbol AS stock_name,
        research_call.display_name,
        research_call.action AS recommendation_type,
        research_call.status,
        research_call.created_at,
        research_call.call_type,
        research_call.trade_type,
        research_call.exchange_type,
        research_call.market_type,
        research_call.holding_period,
        research_call.entry_price,
        research_call.entry_price_upper,
        research_call.target_price,
        research_call.target_price_2,
        research_call.target_price_3,
        research_call.stop_loss,
        research_call.rationale AS summary,
        research_call.research_remarks AS analyst_notes,
        analyst.id AS ra_id,
        analyst.name AS ra_name,
        details.org_name AS ra_organization`;

    const [
      subscribedCountResult,
      subscribedCallsResult,
      discoverCountResult,
      discoverCallsResult,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         ${baseFrom}
         AND research_call.ra_user_id = ANY($1::uuid[])`,
        [allowedRAIds, status, search, searchPattern, raId, action, exchange]
      ),
      pool.query(
        `${callFields}
         ${baseFrom}
         AND research_call.ra_user_id = ANY($1::uuid[])
         ORDER BY research_call.created_at DESC
         LIMIT $8 OFFSET $9`,
        [allowedRAIds, status, search, searchPattern, raId, action, exchange, limit, subscribedOffset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         ${baseFrom}
         AND NOT (research_call.ra_user_id = ANY($1::uuid[]))`,
        [allowedRAIds, status, search, searchPattern, raId, action, exchange]
      ),
      pool.query(
        `${callFields}
         ${baseFrom}
         AND NOT (research_call.ra_user_id = ANY($1::uuid[]))
         ORDER BY research_call.created_at DESC
         LIMIT $8 OFFSET $9`,
        [allowedRAIds, status, search, searchPattern, raId, action, exchange, limit, discoverOffset]
      ),
    ]);

    const filtersResult = await pool.query(
      `SELECT
         analyst.id,
         analyst.name,
         details.org_name AS organization
       FROM users analyst
       INNER JOIN ra_details details ON details.user_id = analyst.id
       WHERE analyst.role = 'RESEARCH_ANALYST'
         AND analyst.status = 'active'
         AND COALESCE(analyst.is_active, false) = true
         AND details.status = 'approved'
         AND analyst.id = ANY($1::uuid[])
         AND EXISTS (
           SELECT 1 FROM research_calls research_call
           WHERE research_call.ra_user_id = analyst.id
             AND COALESCE(research_call.is_latest, true) = true
         )
       ORDER BY analyst.name`,
      [allowedRAIds]
    );

    const subscribedTotal = Number(
      subscribedCountResult.rows[0]?.total || 0
    );
    const discoverTotal = Number(discoverCountResult.rows[0]?.total || 0);

    return res.status(200).json({
      success: true,
      subscribed: {
        items: subscribedCallsResult.rows.map((row) => formatCall(row, false)),
        pagination: getPagination(subscribedPage, limit, subscribedTotal),
      },
      discover: {
        items: discoverCallsResult.rows.map((row) => formatCall(row, true)),
        pagination: getPagination(discoverPage, limit, discoverTotal),
      },
      filters: {
        analysts: filtersResult.rows,
      },
    });
  } catch (error) {
    console.error("CLIENT RECOMMENDATIONS FEED ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load recent recommendations.",
    });
  }
};
