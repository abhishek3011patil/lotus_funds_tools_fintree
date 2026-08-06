import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getClientRecommendations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    let query = `
      SELECT
        r.id,
        r.symbol AS stock_name,
        r.action AS recommendation_type,
        r.entry_price,
        r.target_price,
        r.stop_loss,
        r.status,
        r.created_at,
        r.rationale AS summary,
        r.research_remarks AS analyst_notes,
        r.call_type,
        r.trade_type,
        r.exchange_type,
        r.market_type,
        r.holding_period,

        u.id AS ra_id,
        u.name AS ra_name

      FROM research_calls r

      INNER JOIN users u
        ON u.id = r.ra_user_id
    `;

    const values: any[] = [];

    // Show only recommendations from subscribed RAs
 if (req.allowedRAIds && req.allowedRAIds.length > 0) {
  query += `
    WHERE r.ra_user_id = ANY($1)
  `;

  values.push(req.allowedRAIds);
}

    query += `
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      recommendations: result.rows,
    });
  }  catch (err: any) {
  console.error("ERROR:", err);
  console.error("MESSAGE:", err.message);
  console.error("DETAIL:", err.detail);
  console.error("STACK:", err.stack);

  return res.status(500).json({
    success: false,
    message: err.message,
  });
}
};