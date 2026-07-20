import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Router } from "express";
import { createAuditLog } from "../utils/auditLogger";
import { queueWhatsAppResearchCall } from "../services/deliveryQueue.service";

const getClientIp = (req: any): string => {
  let ip =
    req.headers?.["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown";

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

  if (typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return String(ip);
};

/* =========================================================
   CREATE RESEARCH CALL  (POST /api/research/calls)
   ========================================================= */
/* =========================================================
   CREATE RESEARCH CALL (POST /api/research/calls)
   ========================================================= */
export const createResearchCall = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const file = req.file;
    const filePath = file ? file.path : null;

    const {
      status = "PUBLISHED",
      message_text,
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
    } = req.body;

    const normalizedStatus =
      String(status).toUpperCase() === "DRAFT"
        ? "DRAFT"
        : "PUBLISHED";

    const disclaimerResult = await pool.query(
      `
        SELECT
          additional_comments,
          disclaimer_updated_at
        FROM ra_details
        WHERE user_id = $1
      `,
      [req.user!.id]
    );

    const disclaimerSnapshot =
      disclaimerResult.rows[0]?.additional_comments || null;

    const disclaimerSnapshotAt =
      disclaimerResult.rows[0]?.disclaimer_updated_at || null;

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
        file_url,
        disclaimer_snapshot,
        disclaimer_snapshot_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28
      )
      RETURNING *;
    `;

    const values = [
      req.user!.id,
      normalizedStatus,
      exchange_type,
      market_type,
      symbol,
      display_name,
      action,
      call_type,
      trade_type,
      expiry_date || null,
      entry_price || null,
      entry_price_low || null,
      entry_price_upper || null,
      target_price || null,
      target_price_2 || null,
      target_price_3 || null,
      stop_loss || null,
      stop_loss_2 || null,
      stop_loss_3 || null,
      holding_period || null,
      rationale || null,
      underlying_study || null,
      is_algo === true || is_algo === "true",
      has_vested_interest === true ||
        has_vested_interest === "true",
      research_remarks || null,
      filePath,
      disclaimerSnapshot,
      disclaimerSnapshotAt,
    ];

    const { rows } = await pool.query(query, values);
    const createdCall = rows[0];
    

    if (
      String(createdCall.status).toUpperCase() ===
      "PUBLISHED"
    ) {
      const whatsappMessage = String(
        message_text || ""
      ).trim();

      if (!whatsappMessage) {
        console.warn(
          "WHATSAPP MESSAGE NOT QUEUED: message_text is empty",
          createdCall.id
        );
      } else {
        try {
          await queueWhatsAppResearchCall({
            researchCallId: createdCall.id,
            raUserId: req.user!.id,
            eventType: "RESEARCH_CALL_PUBLISHED",
            message: whatsappMessage,
          });
        } catch (queueError) {
          console.error(
            "WHATSAPP QUEUE ERROR:",
            queueError
          );
        }
      }
    }

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name,
      adminRole: req.user?.role,
      action:
        createdCall.status === "DRAFT"
          ? "CALL_DRAFT_CREATED"
          : "CALL_CREATED",
      module: "RESEARCH_CALL",
      targetEntity: createdCall.symbol,
      targetType: "CALL",
      description:
        createdCall.status === "DRAFT"
          ? `Draft research call created: ${createdCall.symbol}`
          : `Research call created: ${createdCall.symbol}`,
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      newValue: createdCall,
    });

    return res.status(201).json({
      message:
        createdCall.status === "PUBLISHED"
          ? "Research call published and WhatsApp delivery queued"
          : "Research call saved as draft",
      id: createdCall.id,
      created_at: createdCall.created_at,
      file: filePath,
    });
  } catch (err) {
    console.error("CREATE CALL ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


/* =========================================================
   CREATE RESEARCH CALL  (POST /api/research/performance)
   ========================================================= */
/* =========================================================
   GET RESEARCH PERFORMANCE (GET /api/research/performance)
   ========================================================= */
export const getResearchPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || "";

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
        rc.version_type,
        rc.exit_price AS exit_price,
        rc.status,
        NULL AS profit_loss,
        u.name AS researcher_name
      FROM research_calls rc
      JOIN users u ON u.id = rc.ra_user_id
      WHERE rc.is_latest = true
      AND (
        rc.display_name ILIKE $3 OR
        rc.symbol ILIKE $3 OR
        u.name ILIKE $3
      )
      ORDER BY rc.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(query, [
      limit,
      offset,
      `%${search}%`,
    ]);

    res.json(rows);
  } catch (err) {
    console.error("PERFORMANCE API ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   GET MY CALLS  (GET /api/research/calls/my)
   ========================================================= */
/* =========================================================
   GET MY RESEARCH CALLS (GET /api/research/calls/my)
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
/* =========================================================
   GET PUBLISHED RESEARCH CALLS (GET /api/research/calls/published)
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

    const { call_id, updates, message_text } = req.body;
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

     if ((callResult.rowCount ?? 0) === 0) {
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

const errataCall = insertResult.rows[0];
const whatsappMessage = String(message_text || "").trim();

if (whatsappMessage) {
  await queueWhatsAppResearchCall({
    researchCallId: errataCall.id,
    originalCallId: rootId,
    raUserId: req.user!.id,
    eventType: "RESEARCH_CALL_ERRATA",
    message: whatsappMessage,
    client,
  });
} else {
  console.warn(
    "ERRATA WHATSAPP NOT QUEUED: message_text is empty",
    errataCall.id
  );
}

    await client.query("COMMIT");

    await createAuditLog({
  adminId: req.user?.id,
  adminName: req.user?.name,
  adminRole: req.user?.role,
  action: "ERRATA_CREATED",
  module: "RESEARCH_CALL",
  targetEntity: insertResult.rows[0].symbol,
  targetType: "CALL",
  description: `Errata created for research call: ${insertResult.rows[0].symbol}`,
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: existingCall,
  newValue: insertResult.rows[0],
});

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


/* =========================================================
   PUBLISH DRAFT RESEARCH CALL (PATCH /api/research/calls/:id/publish)
   ========================================================= */
export const publishDraftCall = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const raUserId = req.user?.id;

    const messageText = String(
      req.body?.message_text || ""
    ).trim();

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const userResult = await pool.query(
      `
      SELECT telegram_session
      FROM users
      WHERE id = $1
      `,
      [raUserId]
    );

    const telegramSession =
      userResult.rows[0]?.telegram_session;

    if (
      !telegramSession ||
      telegramSession === "null" ||
      telegramSession.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Telegram is not connected. Please connect Telegram first.",
      });
    }

    const result = await pool.query(
      `
      UPDATE research_calls
      SET status = 'PUBLISHED'
      WHERE id = $1
        AND status = 'DRAFT'
        AND ra_user_id = $2
      RETURNING *
      `,
      [id, raUserId]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish this call",
      });
    }

    const publishedCall = result.rows[0];

    try {
      await queueWhatsAppResearchCall({
        researchCallId: publishedCall.id,
        raUserId,
        eventType: "RESEARCH_CALL_PUBLISHED",
        message: messageText,
      });

      console.log("WHATSAPP PUBLISH QUEUED:", {
        researchCallId: publishedCall.id,
        raUserId,
      });
    } catch (queueError: any) {
      console.error("WHATSAPP PUBLISH QUEUE ERROR:", {
        message: queueError?.message,
        code: queueError?.code,
        detail: queueError?.detail,
      });
    }

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name,
      adminRole: req.user?.role,
      action: "DRAFT_PUBLISHED",
      module: "RESEARCH_CALL",
      targetEntity: publishedCall.symbol,
      targetType: "CALL",
      description: `Draft research call published: ${publishedCall.symbol}`,
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: { status: "DRAFT" },
      newValue: publishedCall,
    });

    return res.status(200).json({
      success: true,
      message:
        "Call published and WhatsApp delivery queued",
      data: publishedCall,
    });
  } catch (err: any) {
    console.error("PUBLISH ERROR:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      stack: err?.stack,
    });

    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
};


    // =========================================================
    // 1️⃣ change disclaimer 
    // =========================================================



/* =========================================================
   GET RESEARCH ANALYST DISCLAIMER (GET /api/registration/research/disclaimer)
   ========================================================= */
export const getRADisclaimer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const result = await pool.query(
      `
      SELECT additional_comments
      FROM ra_details
      WHERE user_id = $1
      `,
      [userId]
    );

    return res.json({
      success: true,
      disclaimer:
        result.rows[0]?.additional_comments || "",
    });
  } catch (error) {
    console.error("GET DISCLAIMER ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================================================
   UPDATE RESEARCH ANALYST DISCLAIMER (PUT /api/registration/research/disclaimer)
   ========================================================= */
export const updateRADisclaimer = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userId = req.user?.id;
    const { disclaimer } = req.body;

    if (!userId) {
      await client.query("ROLLBACK");
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    if (!disclaimer || !disclaimer.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Disclaimer is required",
      });
    }

    const oldResult = await client.query(
      `
      SELECT additional_comments, disclaimer_updated_at
      FROM ra_details
      WHERE user_id = $1
      `,
      [userId]
    );

    const oldDisclaimer = oldResult.rows[0]?.additional_comments || "";

    const versionResult = await client.query(
      `
      SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
      FROM disclaimer_history
      WHERE ra_user_id = $1
      `,
      [userId]
    );

    const nextVersion = Number(versionResult.rows[0].next_version);

    await client.query(
      `
      INSERT INTO disclaimer_history (
        ra_user_id,
        disclaimer_text,
        version_number
      )
      VALUES ($1, $2, $3)
      `,
      [userId, disclaimer.trim(), nextVersion]
    );

    const result = await client.query(
      `
      UPDATE ra_details
      SET
        additional_comments = $1,
        disclaimer_updated_at = NOW()
      WHERE user_id = $2
      RETURNING additional_comments, disclaimer_updated_at
      `,
      [disclaimer.trim(), userId]
    );

    await client.query("COMMIT");

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "RA",
      adminRole: req.user?.role || "RESEARCH_ANALYST",
      action: "DISCLAIMER_UPDATED",
      module: "RA_PROFILE",
      targetEntity: req.user?.name || userId,
      targetType: "DISCLAIMER",
      description: `RA disclaimer updated. Version ${nextVersion} created.`,
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: {
        disclaimer: oldDisclaimer,
        disclaimerUpdatedAt: oldResult.rows[0]?.disclaimer_updated_at || null,
      },
      newValue: {
        disclaimer: result.rows[0]?.additional_comments,
        version: nextVersion,
        disclaimerUpdatedAt: result.rows[0]?.disclaimer_updated_at,
      },
    });

    return res.json({
      success: true,
      disclaimer: result.rows[0]?.additional_comments || "",
      disclaimerUpdatedAt: result.rows[0]?.disclaimer_updated_at || null,
      version: nextVersion,
      message: "Disclaimer updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("UPDATE DISCLAIMER ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};



/* =========================================================
   GET RESEARCH ANALYST MESSAGE PROFILE (GET /api/ra/message-profile)
   ========================================================= */
export const getRAMessageProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const raUserId = req.user?.id;

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      SELECT
        salutation,
        first_name,
        middle_name,
        surname,
        org_name,
        sebi_reg_no,
        mobile,
        email,
        additional_comments
      FROM ra_details
      WHERE user_id = $1
      `,
      [raUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "RA details not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET RA MESSAGE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load RA message profile",
    });
  }
};

