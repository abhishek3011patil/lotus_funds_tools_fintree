import { Request, Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return String(
    forwardedIp || req.socket.remoteAddress || req.ip || "Unknown"
  ).replace(/^::ffff:/, "");
};

/* =========================================================
   GET AUDIT LOGS (GET /api/audit-logs/)
   ========================================================= */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const search = String(req.query.search || "").trim().toLowerCase();
    const date = String(req.query.date || "");
    const user = String(req.query.user || "");
    const module = String(req.query.module || "");
    const status = String(req.query.status || "");

    const values: any[] = [];
    const where: string[] = [];

   if (search && search.length >= 3) {
  values.push(`%${search}%`);

  where.push(`
    LOWER(
      COALESCE(admin_name, '') || ' ' ||
      COALESCE(admin_role, '') || ' ' ||
      COALESCE(action, '') || ' ' ||
      COALESCE(module, '') || ' ' ||
      COALESCE(target_entity, '') || ' ' ||
      COALESCE(target_type, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(status, '') || ' ' ||
      COALESCE(reason, '') || ' ' ||
      COALESCE(ip_address, '') || ' ' ||
      COALESCE(device, '')
    ) LIKE $${values.length}
  `);
}

    if (module) {
      values.push(module);
      where.push(`module = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    if (user === "admin") {
      where.push(`admin_role = 'ADMIN'`);
    }

    if (user === "superadmin") {
      where.push(`admin_role IN ('SUPERADMIN', 'SUPER_ADMIN')`);
    }

    if (date === "today") {
      where.push(`created_at >= CURRENT_DATE`);
    }

    if (date === "week") {
      where.push(`created_at >= NOW() - INTERVAL '7 days'`);
    }

    if (date === "month") {
      where.push(`created_at >= NOW() - INTERVAL '1 month'`);
    }

    const whereClause = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `
      SELECT
        id AS log_id,
        created_at,
        admin_name,
        admin_role,
        action,
        module,
        target_entity,
        target_type,
        description,
        status,
        reason,
        ip_address,
        device,
        old_value,
        new_value,
        COUNT(*) OVER() AS total_count
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values
    );

    const total = result.rows.length
      ? Number(result.rows[0].total_count)
      : 0;

    return res.status(200).json({
      success: true,
      logs: result.rows.map(({ total_count, ...log }) => log),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};


/* =========================================================
   EXPORT AUDIT LOGS (GET /api/audit-logs/export)
   ========================================================= */
export const exportAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const fromDate = String(req.query.fromDate || "");
    const toDate = String(req.query.toDate || "");
    const user = String(req.query.user || "");
    const module = String(req.query.module || "");
    const status = String(req.query.status || "");

    const values: any[] = [];
    const where: string[] = [];

    if (search && search.length >= 3) {
      values.push(`%${search}%`);
      where.push(`
        LOWER(
          COALESCE(admin_name, '') || ' ' ||
          COALESCE(admin_role, '') || ' ' ||
          COALESCE(action, '') || ' ' ||
          COALESCE(module, '') || ' ' ||
          COALESCE(target_entity, '') || ' ' ||
          COALESCE(target_type, '') || ' ' ||
          COALESCE(description, '') || ' ' ||
          COALESCE(status, '') || ' ' ||
          COALESCE(reason, '') || ' ' ||
          COALESCE(ip_address, '') || ' ' ||
          COALESCE(device, '')
        ) LIKE $${values.length}
      `);
    }

    if (module) {
      values.push(module);
      where.push(`module = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    if (user === "admin") where.push(`admin_role = 'ADMIN'`);
    if (user === "superadmin") {
      where.push(`admin_role IN ('SUPERADMIN', 'SUPER_ADMIN')`);
    }

    if (fromDate) {
      values.push(fromDate);
      where.push(`created_at >= $${values.length}::date`);
    }

    if (toDate) {
      values.push(toDate);
      where.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        id AS log_id,
        created_at,
        admin_name,
        admin_role,
        action,
        module,
        target_entity,
        target_type,
        description,
        status,
        reason,
        ip_address,
        device,
        old_value,
        new_value
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5000
      `,
      values
    );

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "EXPORT_AUDIT_LOGS",
      module: "AUDIT",
      targetEntity: "AUDIT_LOGS",
      targetType: "AUDIT_LOG_EXPORT",
      description: "Admin exported audit logs",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"],
      newValue: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        user: user || null,
        module: module || null,
        status: status || null,
        searchApplied: search.length >= 3,
        exportedCount: result.rowCount || 0,
      },
    });

    return res.status(200).json({
      success: true,
      logs: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("EXPORT AUDIT LOGS ERROR:", error);

    await createAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || "ADMIN",
      adminRole: req.user?.role || "ADMIN",
      action: "EXPORT_AUDIT_LOGS",
      module: "AUDIT",
      targetEntity: "AUDIT_LOGS",
      targetType: "AUDIT_LOG_EXPORT",
      description: "Admin audit log export failed",
      status: "FAILED",
      reason:
        error instanceof Error ? error.message : "Unknown error",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"],
    });

    return res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};
