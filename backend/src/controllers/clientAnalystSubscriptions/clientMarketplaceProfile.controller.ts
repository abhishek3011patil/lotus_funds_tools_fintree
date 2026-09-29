import type { Response } from "express";
import { pool } from "../../db";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { calculatePerformanceMetrics } from "../../services/performance.service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PerformanceCall = {
  id: string;
  action: string;
  entry_price: number | string;
  target_price: number | string;
  stop_loss: number | string;
  exit_price: number | string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
};

type PerformancePeriod = "monthly" | "yearly";

const getPerformance = async (raUserIds: string[], period: PerformancePeriod) => {
  if (raUserIds.length === 0) {
    return calculatePerformanceMetrics({
      createdThisMonth: [], exitedThisMonth: [], lastTenRows: [], activeCount: 0,
    });
  }

  const now = new Date();
  const startDate = period === "yearly"
    ? `${now.getUTCFullYear()}-01-01`
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const [callsResult, lastTenResult, activeResult] = await Promise.all([
    pool.query<PerformanceCall>(
      `SELECT id, action, entry_price, target_price, stop_loss, exit_price, status, created_at, closed_at
       FROM research_calls
       WHERE ra_user_id = ANY($1::uuid[]) AND COALESCE(is_latest, true) = true
         AND (created_at >= $2::date OR closed_at >= $2::date)`,
      [raUserIds, startDate]
    ),
    pool.query<PerformanceCall>(
      `SELECT id, action, entry_price, target_price, stop_loss, exit_price, status, created_at, closed_at
       FROM research_calls
       WHERE ra_user_id = ANY($1::uuid[]) AND COALESCE(is_latest, true) = true
         AND closed_at IS NOT NULL AND exit_price IS NOT NULL
       ORDER BY closed_at DESC LIMIT 10`,
      [raUserIds]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM research_calls
       WHERE ra_user_id = ANY($1::uuid[]) AND COALESCE(is_latest, true) = true
         AND closed_at IS NULL AND exit_price IS NULL`,
      [raUserIds]
    ),
  ]);

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(start);
  if (period === "yearly") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  const createdThisMonth = callsResult.rows.filter((call) => {
    const createdAt = new Date(call.created_at);
    return createdAt >= start && createdAt < end;
  });
  const exitedThisMonth = callsResult.rows.filter((call) => {
    if (!call.closed_at || call.exit_price === null) return false;
    const closedAt = new Date(call.closed_at);
    return closedAt >= start && closedAt < end;
  });

  return calculatePerformanceMetrics({
    createdThisMonth,
    exitedThisMonth,
    lastTenRows: lastTenResult.rows,
    activeCount: Number(activeResult.rows[0]?.count || 0),
  });
};

export const getClientAnalystProfile = async (req: AuthRequest, res: Response) => {
  const raUserId = String(req.params.raUserId || "");
  if (!UUID_PATTERN.test(raUserId)) return res.status(400).json({ message: "Invalid research analyst ID." });

  try {
    const period: PerformancePeriod = req.query.period === "yearly" ? "yearly" : "monthly";
    const result = await pool.query(
      `SELECT u.id,
         COALESCE(NULLIF(TRIM(CONCAT_WS(' ', rd.first_name, rd.surname)), ''), u.name) AS name,
         rd.org_name AS organization, rd.short_bio, rd.profile_image,
         rd.sebi_reg_no, rd.sebi_start_date, rd.sebi_expiry_date, rd.nism_reg_no,
         rd.market_experience, rd.expertise, rd.markets
       FROM users u JOIN ra_details rd ON rd.user_id = u.id
       WHERE u.id = $1 AND u.role = 'RESEARCH_ANALYST' AND u.status = 'active'
         AND COALESCE(u.is_active, false) = true AND rd.status = 'approved'`,
      [raUserId]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Research analyst not found." });

    const row = result.rows[0];
    const performance = await getPerformance([raUserId], period);
    return res.json({
      success: true,
      profile: {
        type: "analyst", id: row.id, name: row.name, organization: row.organization,
        shortBio: row.short_bio,
        profileImage: row.profile_image ? `/uploads/${String(row.profile_image).replace(/^[/\\]+/, "")}` : null,
        sebiRegistrationNumber: row.sebi_reg_no, registrationDate: row.sebi_start_date,
        registrationValidity: row.sebi_expiry_date, nismCertificateNumber: row.nism_reg_no,
        marketExperience: row.market_experience,
        expertise: row.expertise, markets: row.markets,
      },
      performancePeriod: period,
      performance,
    });
  } catch (error) {
    console.error("GET CLIENT ANALYST PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load the analyst profile." });
  }
};

export const getClientBrokerProfile = async (req: AuthRequest, res: Response) => {
  const brokerId = String(req.params.brokerId || "");
  if (!UUID_PATTERN.test(brokerId)) return res.status(400).json({ message: "Invalid broker ID." });

  try {
    const period: PerformancePeriod = req.query.period === "yearly" ? "yearly" : "monthly";
    const result = await pool.query(
      `SELECT b.id, b.legal_name, b.trade_name, b.entity_type, b.website,
         b.sebi_registration_no, b.registration_category, b.registration_date, b.registration_validity,
         CONCAT_WS(', ', CASE WHEN b.exchange_nse THEN 'NSE' END, CASE WHEN b.exchange_bse THEN 'BSE' END,
           CASE WHEN b.exchange_smi THEN 'SMI' END, CASE WHEN b.exchange_ncdex THEN 'NCDEX' END) AS exchanges,
         CONCAT_WS(', ', CASE WHEN b.segment_cash THEN 'Cash' END, CASE WHEN b.segment_fo THEN 'F&O' END,
           CASE WHEN b.segment_currency THEN 'Currency' END) AS segments,
         COALESCE(array_agg(ra.id) FILTER (WHERE ra.id IS NOT NULL), '{}') AS ra_user_ids,
         COALESCE(json_agg(json_build_object('id', rd.user_id, 'name',
           COALESCE(NULLIF(TRIM(CONCAT_WS(' ', rd.first_name, rd.surname)), ''), ra.name)))
           FILTER (WHERE ra.id IS NOT NULL), '[]') AS analysts
       FROM broker_details b JOIN users u ON u.id = b.user_id
       LEFT JOIN broker_research_analysts bra ON bra.broker_id = b.id AND bra.status = 'ACTIVE'
       LEFT JOIN ra_details rd ON rd.id = bra.ra_id AND rd.status = 'approved'
       LEFT JOIN users ra ON ra.id = rd.user_id AND ra.status = 'active' AND COALESCE(ra.is_active, false) = true
       WHERE b.id = $1 AND u.role = 'BROKER' AND u.status = 'active'
         AND COALESCE(u.is_active, false) = true AND lower(COALESCE(b.status, '')) = 'approved'
       GROUP BY b.id`,
      [brokerId]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Broker not found." });

    const row = result.rows[0];
    const raUserIds = (row.ra_user_ids || []).filter(Boolean);
    const performance = await getPerformance(raUserIds, period);
    return res.json({
      success: true,
      profile: {
        type: "broker", id: row.id, name: row.trade_name || row.legal_name,
        legalName: row.legal_name, entityType: row.entity_type, website: row.website,
        sebiRegistrationNumber: row.sebi_registration_no, category: row.registration_category,
        registrationDate: row.registration_date, registrationValidity: row.registration_validity,
        exchanges: row.exchanges, segments: row.segments, analysts: row.analysts,
      },
      performancePeriod: period,
      performance,
    });
  } catch (error) {
    console.error("GET CLIENT BROKER PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load the broker profile." });
  }
};
