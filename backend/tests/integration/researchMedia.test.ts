import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "crypto";
import { readdir, unlink } from "fs/promises";
import path from "path";

vi.mock("../../src/db", () => ({ pool: { query: vi.fn(), connect: vi.fn() } }));
vi.mock("../../src/utils/auditLogger", () => ({ createAuditLog: vi.fn() }));
vi.mock("../../src/services/deliveryQueue.service", () => ({ queueWhatsAppResearchCall: vi.fn() }));
vi.mock("../../src/services/researchCallTemplate.service", () => ({
  getResearchCallTemplate: vi.fn().mockResolvedValue(null),
  parseResearchCallTemplateSnapshot: vi.fn().mockReturnValue(null),
}));
vi.mock("../../src/services/underlyingStudyPreferences.service", async importOriginal => ({
  ...await importOriginal<typeof import("../../src/services/underlyingStudyPreferences.service")>(),
  recordUnderlyingStudySelections: vi.fn(),
}));

import { pool } from "../../src/db";
import { recommendationUpload } from "../../src/middlewares/upload";
import { createErrata, createResearchCall, getRecommendationHistory, getMyRecommendationHistory } from "../../src/controllers/researchCalls.controller";

const prefix = `media-test-${randomUUID()}`;
const directory = path.resolve(__dirname, "../../uploads");
const testFiles = async () => (await readdir(directory)).filter(name => name.includes(prefix));
let stored: any;
const app = express();
app.use(express.json());
app.use((req, _res, next) => { (req as any).user = { id: "test-ra", role: "RESEARCH_ANALYST" }; next(); });
app.post("/calls", recommendationUpload, createResearchCall);
app.post("/errata", createErrata);
app.get("/all", getRecommendationHistory);
app.get("/my", getMyRecommendationHistory);
app.use((error: any, _req: any, res: any, _next: any) => res.status(400).json({ code: error.code, message: error.message }));

beforeEach(() => {
  stored = null;
  vi.mocked(pool.query).mockImplementation(async (sql: any, values: any) => {
    if (sql.includes("INSERT INTO research_calls")) {
      stored = { id: "test-call", status: values[1], file_url: values[25], attachments: JSON.parse(values[31]) };
      return { rows: [stored], rowCount: 1 } as any;
    }
    if (sql.includes("AS date_time")) return { rows: stored ? [stored] : [] } as any;
    return { rows: [] } as any;
  });
});
afterEach(async () => {
  await Promise.all((await testFiles()).map(name => unlink(path.join(directory, name))));
});

describe("recommendation attachments", () => {
  it("saves every mixed attachment, avoids filename collisions, and returns them in both histories", async () => {
    const response = await request(app).post("/calls").field("status", "DRAFT")
      .attach("files", Buffer.from("image one"), { filename: `${prefix}.png`, contentType: "image/png" })
      .attach("files", Buffer.from("image two"), { filename: `${prefix}.png`, contentType: "image/png" })
      .attach("files", Buffer.from("%PDF-1.4"), { filename: `${prefix}.pdf`, contentType: "application/pdf" });
    expect(response.status).toBe(201);
    expect(stored.attachments).toHaveLength(3);
    expect(new Set(stored.attachments.map((file: any) => file.url)).size).toBe(3);
    expect(await testFiles()).toHaveLength(3);
    expect(stored.attachments[2]).toMatchObject({ name: `${prefix}.pdf`, mimeType: "application/pdf", size: 8 });
    for (const endpoint of ["/all", "/my"]) {
      expect((await request(app).get(endpoint)).body[0].attachments).toEqual(stored.attachments);
    }
  });

  it.each([
    ["doc", "application/msword"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["csv", "text/csv"], ["txt", "text/plain"],
    ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["gif", "image/gif"],
  ])("accepts %s documents", async (extension, contentType) => {
    const response = await request(app).post("/calls")
      .attach("files", Buffer.from("fixture"), { filename: `${prefix}.${extension}`, contentType });
    expect(response.status).toBe(201);
    expect(response.body.attachments).toHaveLength(1);
  });

  it("supports legacy single-file clients", async () => {
    const response = await request(app).post("/calls")
      .attach("file", Buffer.from("image"), { filename: `${prefix}.png`, contentType: "image/png" });
    expect(response.status).toBe(201);
    expect(response.body.file).toBe(stored.file_url);
    expect(response.body.attachments).toHaveLength(1);
  });

  it("rejects more than 10 files across old and new fields and cleans up partial uploads", async () => {
    let submission = request(app).post("/calls")
      .attach("file", Buffer.from("x"), { filename: `${prefix}.png`, contentType: "image/png" });
    for (let index = 0; index < 10; index++) {
      submission = submission.attach("files", Buffer.from("x"), { filename: `${prefix}-${index}.png`, contentType: "image/png" });
    }
    const response = await submission;
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("LIMIT_FILE_COUNT");
    expect(await testFiles()).toEqual([]);
    expect(stored).toBeNull();
  });

  it("rejects oversized files", async () => {
    const response = await request(app).post("/calls")
      .attach("files", Buffer.alloc(5 * 1024 * 1024 + 1), { filename: `${prefix}.pdf`, contentType: "application/pdf" });
    expect(response.body.code).toBe("LIMIT_FILE_SIZE");
    expect(await testFiles()).toEqual([]);
  });

  it.each([["html", "text/html"], ["png", "application/pdf"]])("rejects unsupported or mismatched %s uploads", async (extension, contentType) => {
    const response = await request(app).post("/calls")
      .attach("files", Buffer.from("fixture"), { filename: `${prefix}.${extension}`, contentType });
    expect(response.status).toBe(400);
    expect(await testFiles()).toEqual([]);
  });

  it("removes files when recommendation validation fails", async () => {
    const response = await request(app).post("/calls").field("status", "INVALID")
      .attach("files", Buffer.from("image"), { filename: `${prefix}.png`, contentType: "image/png" });
    expect(response.status).toBe(400);
    await vi.waitFor(async () => expect(await testFiles()).toEqual([]));
  });

  it("preserves every attachment when creating a correction", async () => {
    const attachments = [{ url: "/uploads/chart.png", name: "chart.png" }, { url: "/uploads/report.pdf", name: "report.pdf" }];
    const existing = { id: "original", status: "PUBLISHED", attachments, file_url: "/uploads/chart.png" };
    let copied: any;
    const query = vi.fn(async (sql: string, values?: any[]) => {
      if (sql.includes("FOR UPDATE")) return { rows: [existing], rowCount: 1 };
      if (sql.includes("next_version")) return { rows: [{ next_version: 2 }] };
      if (sql.includes("INSERT INTO research_calls")) {
        copied = JSON.parse(values![36]);
        return { rows: [{ id: "correction", attachments: copied }] };
      }
      return { rows: [] };
    });
    vi.mocked(pool.connect).mockResolvedValue({ query, release: vi.fn() } as never);
    const response = await request(app).post("/errata").send({ call_id: "original", updates: {}, errata_reason: "Correct entry", message_text: "Correction" });
    expect(response.status).toBe(201);
    expect(copied).toEqual(attachments);
  });
});
