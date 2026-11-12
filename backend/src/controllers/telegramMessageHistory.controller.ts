import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createClient } from "../utils/telegramClientFactory";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getResearchCallTelegramMessageStatus = async (req: AuthRequest, res: Response) => {
  const researchCallId = String(req.params.researchCallId || "");
  if (!UUID_PATTERN.test(researchCallId)) return res.status(400).json({ message: "Invalid research call." });
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS recipient_count
       FROM telegram_message_broadcasts broadcast
       JOIN telegram_message_deliveries delivery ON delivery.broadcast_id = broadcast.id
       WHERE broadcast.sender_user_id = $1 AND broadcast.research_call_id = $2
         AND cardinality(delivery.message_ids) > 0
         AND delivery.status IN ('SENT', 'PARTIAL', 'DELETING', 'DELETE_FAILED')`,
      [req.user!.id, researchCallId],
    );
    return res.json({
      recipientCount: Number(result.rows[0]?.recipient_count || 0),
    });
  } catch (error) {
    console.error("GET TELEGRAM MESSAGE STATUS ERROR:", error);
    return res.status(500).json({ message: "Unable to load Telegram delivery status." });
  }
};

export const deleteResearchCallTelegramMessages = async (req: AuthRequest, res: Response) => {
  const researchCallId = String(req.params.researchCallId || "");
  if (!UUID_PATTERN.test(researchCallId)) return res.status(400).json({ message: "Invalid research call." });

  let telegramClient: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    const deliveries = await pool.query(
      `SELECT delivery.id, delivery.telegram_peer, delivery.message_ids
       FROM telegram_message_broadcasts broadcast
       JOIN telegram_message_deliveries delivery ON delivery.broadcast_id = broadcast.id
       WHERE broadcast.sender_user_id = $1 AND broadcast.research_call_id = $2
         AND cardinality(delivery.message_ids) > 0
         AND (delivery.status IN ('SENT', 'PARTIAL', 'DELETE_FAILED')
           OR (delivery.status = 'DELETING' AND delivery.updated_at < NOW() - INTERVAL '10 minutes'))
       ORDER BY delivery.sent_at`,
      [req.user!.id, researchCallId],
    );
    if (!deliveries.rows.length) {
      return res.status(404).json({
        message: "No deletable Telegram messages were recorded for this call. Messages sent before this feature was enabled cannot be recalled here.",
      });
    }

    const sessionResult = await pool.query("SELECT telegram_session FROM users WHERE id = $1", [req.user!.id]);
    const session = sessionResult.rows[0]?.telegram_session;
    if (!session) return res.status(409).json({ message: "Connect your Telegram account to remove its sent messages." });
    telegramClient = await createClient(session);

    let deletedCount = 0;
    let failedCount = 0;
    for (const delivery of deliveries.rows) {
      const claim = await pool.query(
        `UPDATE telegram_message_deliveries SET status = 'DELETING', error_message = NULL, updated_at = NOW()
         WHERE id = $1 AND (status IN ('SENT', 'PARTIAL', 'DELETE_FAILED')
           OR (status = 'DELETING' AND updated_at < NOW() - INTERVAL '10 minutes'))
         RETURNING id`,
        [delivery.id],
      );
      if (!claim.rowCount) continue;

      try {
        const entity = await telegramClient.getEntity(delivery.telegram_peer);
        const messageIds = (delivery.message_ids as Array<number | string>)
          .map(Number)
          .filter(Number.isSafeInteger);
        if (!messageIds.length) throw new Error("Telegram message IDs are unavailable.");
        await telegramClient.deleteMessages(entity, messageIds, { revoke: true });
        await pool.query(
          `UPDATE telegram_message_deliveries SET status = 'DELETED', deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1`, [delivery.id],
        );
        deletedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Telegram could not delete this delivery.";
        await pool.query(
          `UPDATE telegram_message_deliveries SET status = 'DELETE_FAILED', error_message = $1, updated_at = NOW()
           WHERE id = $2`, [message.slice(0, 1000), delivery.id],
        );
        failedCount++;
      }
    }

    return res.json({
      success: failedCount === 0,
      deletedCount,
      failedCount,
      message: failedCount
        ? `Telegram removed ${deletedCount} delivery record(s); ${failedCount} could not be deleted.`
        : `Telegram messages were removed for ${deletedCount} delivery record(s).`,
    });
  } catch (error) {
    console.error("DELETE TELEGRAM RESEARCH CALL MESSAGE ERROR:", error);
    return res.status(502).json({ message: "Unable to remove Telegram messages for this call." });
  } finally {
    await telegramClient?.disconnect().catch(() => undefined);
  }
};
