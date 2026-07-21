import { pool } from "../db";

interface NotificationData {
  source: string;
  title: string;
  description: string;
  notificationType: string;
  referenceId?: string;
  referenceTable?: string;
}

export const createNotification = async ({
  source,
  title,
  description,
  notificationType,
  referenceId,
  referenceTable,
}: NotificationData) => {
  await pool.query(
    `
    INSERT INTO notifications
    (
      source,
      title,
      description,
      notification_type,
      reference_id,
      reference_table
    )
    VALUES
    ($1,$2,$3,$4,$5,$6)
    `,
    [
      source,
      title,
      description,
      notificationType,
      referenceId || null,
      referenceTable || null,
    ]
  );
};