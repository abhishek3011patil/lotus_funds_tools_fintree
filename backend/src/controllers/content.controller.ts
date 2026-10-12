import type { Response } from "express";
import fs from "fs";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";

const CONTENT_TYPES = new Set(["BLOG", "VIDEO"]);
const VISIBILITIES = new Set(["SUBSCRIBERS", "PUBLIC"]);
const STATUSES = new Set(["DRAFT", "PUBLISHED"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const normalize = (value: unknown) => String(value || "").trim();

const youtubeVideoId = (value: string): string | null => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) id = parts[1] || "";
      }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

type ContentInput = {
  contentType: string; title: string; summary: string; category: string;
  articleBody: string | null; youtubeUrl: string | null; youtubeVideoId: string | null;
  visibility: string; status: string;
  youtubeChannelUrl: string | null;
};

const youtubeChannelUrl = (value: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtube.com", "m.youtube.com"].includes(host)) return null;
    const first = url.pathname.split("/").filter(Boolean)[0] || "";
    return (first.startsWith("@") || ["channel", "c", "user"].includes(first)) ? url.toString() : null;
  } catch { return null; }
};

const discoverYoutubeChannel = async (videoUrl: string, supplied: string | null) => {
  if (supplied) return supplied;
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return null;
    const data = await response.json() as { author_url?: string };
    return youtubeChannelUrl(String(data.author_url || ""));
  } catch { return null; }
};

const validateInput = (body: Record<string, unknown>): { value?: ContentInput; error?: string } => {
  const contentType = normalize(body.contentType).toUpperCase();
  const title = normalize(body.title);
  const summary = normalize(body.summary);
  const category = normalize(body.category);
  const visibility = normalize(body.visibility).toUpperCase();
  const status = normalize(body.status).toUpperCase();
  const rawArticleBody = normalize(body.articleBody);
  const rawYoutubeUrl = normalize(body.youtubeUrl);
  const rawChannelUrl = normalize(body.youtubeChannelUrl);
  if (!CONTENT_TYPES.has(contentType)) return { error: "Choose Blog or Video." };
  if (title.length < 3 || title.length > 180) return { error: "Title must be between 3 and 180 characters." };
  if (summary.length < 10 || summary.length > 500) return { error: "Summary must be between 10 and 500 characters." };
  if (category.length < 2 || category.length > 80) return { error: "Category must be between 2 and 80 characters." };
  if (!VISIBILITIES.has(visibility)) return { error: "Choose a valid audience." };
  if (!STATUSES.has(status)) return { error: "Choose Draft or Published." };
  if (contentType === "BLOG") {
    if (rawArticleBody.length < 30) return { error: "Blog content must be at least 30 characters." };
    if (rawArticleBody.length > 50000) return { error: "Blog content is too long." };
    return { value: { contentType, title, summary, category, articleBody: rawArticleBody, youtubeUrl: null, youtubeVideoId: null, youtubeChannelUrl: null, visibility, status } };
  }
  const videoId = youtubeVideoId(rawYoutubeUrl);
  if (!videoId) return { error: "Enter a valid YouTube video, Shorts, Live, or youtu.be link." };
  const channelUrl = youtubeChannelUrl(rawChannelUrl);
  if (rawChannelUrl && !channelUrl) return { error: "Enter a valid YouTube channel link." };
  return { value: { contentType, title, summary, category, articleBody: null, youtubeUrl: rawYoutubeUrl, youtubeVideoId: videoId, youtubeChannelUrl: channelUrl, visibility, status } };
};

export const requirePublisher = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Authentication is required." });
    return false;
  }
  const result = await pool.query(
    `SELECT account.role,
       CASE WHEN account.role='RESEARCH_ANALYST' THEN lower(COALESCE(ra.status,''))='approved'
            WHEN account.role='BROKER' THEN lower(COALESCE(broker.status,''))='approved' ELSE false END AS profile_approved
     FROM users account
     LEFT JOIN ra_details ra ON ra.user_id=account.id
     LEFT JOIN broker_details broker ON broker.user_id=account.id
     WHERE account.id=$1 AND account.status='active' AND COALESCE(account.is_active,false)=true LIMIT 1`,
    [req.user.id]
  );
  const actor = result.rows[0];
  if (!actor || !["RESEARCH_ANALYST", "BROKER"].includes(String(actor.role)) || !actor.profile_approved) {
    res.status(403).json({ success: false, message: "An approved RA or broker account is required to manage content." });
    return false;
  }
  return true;
};

const selectContent = `SELECT content.id, content.content_type, content.title, content.summary,
  content.category, content.article_body, content.youtube_url, content.youtube_video_id, content.youtube_channel_url,
  content.visibility, content.status, content.published_at, content.created_at, content.updated_at,
  account.role AS author_role,
  CASE WHEN account.role='BROKER' THEN COALESCE(NULLIF(TRIM(broker.authorized_person_name),''),account.name)
       ELSE COALESCE(NULLIF(TRIM(CONCAT_WS(' ',ra.first_name,ra.surname)),''),account.name) END AS author_name,
  CASE WHEN account.role='BROKER' THEN COALESCE(NULLIF(TRIM(broker.trade_name),''),broker.legal_name)
       ELSE NULLIF(TRIM(ra.org_name),'') END AS author_organization
  FROM insight_content content JOIN users account ON account.id=content.author_user_id
  LEFT JOIN ra_details ra ON ra.user_id=account.id LEFT JOIN broker_details broker ON broker.user_id=account.id`;

