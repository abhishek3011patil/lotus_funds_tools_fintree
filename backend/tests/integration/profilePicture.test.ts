import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() }));
vi.mock("../../src/db", () => ({ pool: { query: mocks.query } }));
vi.mock("fs", async importOriginal => ({ ...await importOriginal<typeof import("fs")>(), promises: { mkdir: mocks.mkdir, writeFile: mocks.writeFile, unlink: mocks.unlink } }));
vi.mock("../../src/middlewares/auth.middleware", () => ({ authenticate: (req: any, res: any, next: any) => {
  if (!req.headers.authorization) return res.sendStatus(401);
  req.user = { id: "signed-in-ra", role: req.headers["x-test-role"] || "RESEARCH_ANALYST" }; next();
} }));
import router from "../../src/routes/profilePicture.routes";
const app = express();
app.use(router);
app.use((error: any, _req: any, res: any, _next: any) => res.status(400).json({ message: error.message }));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
beforeEach(() => {
  vi.resetAllMocks();
  mocks.query.mockImplementation(async (_sql, values) => ({ rows: [{ profile_image: values[0] }] }));
  mocks.mkdir.mockResolvedValue(undefined); mocks.writeFile.mockResolvedValue(undefined); mocks.unlink.mockResolvedValue(undefined);
});
describe("immediate RA profile picture update", () => {
  it("changes only the authenticated RA picture without creating an approval request", async () => {
    const result = await request(app).put("/profile-picture").set("Authorization", "Bearer test").attach("profile_image", png, "photo.png").expect(200);
    expect(result.body.profileImage).toMatch(/^profile-[\da-f-]+\.png$/);
    expect(mocks.query).toHaveBeenCalledTimes(1);
    const [sql, values] = mocks.query.mock.calls[0];
    expect(values).toEqual([result.body.profileImage, "signed-in-ra"]);
    expect(sql).toContain("SET profile_image = $1");
    expect(sql).toContain("u.id = $2");
    expect(sql).toContain("u.is_active = true");
    expect(sql).not.toMatch(/INSERT|profile_update_requests/);
    expect(mocks.unlink).not.toHaveBeenCalled();
  });
  it("requires authentication and RA access before processing files", async () => {
    await request(app).put("/profile-picture").attach("profile_image", png, "photo.png").expect(401);
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").set("x-test-role", "CLIENT").attach("profile_image", png, "photo.png").expect(403);
    expect(mocks.writeFile).not.toHaveBeenCalled(); expect(mocks.query).not.toHaveBeenCalled();
  });
  it("rejects non-images, missing files, extra profile fields, and oversized files", async () => {
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").attach("profile_image", Buffer.from("<html>not an image</html>"), "fake.png").expect(400);
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").expect(400);
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").field("user_id", "another-ra").attach("profile_image", png, "photo.png").expect(400);
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").attach("profile_image", Buffer.alloc(5 * 1024 * 1024 + 1), "photo.png").expect(400);
    expect(mocks.writeFile).not.toHaveBeenCalled(); expect(mocks.query).not.toHaveBeenCalled();
  });
  it("removes the new file when the RA is inactive or missing", async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").attach("profile_image", png, "photo.png").expect(403);
    expect(mocks.unlink).toHaveBeenCalledWith(mocks.writeFile.mock.calls[0][0]);
  });
  it("preserves the previous picture and cleans up if saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.query.mockRejectedValue(new Error("Database unavailable"));
    await request(app).put("/profile-picture").set("Authorization", "Bearer test").attach("profile_image", png, "photo.png").expect(500);
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
    expect(mocks.unlink).toHaveBeenCalledWith(mocks.writeFile.mock.calls[0][0]);
  });
});
