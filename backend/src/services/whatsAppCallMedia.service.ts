import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { loadResearchCallMedia } from "./researchCallMedia.service";

// Deliberately disabled during the single-RA trial. Changing this constant is
// the only way to enable WhatsApp media; environment values cannot override it.
export const WHATSAPP_MEDIA_DELIVERY_ENABLED = false;

const supportedDocuments = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

export const sendWhatsAppCallMedia = async ({
  researchCallId,
  destination,
  accessToken,
  phoneNumberId,
  apiVersion,
}: {
  researchCallId: string;
  destination: string;
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}): Promise<{ sent: number; failures: string[] }> => {
  const attachments = await loadResearchCallMedia(researchCallId);
  const failures: string[] = [];
  let sent = 0;

  for (const attachment of attachments) {
    const mimeType = attachment.mimeType === "image/jpg" ? "image/jpeg" : attachment.mimeType;
    const kind = mimeType === "image/jpeg" || mimeType === "image/png"
      ? "image" : supportedDocuments.has(mimeType) ? "document" : null;
    if (!kind) {
      failures.push(`${attachment.fileName}: file type is not supported by WhatsApp media`);
      continue;
    }

    try {
      const form = new FormData();
      form.append("messaging_product", "whatsapp");
      form.append("type", mimeType);
      form.append("file", new Blob([new Uint8Array(await fs.readFile(attachment.filePath))], {
        type: mimeType,
      }), path.basename(attachment.fileName));

      const uploaded = await axios.post<{ id: string }>(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
        form,
        { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000 },
      );
      if (!uploaded.data.id) throw new Error("WhatsApp media upload returned no ID");

      await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: destination,
          type: kind,
          [kind]: kind === "document"
            ? { id: uploaded.data.id, filename: attachment.fileName }
            : { id: uploaded.data.id },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          timeout: 20000,
        },
      );
      sent++;
    } catch (error) {
      failures.push(`${attachment.fileName}: ${error instanceof Error ? error.message : "media delivery failed"}`);
    }
  }
  return { sent, failures };
};
