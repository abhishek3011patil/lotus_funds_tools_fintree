import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Reusable helper
 * Call this whenever you want to create a notification.
 * For now pass a test client's userId.
 * Later pass subscribed clients' userIds.
 */
export const createClientNotification = async ({
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceType = null,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
}) => {
  try {
    await pool.query(
      `
      INSERT INTO client_notifications
      (
        user_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        userId,
        type,
        title,
        message,
        referenceId,
        referenceType,
      ]
    );
  } catch (error) {
    console.error("Create Notification Error:", error);
  }
};

/**
 * GET CLIENT NOTIFICATIONS
 */
export const getClientNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        is_read,
        created_at,
        updated_at
      FROM client_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Get Client Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * MARK SINGLE NOTIFICATION AS READ
 */
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE client_notifications
      SET
        is_read = TRUE,
        updated_at = NOW()
      WHERE
        id = $1
        AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/**
 * MARK ALL AS READ
 */
export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await pool.query(
      `
      UPDATE client_notifications
      SET
        is_read = TRUE,
        updated_at = NOW()
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/**
 * DELETE NOTIFICATION
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM client_notifications
      WHERE
        id = $1
        AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};