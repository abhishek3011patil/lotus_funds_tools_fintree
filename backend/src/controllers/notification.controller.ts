import { Request, Response } from "express";
import { pool } from "../db";

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM notifications
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `);

    const notifications = result.rows.map((n) => {
      const date = new Date(n.created_at);

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateGroup = "Older";

      if (date.toDateString() === today.toDateString()) {
        dateGroup = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateGroup = "Yesterday";
      }

      return {
        id: n.id,
        source: n.source,
        title: n.title,
        description: n.description,
        isRead: n.is_read,
        createdAt: n.created_at,
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        dateGroup,
      };
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error("Get Notifications Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE notifications
      SET
        is_deleted = true,
        updated_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("Delete Notification Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response
) => {
  try {
    await pool.query(`
      UPDATE notifications
      SET
        is_read = true,
        updated_at = NOW()
      WHERE
        is_read = false
        AND is_deleted = false
    `);

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Mark All Notifications Read Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};