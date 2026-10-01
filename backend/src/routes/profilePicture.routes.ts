import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
import { pool } from "../db";
import { authenticate, AuthRequest } from "../middlewares/auth.middleware";

const router = express.Router();
const MAX_PROFILE_IMAGE_BYTES = 25 * 1024 * 1024;
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROFILE_IMAGE_BYTES, files: 1, fields: 0 },
}).single("profile_image");

router.put("/profile-picture", authenticate, (req: AuthRequest, res, next) => {
  const role = req.user?.role;
  if (!role || !["RESEARCH_ANALYST", "CLIENT", "BROKER"].includes(role)) {
    return res.status(403).json({ message: "Profile picture access requires a Research Analyst, Client, or Broker account." });
  }
  next();
}, rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }), imageUpload, async (req: AuthRequest, res) => {
  const role = req.user?.role;
  if (!role || !["RESEARCH_ANALYST", "CLIENT", "BROKER"].includes(role)) {
    return res.status(403).json({ message: "Profile picture access requires a Research Analyst, Client, or Broker account." });
  }
  const file = req.file;
  if (!file) return res.status(400).json({ message: "Choose a profile picture." });
  const bytes = file.buffer;
  const extension = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "jpg"
    : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png"
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
  if (!extension) return res.status(400).json({ message: "Choose a valid JPG, PNG, or WebP image." });
  const filename = `profile-${randomUUID()}.${extension}`;
  const filePath = path.join(process.cwd(), "uploads", filename);
  let written = false;
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, bytes, { flag: "wx" });
    written = true;
    // Only the signed-in user's picture changes. Other profile fields retain
    // their existing approval flows; no profile update request is created.
    const updateByRole: Record<string, string> = {
      RESEARCH_ANALYST: `UPDATE ra_details profile SET profile_image = $1 FROM users u
       WHERE profile.user_id = u.id AND u.id = $2 AND u.role = 'RESEARCH_ANALYST'
         AND u.is_active = true AND u.status = 'active'
       RETURNING profile.profile_image`,
      CLIENT: `UPDATE client_profiles profile SET profile_image = $1 FROM users u
       WHERE profile.user_id = u.id AND u.id = $2 AND u.role = 'CLIENT'
         AND u.is_active = true AND u.status = 'active'
       RETURNING profile.profile_image`,
      BROKER: `UPDATE broker_details profile SET profile_image = $1 FROM users u
       WHERE profile.user_id = u.id AND u.id = $2 AND u.role = 'BROKER'
         AND u.is_active = true AND u.status = 'active'
       RETURNING profile.profile_image`,
    };
    const result = await pool.query(
      updateByRole[role], [filename, req.user!.id]
    );
    if (!result.rows.length) {
      await fs.unlink(filePath); written = false;
      return res.status(403).json({ message: "An active profile is required." });
    }
    return res.json({ message: "Profile picture updated.", profileImage: filename });
  } catch (error) {
    if (written) await fs.unlink(filePath).catch(() => {});
    console.error("Profile picture update failed", error);
    return res.status(500).json({ message: "Unable to save your picture. Please try again." });
  }
});

export default router;
