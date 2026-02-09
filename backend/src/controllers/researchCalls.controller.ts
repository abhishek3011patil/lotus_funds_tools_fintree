import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

/* =========================================================
   CREATE RESEARCH CALL  (POST /api/research/calls)
   ========================================================= */
export const createResearchCall = async (req: AuthRequest, res: Response) => {
    try {
        const {
            exchange_type,
            market_type,
            symbol,
            display_name,
            action,
            call_type,
            trade_type,
            expiry_date,
            entry_price,
            entry_price_low,
            entry_price_upper,
            target_price,
            target_price_2,
            target_price_3,
            stop_loss,
            stop_loss_2,
            stop_loss_3,
            holding_period,
            rationale,
            underlying_study,
            is_algo,
            has_vested_interest,
            research_remarks
        } = req.body;

        const query = `
      INSERT INTO research_calls (
        ra_user_id,
        status,

        exchange_type,
        market_type,

        symbol,
        display_name,

        action,
        call_type,
        trade_type,
        expiry_date,

        entry_price,
        entry_price_low,
        entry_price_upper,

        target_price,
        target_price_2,
        target_price_3,

        stop_loss,
        stop_loss_2,
        stop_loss_3,

        holding_period,
        rationale,
        underlying_study,

        is_algo,
        has_vested_interest,
        research_remarks
      )
      VALUES (
        $1, 'PUBLISHED',
        $2, $3,
        $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24
      )
      RETURNING id, created_at;
    `;

        const values = [
            req.user!.id,
            exchange_type,
            market_type,
            symbol,
            display_name,
            action,
            call_type,
            trade_type,
            expiry_date,
            entry_price,
            entry_price_low,
            entry_price_upper,
            target_price,
            target_price_2,
            target_price_3,
            stop_loss,
            stop_loss_2,
            stop_loss_3,
            holding_period,
            rationale,
            underlying_study,
            is_algo,
            has_vested_interest,
            research_remarks
        ];

        const { rows } = await pool.query(query, values);

        return res.status(201).json({
            message: "Research call created",
            id: rows[0].id,
            created_at: rows[0].created_at
        });
    } catch (err) {
        console.error("CREATE CALL ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/* =========================================================
   GET MY CALLS  (GET /api/research/calls/my)
   ========================================================= */
export const getMyCalls = async (req: AuthRequest, res: Response) => {
    try {
        const query = `
      SELECT
        id,
        status,
        created_at,

        exchange_type,
        market_type,

        symbol,
        display_name,

        action,
        call_type,
        trade_type,

        entry_price_low,
        entry_price,
        entry_price_upper,

        target_price,
        target_price_2,
        target_price_3,

        stop_loss,
        stop_loss_2,
        stop_loss_3,

        holding_period,
        rationale,
        underlying_study,

        is_algo,
        has_vested_interest,
        research_remarks
      FROM research_calls
      WHERE ra_user_id = $1
      ORDER BY created_at DESC;
    `;

        const { rows } = await pool.query(query, [req.user!.id]);

        const response = rows.map((row) => ({
            id: row.id,
            status: row.status,
            created_at: row.created_at,

            exchange: row.exchange_type,
            instrument: row.market_type,

            symbol: row.symbol,
            name: row.display_name,

            action: row.action,
            call_type: row.call_type,
            trade_type: row.trade_type,

            entry: {
                low: row.entry_price_low,
                ideal: row.entry_price,
                high: row.entry_price_upper
            },

            targets: [
                row.target_price,
                row.target_price_2,
                row.target_price_3
            ].filter(Boolean),

            stop_losses: [
                row.stop_loss,
                row.stop_loss_2,
                row.stop_loss_3
            ].filter(Boolean),

            holding_period: row.holding_period,
            rationale: row.rationale,
            underlying_study: row.underlying_study,

            flags: {
                algo: row.is_algo,
                vested_interest: row.has_vested_interest
            },

            remarks: row.research_remarks
        }));

        return res.json(response);
    } catch (err) {
        console.error("GET MY CALLS ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/* =========================================================
   GET PUBLISHED CALLS (GET /api/research/calls/published)
   ========================================================= */
export const getPublishedCalls = async (_req: AuthRequest, res: Response) => {
    try {
        const query = `
      SELECT
        id,
        status,
        created_at,

        exchange_type,
        market_type,

        symbol,
        display_name,

        action,
        call_type,
        trade_type,

        entry_price_low,
        entry_price,
        entry_price_upper,

        target_price,
        target_price_2,
        target_price_3,

        stop_loss,
        stop_loss_2,
        stop_loss_3,

        holding_period,
        rationale,
        underlying_study,

        is_algo,
        has_vested_interest,
        research_remarks
      FROM research_calls
      WHERE status = 'PUBLISHED'
      ORDER BY created_at DESC;
    `;

        const { rows } = await pool.query(query);

        const response = rows.map((row) => ({
            id: row.id,
            status: row.status,
            created_at: row.created_at,

            exchange: row.exchange_type,
            instrument: row.market_type,

            symbol: row.symbol,
            name: row.display_name,

            action: row.action,
            call_type: row.call_type,
            trade_type: row.trade_type,

            entry: {
                low: row.entry_price_low,
                ideal: row.entry_price,
                high: row.entry_price_upper
            },

            targets: [
                row.target_price,
                row.target_price_2,
                row.target_price_3
            ].filter(Boolean),

            stop_losses: [
                row.stop_loss,
                row.stop_loss_2,
                row.stop_loss_3
            ].filter(Boolean),

            holding_period: row.holding_period,
            rationale: row.rationale,
            underlying_study: row.underlying_study,

            flags: {
                algo: row.is_algo,
                vested_interest: row.has_vested_interest
            },

            remarks: row.research_remarks
        }));

        return res.json(response);
    } catch (err) {
        console.error("GET PUBLISHED CALLS ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
