import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";

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

export const exitResearchCall = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ message: "Call ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `
      UPDATE research_calls
      SET 
        status = 'CLOSED',
        exit_price = 0,
        closed_at = NOW()
      WHERE id = $1
      AND ra_user_id = $2
      AND status IN ('PUBLISHED', 'ERRATA')
      AND is_latest = true
      RETURNING *;
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message:
          "Call not found, already closed, or you are not allowed to exit it",
      });
    }

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name,
      adminRole: req.user?.role,
      action: "CALL_EXITED",
      module: "RESEARCH_CALL",
      targetEntity: result.rows[0].symbol,
      targetType: "CALL",
      description: `Research call exited: ${result.rows[0].symbol}`,
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      newValue: result.rows[0],
    });

    return res.status(200).json({
      message: "Call exited successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Exit Call Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};