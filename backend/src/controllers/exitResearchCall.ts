import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";
import { queueWhatsAppResearchCall } from "../services/deliveryQueue.service";
const getClientIp = (req: any): string => {
  let ip =
    req.headers?.["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown";

  if (Array.isArray(ip)) ip = ip[0];
  if (typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (ip === "::1") ip = "127.0.0.1";
  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return String(ip);
};

;
// Use your actual queue service import path.

/* =========================================================
   EXIT RESEARCH CALL (PATCH /api/research/calls/:id/exit)
   ========================================================= */
export const exitResearchCall = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user?.id;

    const {
      exit_price,
      exit_remark,
      message_text,
    } = req.body;

    if (!id) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Call ID is required",
      });
    }

    if (!userId) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const parsedExitPrice = Number(exit_price);
    const trimmedExitRemark = String(exit_remark || "").trim();
    const trimmedMessage = String(message_text || "").trim();

    if (
      !Number.isFinite(parsedExitPrice) ||
      parsedExitPrice <= 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Please enter a valid exit price",
        field: "exit_price",
      });
    }

    if (!trimmedExitRemark) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Exit remark is required",
        field: "exit_remark",
      });
    }

    if (trimmedExitRemark.length > 2000) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Exit remark cannot exceed 2000 characters",
        field: "exit_remark",
      });
    }

    if (!trimmedMessage) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Exit WhatsApp message is required",
      });
    }

    /*
     * Lock the row so two exit requests cannot close the same
     * research call simultaneously.
     */
    const existingResult = await client.query(
      `
      SELECT *
      FROM research_calls
      WHERE id = $1
        AND ra_user_id = $2
        AND status IN ('PUBLISHED', 'ERRATA')
        AND is_latest = true
      FOR UPDATE;
      `,
      [id, userId]
    );

    if ((existingResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Call not found, already closed, or you are not allowed to exit it",
      });
    }

    const existingCall = existingResult.rows[0];

    const entryPrice = Number(existingCall.entry_price);
    const action = String(existingCall.action || "").toUpperCase();

    /*
     * BUY: exit - entry
     * SELL: entry - exit
     */
    const pnl =
      action === "SELL"
        ? entryPrice - parsedExitPrice
        : parsedExitPrice - entryPrice;

    const result = await client.query(
      `
      UPDATE research_calls
      SET
        status = 'CLOSED',
        exit_price = $1,
        exit_remark = $2,
        closed_at = NOW()
      WHERE id = $3
        AND ra_user_id = $4
        AND status IN ('PUBLISHED', 'ERRATA')
        AND is_latest = true
      RETURNING *;
      `,
      [
        parsedExitPrice,
        trimmedExitRemark,
        id,
        userId,
      ]
    );

    if ((result.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "The call has already been exited",
      });
    }

    const exitedCall = result.rows[0];

    await queueWhatsAppResearchCall({
      researchCallId: exitedCall.id,
      raUserId: userId,
      eventType: "RESEARCH_CALL_EXITED",
      message: trimmedMessage,
      originalCallId: exitedCall.parent_call_id || exitedCall.id,
      client,
    });

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name,
      adminRole: req.user?.role,
      action: "CALL_EXITED",
      module: "RESEARCH_CALL",
      targetEntity:
        exitedCall.display_name || exitedCall.symbol,
      targetType: "CALL",
      description:
        `Research call exited: ${
          exitedCall.display_name || exitedCall.symbol
        } at ${parsedExitPrice}. Remark: ${trimmedExitRemark}`,
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: existingCall,
      newValue: {
        ...exitedCall,
        calculated_pnl: Number(pnl.toFixed(2)),
      },
    });

    await client.query("COMMIT");

    return res.status(200).json({
      message:
        "Call exited successfully and WhatsApp message queued",
      data: {
        ...exitedCall,
        calculated_pnl: Number(pnl.toFixed(2)),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Exit Call Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};
