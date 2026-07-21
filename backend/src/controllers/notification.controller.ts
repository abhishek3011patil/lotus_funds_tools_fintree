import { Request, Response } from "express";
import { pool } from "../db";
import { createNotification } from "../utils/notification";

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {

    // =====================================================
    // Sync Pending RA Registrations
    // =====================================================

    const pendingRAs = await pool.query(`
      SELECT id, first_name, surname
      FROM ra_details
      WHERE LOWER(status) = 'pending'
    `);

    for (const ra of pendingRAs.rows) {

      const exists = await pool.query(
        `
        SELECT 1
        FROM notifications
        WHERE reference_table='ra_details'
          AND reference_id=$1
          AND notification_type='RA'
          AND is_deleted=false
        `,
        [ra.id]
      );

      if (exists.rowCount === 0) {
        await createNotification({
          source: "Dashboard",
          title: "New Research Analyst Registration",
          description: `${ra.first_name} ${ra.surname} submitted a registration request.`,
          notificationType: "RA",
          referenceId: ra.id,
          referenceTable: "ra_details",
        });
      }
    }

    // =====================================================
    // Sync Pending Broker Registrations
    // =====================================================

   const pendingBrokers = await pool.query(`
  SELECT
    id,
    legal_name,
    trade_name
  FROM broker_details
  WHERE LOWER(status)='pending'
`);
    for (const broker of pendingBrokers.rows) {

      const exists = await pool.query(
        `
        SELECT 1
        FROM notifications
        WHERE reference_table='broker_details'
          AND reference_id=$1
          AND notification_type='BROKER'
          AND is_deleted=false
        `,
        [broker.id]
      );

      if (exists.rowCount === 0) {

        await createNotification({
          source: "Dashboard",
          title: "New Broker Registration",
         description: `${broker.legal_name} submitted a broker registration request.`,
          notificationType: "BROKER",
          referenceId: broker.id,
          referenceTable: "broker_details",
        });

      }

    }

    // =====================================================
    // Sync Pending RA Profile Update Requests
    // =====================================================

    const profileRequests = await pool.query(`
      SELECT
        r.id,
        rd.first_name,
        rd.surname
      FROM ra_profile_update_requests r
      JOIN ra_details rd
        ON rd.user_id = r.ra_user_id
      WHERE LOWER(r.status)='pending'
    `);

    for (const request of profileRequests.rows) {

      const exists = await pool.query(
        `
        SELECT 1
        FROM notifications
        WHERE reference_table='ra_profile_update_requests'
          AND reference_id=$1
          AND notification_type='PROFILE_UPDATE'
          AND is_deleted=false
        `,
        [request.id]
      );

      if (exists.rowCount === 0) {

        await createNotification({
          source: "Admin Approval",
          title: "RA Profile Update Request",
          description: `${request.first_name} ${request.surname} requested profile changes.`,
          notificationType: "PROFILE_UPDATE",
          referenceId: request.id,
          referenceTable: "ra_profile_update_requests",
        });

      }

    }

    // =====================================================
    // Fetch Notifications
    // =====================================================

    const result = await pool.query(`
      SELECT *
      FROM notifications
      WHERE is_deleted=false
      ORDER BY created_at DESC
    `);

    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const notifications = result.rows.map((n) => {

      const date = new Date(n.created_at);

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
export const getUnreadNotificationCount = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE
        is_read = false
        AND is_deleted = false
    `);

    return res.json({
      success: true,
      count: result.rows[0].count,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};