export const listMyContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!(await requirePublisher(req, res))) return;
    const result = await pool.query(`${selectContent} WHERE content.author_user_id=$1 ORDER BY content.updated_at DESC`, [req.user!.id]);
    return res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error("LIST CONTENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load content." });
  }
};

export const createContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!(await requirePublisher(req, res))) return;
    const parsed = validateInput(req.body || {});
    if (!parsed.value) return res.status(400).json({ success: false, message: parsed.error });
    const v = parsed.value;
    v.youtubeChannelUrl = v.contentType === "VIDEO" ? await discoverYoutubeChannel(v.youtubeUrl!, v.youtubeChannelUrl) : null;
    const result = await pool.query(
      `INSERT INTO insight_content (author_user_id,content_type,title,summary,category,article_body,youtube_url,youtube_video_id,youtube_channel_url,visibility,status,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $11::varchar='PUBLISHED' THEN NOW() ELSE NULL END) RETURNING id`,
      [req.user!.id,v.contentType,v.title,v.summary,v.category,v.articleBody,v.youtubeUrl,v.youtubeVideoId,v.youtubeChannelUrl,v.visibility,v.status]
    );
    return res.status(201).json({ success: true, id: result.rows[0].id, message: v.status === "PUBLISHED" ? "Content published." : "Draft saved." });
  } catch (error) {
    console.error("CREATE CONTENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to save content." });
  }
};

export const updateContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!(await requirePublisher(req, res))) return;
    const id = String(req.params.id || "");
    if (!UUID_PATTERN.test(id)) return res.status(400).json({ success: false, message: "Invalid content ID." });
    const parsed = validateInput(req.body || {});
    if (!parsed.value) return res.status(400).json({ success: false, message: parsed.error });
    const v = parsed.value;
    v.youtubeChannelUrl = v.contentType === "VIDEO" ? await discoverYoutubeChannel(v.youtubeUrl!, v.youtubeChannelUrl) : null;
    const result = await pool.query(
      `UPDATE insight_content SET content_type=$3,title=$4,summary=$5,category=$6,article_body=$7,youtube_url=$8,
       youtube_video_id=$9,youtube_channel_url=$10,visibility=$11,status=$12,published_at=CASE WHEN $12::varchar='PUBLISHED' THEN COALESCE(published_at,NOW()) ELSE NULL END,updated_at=NOW()
       WHERE id=$1 AND author_user_id=$2 RETURNING id`,
      [id,req.user!.id,v.contentType,v.title,v.summary,v.category,v.articleBody,v.youtubeUrl,v.youtubeVideoId,v.youtubeChannelUrl,v.visibility,v.status]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Content not found." });
    return res.json({ success: true, message: v.status === "PUBLISHED" ? "Content published." : "Draft saved." });
  } catch (error) {
    console.error("UPDATE CONTENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update content." });
  }
};

export const uploadContentImage = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  try {
    if (!(await requirePublisher(req, res))) {
      if (file?.path) fs.unlink(file.path, () => undefined);
      return;
    }
    if (!file) return res.status(400).json({ success: false, message: "Choose an image to upload." });
    await pool.query("INSERT INTO insight_content_images (owner_user_id, filename) VALUES ($1,$2)", [req.user!.id, file.filename]);
    return res.status(201).json({ success: true, filename: file.filename, url: `/uploads/${file.filename}` });
  } catch (error) {
    if (file?.path) fs.unlink(file.path, () => undefined);
    console.error("CONTENT IMAGE UPLOAD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to upload the image." });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!(await requirePublisher(req, res))) return;
    const id = String(req.params.id || "");
    if (!UUID_PATTERN.test(id)) return res.status(400).json({ success: false, message: "Invalid content ID." });
    const result = await pool.query("DELETE FROM insight_content WHERE id=$1 AND author_user_id=$2 RETURNING id", [id,req.user!.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Content not found." });
    return res.json({ success: true, message: "Content deleted." });
  } catch (error) {
    console.error("DELETE CONTENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete content." });
  }
};

export const listClientInsights = async (req: AuthRequest, res: Response) => {
  if (String(req.user?.role || "").toUpperCase() !== "CLIENT") return res.status(403).json({ success: false, message: "Client access is required." });
  try {
    const result = await pool.query(
      `${selectContent} WHERE content.status='PUBLISHED' AND (content.visibility='PUBLIC'
       OR (account.role='RESEARCH_ANALYST' AND EXISTS (SELECT 1 FROM client_ra_subscriptions s WHERE s.client_user_id=$1 AND s.ra_user_id=content.author_user_id AND s.status='ACTIVE' AND s.expires_at>NOW()))
       OR (account.role='BROKER' AND EXISTS (SELECT 1 FROM client_broker_subscriptions s JOIN broker_details b ON b.id=s.broker_id WHERE s.client_user_id=$1 AND b.user_id=content.author_user_id AND s.status='ACTIVE' AND s.expires_at>NOW())))
       ORDER BY content.published_at DESC,content.updated_at DESC`,
      [req.user!.id]
    );
    return res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error("CLIENT INSIGHTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load insights." });
  }
};
