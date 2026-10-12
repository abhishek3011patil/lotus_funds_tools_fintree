import fs from "fs/promises";
import path from "path";
import type { PoolClient } from "pg";
import { TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads";
import { pool } from "../db";

export type ResearchCallMedia = {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
};

const uploadDir = path.resolve(__dirname, "../../uploads");

const safeFileName = (value: unknown, fallback: string): string => {
  const name = path.basename(String(value || fallback).replace(/\\/g, "/"))
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return name.slice(0, 200) || fallback;
};

const storedFileName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const publicPath = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(value);
  if (publicPath) return publicPath[1];

  // Older calls stored Multer's absolute file path rather than /uploads/...
  const resolved = path.resolve(value);
  if (path.dirname(resolved) === uploadDir && /^[A-Za-z0-9._-]+$/.test(path.basename(resolved))) {
    return path.basename(resolved);
  }
  return null;
};

export const loadResearchCallMedia = async (
  researchCallId: string,
  db: PoolClient | typeof pool = pool,
): Promise<ResearchCallMedia[]> => {
  const result = await db.query(
    `SELECT attachments, file_url FROM research_calls WHERE id = $1`,
    [researchCallId],
  );
  if (!result.rows[0]) throw new Error(`Research call not found: ${researchCallId}`);

  const call = result.rows[0];
  const attachments = Array.isArray(call.attachments) ? call.attachments : [];
  const sources = attachments.length ? attachments : call.file_url ? [{ url: call.file_url }] : [];
  const media: ResearchCallMedia[] = [];
  const seen = new Set<string>();
  const realUploadDir = await fs.realpath(uploadDir);

  for (const attachment of sources) {
    const storedName = storedFileName(attachment?.url);
    if (!storedName || storedName === "." || storedName === ".." || seen.has(storedName)) continue;
    const filePath = path.join(uploadDir, storedName);
    try {
      const [realPath, stat] = await Promise.all([fs.realpath(filePath), fs.stat(filePath)]);
      if (path.dirname(realPath) !== realUploadDir || !stat.isFile()) continue;
      seen.add(storedName);
      media.push({
        filePath: realPath,
        fileName: safeFileName(attachment.name, storedName),
        mimeType: String(attachment.mimeType || "application/octet-stream"),
        size: stat.size,
      });
    } catch (error) {
      console.warn("Research call attachment is unavailable", { researchCallId, file: storedName, error });
    }
  }
  return media;
};

export const sendTelegramMessageWithMedia = async (
  client: TelegramClient,
  entity: any,
  message: string,
  media: ResearchCallMedia[],
): Promise<Array<{ fileName: string; reason: string }>> => {
  const sentMessage = await client.sendMessage(entity, { message });
  const failures: Array<{ fileName: string; reason: string }> = [];
  for (const attachment of media) {
    try {
      await client.sendFile(entity, {
        file: new CustomFile(attachment.fileName, attachment.size, attachment.filePath),
        replyTo: sentMessage.id,
        forceDocument: !attachment.mimeType.startsWith("image/"),
      });
    } catch (error) {
      failures.push({
        fileName: attachment.fileName,
        reason: error instanceof Error ? error.message : "Telegram attachment failed",
      });
    }
  }
  return failures;
};
