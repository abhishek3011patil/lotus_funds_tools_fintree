import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Router } from "express";



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
export const getResearchCalls = async (req: AuthRequest, res: Response) => {
    console.log("Logged in user:", req.user);

    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const query = `
  SELECT *
  FROM research_calls
  WHERE ra_user_id = $1
  AND is_latest = true
  ORDER BY created_at DESC
`;

        const { rows } = await pool.query(query, [req.user.id]);

        const formatted = rows.map((row) => ({
            id: row.id,
            status: row.status,
            created_at: row.created_at,

            exchange: row.exchange_type,
            instrument: row.market_type,


            version_type: row.version_type,
            parent_call_id: row.parent_call_id,

            symbol: row.symbol,
            name: row.display_name,

            action: row.action,
            call_type: row.call_type,
            trade_type: row.trade_type,

            expiry_date: row.expiry_date,

            entry: {
                low: row.entry_price_low,
                ideal: row.entry_price,
                high: row.entry_price_upper,
            },

            targets: [
                row.target_price,
                row.target_price_2,
                row.target_price_3,
            ].filter(Boolean),

            stop_losses: [
                row.stop_loss,
                row.stop_loss_2,
                row.stop_loss_3,
            ].filter(Boolean),

            holding_period: row.holding_period,
            rationale: row.rationale,
            underlying_study: row.underlying_study,

            flags: {
                algo: row.is_algo,
                vested_interest: row.has_vested_interest,
            },

            remarks: row.research_remarks,
        }));

        return res.json(formatted);
    } catch (err) {
        console.error("GET MY CALLS ERROR:", err);
        return res.status(500).json({ message: "Server Error" });
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

/* =========================================================
   CREATE ERRATA (POST /api/research/calls/errata)
   ========================================================= */


export const createErrata = async (

    req: AuthRequest,
    res: Response
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { call_id, updates } = req.body;
        const userId = req.user?.id;

        // 1️⃣ Get existing call
        const callResult = await client.query(
            `SELECT * FROM research_calls
       WHERE id = $1 AND ra_user_id = $2`,
            [call_id, userId]
        );

        if (callResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Call not found" });
        }

        const existingCall = callResult.rows[0];

        if (existingCall.status !== "PUBLISHED") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Only published calls can be modified",
            });
        }

        if (existingCall.status === "CLOSED") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Cannot create errata for closed call",
            });
        }

        // 2️⃣ Determine ROOT call
        const rootId = existingCall.parent_call_id
            ? existingCall.parent_call_id
            : existingCall.id;

        // 3️⃣ Mark all previous versions as not latest
        await client.query(
            `UPDATE research_calls
       SET is_latest = false
       WHERE id = $1 OR parent_call_id = $1`,
            [rootId]
        );

        // 4️⃣ Insert new errata version
        const insertResult = await client.query(
            `INSERT INTO research_calls (
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
        research_remarks,
        entry_price_low,
        parent_call_id,
        version_type,
        is_latest
      )
      VALUES (
        $1, 'PUBLISHED',
        $2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,
        $25,'ERRATA',true
      )
      RETURNING *`,
            [
                userId,
                existingCall.exchange_type,
                existingCall.market_type,
                existingCall.symbol,
                existingCall.display_name,
                existingCall.action,
                existingCall.call_type,
                existingCall.trade_type,
                existingCall.expiry_date,
                updates.entry_price ?? existingCall.entry_price,
                updates.entry_price_upper ?? existingCall.entry_price_upper,
                updates.target_price ?? existingCall.target_price,
                updates.target_price_2 ?? existingCall.target_price_2,
                updates.target_price_3 ?? existingCall.target_price_3,
                updates.stop_loss ?? existingCall.stop_loss,
                updates.stop_loss_2 ?? existingCall.stop_loss_2,
                updates.stop_loss_3 ?? existingCall.stop_loss_3,
                updates.holding_period ?? existingCall.holding_period,
                updates.rationale ?? existingCall.rationale,
                updates.underlying_study ?? existingCall.underlying_study,
                existingCall.is_algo,
                existingCall.has_vested_interest,
                updates.research_remarks ?? existingCall.research_remarks,
                updates.entry_price_low ?? existingCall.entry_price_low,
                rootId
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Errata created successfully",
            data: insertResult.rows[0],
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Errata Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    } finally {
        client.release();
    }


};

/* =========================================================
   CREATE ERRATA (POST /api/research/calls/${item.id}/status`)
   ========================================================= */


