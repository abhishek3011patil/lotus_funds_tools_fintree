import { Request, Response } from "express";
import { pool } from "../db";

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

    if (search) {
      values.push(`%${search}%`);
      where.push(`
        (
          LOWER(COALESCE(admin_name, '')) LIKE $${values.length}
          OR LOWER(COALESCE(admin_role, '')) LIKE $${values.length}
          OR LOWER(COALESCE(action, '')) LIKE $${values.length}
          OR LOWER(COALESCE(module, '')) LIKE $${values.length}
          OR LOWER(COALESCE(target_entity, '')) LIKE $${values.length}
          OR LOWER(COALESCE(target_type, '')) LIKE $${values.length}
          OR LOWER(COALESCE(description, '')) LIKE $${values.length}
          OR LOWER(COALESCE(status, '')) LIKE $${values.length}
          OR LOWER(COALESCE(reason, '')) LIKE $${values.length}
          OR LOWER(COALESCE(ip_address, '')) LIKE $${values.length}
          OR LOWER(COALESCE(device, '')) LIKE $${values.length}
        )
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
      where.push(`admin_role = 'SUPERADMIN'`);
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