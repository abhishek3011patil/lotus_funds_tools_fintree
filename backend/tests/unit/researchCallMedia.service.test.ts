import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { loadResearchCallMedia, sendTelegramMessageWithMedia } from "../../src/services/researchCallMedia.service";
import { WHATSAPP_MEDIA_DELIVERY_ENABLED } from "../../src/services/whatsAppCallMedia.service";

const uploadDir = path.resolve(__dirname, "../../uploads");
const filesToRemove: string[] = [];

afterEach(async () => {
  await Promise.all(filesToRemove.splice(0).map(file => fs.unlink(file)));
});

describe("research call media delivery", () => {
  it("loads only saved upload files and preserves their display names", async () => {
    await fs.mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}.pdf`;
    const filePath = path.join(uploadDir, storedName);
    await fs.writeFile(filePath, "sample attachment");
    filesToRemove.push(filePath);

    const db = { query: vi.fn().mockResolvedValue({ rows: [{
      attachments: [
        { url: `/uploads/${storedName}`, name: "Market note.pdf", mimeType: "application/pdf" },
        { url: "/uploads/../secret.pdf", name: "secret.pdf" },
        { url: `/uploads/${storedName}`, name: "duplicate.pdf" },
      ],
      file_url: null,
    }] }) };
    const media = await loadResearchCallMedia(randomUUID(), db as any);

    expect(media).toEqual([{
      filePath,
      fileName: "Market note.pdf",
      mimeType: "application/pdf",
      size: Buffer.byteLength("sample attachment"),
    }]);
  });

  it("sends every file as a reply after the call text without duplicating text on media failure", async () => {
    const client = {
      sendMessage: vi.fn().mockResolvedValue({ id: 42 }),
      sendFile: vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("upload failed")),
    };
    const media = [
      { filePath: "photo.png", fileName: "photo.png", mimeType: "image/png", size: 10 },
      { filePath: "note.pdf", fileName: "note.pdf", mimeType: "application/pdf", size: 20 },
    ];
    const failures = await sendTelegramMessageWithMedia(client as any, "recipient", "Call text", media);

    expect(client.sendMessage).toHaveBeenCalledTimes(1);
    expect(client.sendFile).toHaveBeenCalledTimes(2);
    expect(client.sendFile.mock.calls[0][1]).toMatchObject({ replyTo: 42, forceDocument: false });
    expect(client.sendFile.mock.calls[1][1]).toMatchObject({ replyTo: 42, forceDocument: true });
    expect(failures).toEqual([{ fileName: "note.pdf", reason: "upload failed" }]);
  });

  it("keeps WhatsApp media switched off during the trial", () => {
    expect(WHATSAPP_MEDIA_DELIVERY_ENABLED).toBe(false);
  });
});
