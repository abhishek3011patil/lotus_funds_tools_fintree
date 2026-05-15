import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Router } from "express";

/* =========================================================
   CREATE RESEARCH CALL  (POST /api/research/calls)
   ========================================================= */
export const createResearchCall = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file; // 👈 multer adds this

    const filePath = file ? file.path : null;

    const {
      status = "PUBLISHED",
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
        research_remarks,
        file_url   -- 👈 ADD COLUMN IN DB
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26
      )
      RETURNING id, created_at;
    `;

    const values = [
      req.user!.id,
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
      research_remarks,
      filePath  // 👈 save file path
    ];

    const { rows } = await pool.query(query, values);

    return res.status(201).json({
      message: "Research call created successfully",
      id: rows[0].id,
      created_at: rows[0].created_at,
      file: filePath
    });

  } catch (err) {
    console.error("CREATE CALL ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   CREATE RESEARCH CALL  (POST /api/research/performance)
   ========================================================= */
export const getResearchPerformance = async (req: AuthRequest, res: Response) => {
    try {

        const query = `
      SELECT
        rc.created_at AS date_time,
        rc.action,
        rc.exchange_type AS exchange,
        rc.call_type AS type,
        rc.trade_type AS category,
        rc.display_name AS instrument,
        rc.symbol,
        rc.expiry_date AS expiry,
        rc.entry_price AS entry,
        '--' AS exit,
        rc.status,
        NULL AS profit_loss,
        u.name AS researcher_name
      FROM research_calls rc
      JOIN users u ON u.id = rc.ra_user_id
      WHERE rc.is_latest = true
      ORDER BY rc.created_at DESC
    `;

        const { rows } = await pool.query(query);

        res.json(rows);

    } catch (err) {
        console.error("PERFORMANCE API ERROR:", err);
        res.status(500).json({ message: "Server error" });
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

    is_latest: row.is_latest,
    version_type: row.version_type,
    parent_call_id: row.parent_call_id,
    file_url: row.file_url,

    exchange: row.exchange_type,
    instrument: row.market_type,

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

    // =========================================================
    // 1️⃣ GET EXISTING CALL
    // =========================================================
    const callResult = await client.query(
      `
      SELECT *
      FROM research_calls
      WHERE id = $1
      AND ra_user_id = $2
      `,
      [call_id, userId]
    );

    if (callResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Call not found",
      });
    }

    const existingCall = callResult.rows[0];

    // =========================================================
    // 2️⃣ VALIDATE STATUS
    // =========================================================
    if (
      !["PUBLISHED", "ERRATA"].includes(existingCall.status)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "Only published or errata calls can be modified",
      });
    }

    if (existingCall.status === "CLOSED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "Cannot create errata for closed call",
      });
    }

    // =========================================================
    // 3️⃣ DETERMINE ROOT CALL
    // =========================================================
    const rootId = existingCall.parent_call_id
      ? existingCall.parent_call_id
      : existingCall.id;

    // =========================================================
    // 4️⃣ MARK OLD VERSIONS AS NOT LATEST
    // =========================================================
    await client.query(
      `
      UPDATE research_calls
      SET is_latest = false
      WHERE id = $1
      OR parent_call_id = $1
      `,
      [rootId]
    );

    // =========================================================
    // 5️⃣ CREATE NEW ERRATA VERSION
    // =========================================================
    const insertResult = await client.query(
  `
  INSERT INTO research_calls (
    ra_user_id,
    status,
    version_type,

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

    research_remarks,

    parent_call_id,
    is_latest
  )
  VALUES (
    $1,
    $2,
    $3,

    $4,
    $5,

    $6,
    $7,

    $8,
    $9,
    $10,

    $11,

    $12,
    $13,
    $14,

    $15,
    $16,
    $17,

    $18,
    $19,
    $20,

    $21,

    $22,
    $23,

    $24,
    $25,

    $26,

    $27,
    $28
  )
  RETURNING *
  `,
  [
    userId,
    "PUBLISHED",
    "ERRATA",

    existingCall.exchange_type,
    existingCall.market_type,

    existingCall.symbol,
    existingCall.display_name,

    updates.action ?? existingCall.action,
    updates.call_type ?? existingCall.call_type,
    updates.trade_type ?? existingCall.trade_type,

    existingCall.expiry_date,

    updates.entry_price ?? existingCall.entry_price,
    updates.entry_price_low ?? existingCall.entry_price_low,
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

    updates.research_remarks ??
      existingCall.research_remarks,

    rootId,
    true
  ]
);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Errata created successfully",
      data: insertResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("ERRATA ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });

  } finally {
    client.release();
  }
};

/* =========================================================
   publish Draft (POST /api/research/calls/:id/publish)
   ========================================================= */


export const publishDraftCall = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
         const userResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id = $1
      `,
      [req.user!.id]
    );

    const telegramSession = userResult.rows[0]?.telegram_session;
    console.log("TELEGRAM SESSION:", telegramSession);

if (
  !telegramSession ||
  telegramSession === "null" ||
  telegramSession.trim() === ""
) {
  return res.status(400).json({
    message: "Telegram is not connected. Please connect Telegram first."
  });
}


        const result = await pool.query(
            `UPDATE research_calls
       SET status = 'PUBLISHED'
       WHERE id = $1
       AND status = 'DRAFT'
       AND ra_user_id = $2
       RETURNING id`,
            [id, req.user!.id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({
                message: "Cannot publish this call"
            });
        }

        return res.json({
            message: "Call published successfully"
        });

    } catch (err) {
        console.error("PUBLISH ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};