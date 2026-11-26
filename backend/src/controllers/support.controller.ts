
import { Request, Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";

// --------------------------------------------------
// GET ALL SUPPORT REQUESTS - ADMIN
// --------------------------------------------------

export const getAllSupportRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, status, priority, userType } = req.query;

    const conditions: string[] = [];
    const values: any[] = [];

    if (search) {
      values.push(`%${String(search).trim()}%`);
      conditions.push(`
        (
          sender_name ILIKE $${values.length}
          OR complaint ILIKE $${values.length}
          OR description ILIKE $${values.length}
          OR id::text ILIKE $${values.length}
        )
      `);
    }

    if (status) {
      values.push(String(status).trim().toUpperCase());
      conditions.push(`status = $${values.length}`);
    }

    if (priority) {
      values.push(String(priority).trim().toUpperCase());
      conditions.push(`priority = $${values.length}`);
    }

    if (userType) {
      values.push(String(userType).trim().toUpperCase());
      conditions.push(`user_type = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `
      SELECT
        id,
        '#' || LPAD(id::text, 5, '0') AS "ticketId",
        user_type AS "userType",
        sender_name AS "senderName",
        user_id AS "userId",
        complaint,
        category,
        description,
        priority,
        status,
        attachment_name AS "attachmentName",
        attachment_url AS "attachmentUrl",
        created_at AS "submittedAt",
        updated_at AS "updatedAt"
      FROM support_requests
      ${whereClause}
      ORDER BY created_at DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,
      message: "Support requests fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get support requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch support requests",
    });
  }
};


// --------------------------------------------------
// GET SINGLE SUPPORT REQUEST - ADMIN
// --------------------------------------------------

export const getSupportRequestById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request ID",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        '#' || LPAD(id::text, 5, '0') AS "ticketId",
        user_type AS "userType",
        sender_name AS "senderName",
        user_id AS "userId",
        complaint,
        category,
        description,
        priority,
        status,
        attachment_name AS "attachmentName",
        attachment_url AS "attachmentUrl",
        created_at AS "submittedAt",
        updated_at AS "updatedAt"
      FROM support_requests
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Support request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support request details fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get support request details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch support request details",
    });
  }
};


// --------------------------------------------------
// UPDATE SUPPORT REQUEST - ADMIN
// --------------------------------------------------

export const updateSupportRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const { status, priority } = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request ID",
      });
    }

    const validStatuses = [
      "OPEN",
      "IN PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    const validPriorities = ["HIGH", "MEDIUM", "LOW"];

    if (status === undefined && priority === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide status or priority",
      });
    }

    const selectedStatus =
      status !== undefined ? String(status).trim().toUpperCase() : undefined;

    const selectedPriority =
      priority !== undefined
        ? String(priority).trim().toUpperCase()
        : undefined;

    if (
      selectedStatus !== undefined &&
      !validStatuses.includes(selectedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request status",
      });
    }

    if (
      selectedPriority !== undefined &&
      !validPriorities.includes(selectedPriority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request priority",
      });
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (selectedStatus !== undefined) {
      values.push(selectedStatus);
      fields.push(`status = $${values.length}`);
    }

    if (selectedPriority !== undefined) {
      values.push(selectedPriority);
      fields.push(`priority = $${values.length}`);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id);

    const result = await pool.query(
      `
      UPDATE support_requests
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING
        id,
        '#' || LPAD(id::text, 5, '0') AS "ticketId",
        status,
        priority,
        updated_at AS "updatedAt"
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Support request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support request updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update support request",
    });
  }
};


// --------------------------------------------------
// CREATE SUPPORT REQUEST - RA, BROKER, CLIENT
// --------------------------------------------------

export const createSupportRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { complaint, category, description, priority } = req.body;

    // Validate required fields
    if (
      typeof complaint !== "string" ||
      !complaint.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Complaint, category and description are required",
      });
    }

    const selectedPriority = String(priority || "MEDIUM")
      .trim()
      .toUpperCase();

    const validPriorities = ["HIGH", "MEDIUM", "LOW"];

    if (!validPriorities.includes(selectedPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    // Get the actual user details from the database
    const userResult = await pool.query(
      `
      SELECT id, name, role
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];
    const role = String(user.role).trim().toUpperCase();

    // Map application roles to support user types
    const roleMap: Record<string, string> = {
      RESEARCH_ANALYST: "RA",
      RA: "RA",
      BROKER: "BROKER",
      CLIENT: "CLIENT",
    };

    const userType = roleMap[role];

    if (!userType) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to submit support requests",
      });
    }

    // Optional attachment uploaded through existing Multer middleware
    const attachmentName = req.file?.originalname || null;

    const attachmentUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const result = await pool.query(
      `
      INSERT INTO support_requests (
        user_id,
        user_type,
        sender_name,
        complaint,
        category,
        description,
        priority,
        attachment_name,
        attachment_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        '#' || LPAD(id::text, 5, '0') AS "ticketId",
        user_type AS "userType",
        sender_name AS "senderName",
        complaint,
        category,
        description,
        priority,
        status,
        attachment_name AS "attachmentName",
        attachment_url AS "attachmentUrl",
        created_at AS "submittedAt",
        updated_at AS "updatedAt"
      `,
      [
        user.id,
        userType,
        user.name,
        complaint.trim(),
        category.trim(),
        description.trim(),
        selectedPriority,
        attachmentName,
        attachmentUrl,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Support request submitted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit support request",
    });
  }
};


// --------------------------------------------------
// GET MY SUPPORT REQUESTS - RA, BROKER, CLIENT
// --------------------------------------------------

export const getMySupportRequests = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        '#' || LPAD(id::text, 5, '0') AS "ticketId",
        user_type AS "userType",
        sender_name AS "senderName",
        complaint,
        category,
        description,
        priority,
        status,
        attachment_name AS "attachmentName",
        attachment_url AS "attachmentUrl",
        created_at AS "submittedAt",
        updated_at AS "updatedAt"
      FROM support_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Your support requests fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get my support requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your support requests",
    });
  }
};
// --------------------------------------------------
// GET NEW SUPPORT REQUEST COUNT - ADMIN
// --------------------------------------------------

export const getNewSupportRequestCount = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM support_requests
      WHERE status = 'OPEN'
      `
    );

    return res.status(200).json({
      success: true,
      count: result.rows[0].count,
    });
  } catch (error) {
    console.error("Get new support request count error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch new support request count",
    });
  }
};