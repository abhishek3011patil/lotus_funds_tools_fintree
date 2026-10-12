import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  loadResearchCallMedia: vi.fn(),
}));

vi.mock("axios", () => ({ default: { post: mocks.post } }));
vi.mock("../../src/services/researchCallMedia.service", () => ({
  loadResearchCallMedia: mocks.loadResearchCallMedia,
}));

import { sendWhatsAppCallMedia } from "../../src/services/whatsAppCallMedia.service";

describe("WhatsApp call attachments (disabled in the worker)", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.loadResearchCallMedia.mockReset();
  });

  it("uploads supported files and sends each using the returned media ID", async () => {
    const filePath = __filename;
    const size = (await fs.stat(filePath)).size;
    mocks.loadResearchCallMedia.mockResolvedValue([
      { filePath, fileName: "chart.png", mimeType: "image/png", size },
      { filePath, fileName: "notes.pdf", mimeType: "application/pdf", size },
    ]);
    mocks.post
      .mockResolvedValueOnce({ data: { id: "image-id" } })
      .mockResolvedValueOnce({ data: { messages: [{ id: "image-message" }] } })
      .mockResolvedValueOnce({ data: { id: "document-id" } })
      .mockResolvedValueOnce({ data: { messages: [{ id: "document-message" }] } });

    const result = await sendWhatsAppCallMedia({
      researchCallId: "call-1", destination: "919876543210", accessToken: "test-token",
      phoneNumberId: "phone-id", apiVersion: "v23.0",
    });

    expect(result).toEqual({ sent: 2, failures: [] });
    expect(mocks.post).toHaveBeenCalledTimes(4);
    expect(mocks.post.mock.calls[0][0]).toContain("/media");
    expect(mocks.post.mock.calls[1][1]).toMatchObject({
      type: "image", image: { id: "image-id" }, to: "919876543210",
    });
    expect(mocks.post.mock.calls[3][1]).toMatchObject({
      type: "document", document: { id: "document-id", filename: "notes.pdf" },
    });
  });

  it("reports unsupported files without attempting to send them", async () => {
    mocks.loadResearchCallMedia.mockResolvedValue([
      { filePath: "unused", fileName: "animation.gif", mimeType: "image/gif", size: 10 },
    ]);
    const result = await sendWhatsAppCallMedia({
      researchCallId: "call-2", destination: "919876543210", accessToken: "test-token",
      phoneNumberId: "phone-id", apiVersion: "v23.0",
    });
    expect(result).toEqual({ sent: 0, failures: ["animation.gif: file type is not supported by WhatsApp media"] });
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
