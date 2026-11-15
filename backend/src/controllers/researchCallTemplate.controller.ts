import type { Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import {
  RESEARCH_CALL_TEMPLATE_VERSION,
  getResearchCallTemplate,
  getBrokerResearchCallTemplate,
  isResearchCallMessageType,
  isValidResearchCallTemplate,
  type ResearchCallMessageType,
} from "../services/researchCallTemplate.service";

const requireResearchAnalyst = (
  req: AuthRequest,
  res: Response
): string | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return null;
  }

  if (req.user.role !== "RESEARCH_ANALYST") {
    res.status(403).json({
      success: false,
      message:
        "Only a Research Analyst can manage message templates",
    });
    return null;
  }

  return req.user.id;
};

export const getResearchCallTemplates = async (
  req: AuthRequest,
  res: Response
) => {
  const raUserId = requireResearchAnalyst(req, res);
  if (!raUserId) {
    return;
  }

  try {
    const messageTypes: ResearchCallMessageType[] = [
      "NEW_CALL",
      "ERRATA",
    ];

    const entries = await Promise.all(
      messageTypes.map(async (messageType) => [
        messageType,
        await getResearchCallTemplate(
          pool,
          raUserId,
          messageType
        ),
      ])
    );

    return res.status(200).json({
      success: true,
      data: Object.fromEntries(entries),
    });
  } catch (error) {
    console.error("GET RA MESSAGE TEMPLATES ERROR:", {
      raUserId,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to load message templates",
    });
  }
};

export const saveResearchCallTemplate = async (
  req: AuthRequest,
  res: Response
) => {
  const raUserId = requireResearchAnalyst(req, res);
  if (!raUserId) {
    return;
  }

  const messageType = String(
    req.params.messageType || ""
  ).toUpperCase();

  if (!isResearchCallMessageType(messageType)) {
    return res.status(400).json({
      success: false,
      message:
        "Message type must be NEW_CALL or ERRATA",
    });
  }

  const template = req.body?.template;
  if (
    !isValidResearchCallTemplate(
      template,
      messageType
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Template is invalid or is missing required fields",
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO ra_message_templates (
          ra_user_id,
          message_type,
          template_version,
          template_data,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
        ON CONFLICT (ra_user_id, message_type)
        DO UPDATE SET
          template_version = EXCLUDED.template_version,
          template_data = EXCLUDED.template_data,
          updated_at = NOW()
        RETURNING
          message_type,
          template_version,
          template_data,
          updated_at
      `,
      [
        raUserId,
        messageType,
        RESEARCH_CALL_TEMPLATE_VERSION,
        JSON.stringify(template),
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Message template saved",
      data: {
        messageType: result.rows[0].message_type,
        templateVersion:
          result.rows[0].template_version,
        template: result.rows[0].template_data,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("SAVE RA MESSAGE TEMPLATE ERROR:", {
      raUserId,
      messageType,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to save message template",
    });
  }
};

export const getNamedResearchCallTemplates = async (req: AuthRequest, res: Response) => {
  const raUserId = requireResearchAnalyst(req, res);
  if (!raUserId) return;
  try {
    const result = await pool.query(
      `SELECT t.id, t.message_type AS "messageType", t.name, t.template_data AS template,
              t.created_at AS "createdAt", t.updated_at AS "updatedAt",
              COALESCE(array_agg(g.group_id) FILTER (WHERE g.group_id IS NOT NULL), ARRAY[]::uuid[]) AS "groupIds"
       FROM ra_named_message_templates t
       LEFT JOIN ra_named_message_template_groups g ON g.template_id=t.id
       WHERE t.ra_user_id=$1
       GROUP BY t.id
       ORDER BY t.message_type, lower(t.name)`, [raUserId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET RA NAMED MESSAGE TEMPLATES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load named message templates" });
  }
};

export const saveNamedResearchCallTemplate = async (req: AuthRequest, res: Response) => {
  const raUserId = requireResearchAnalyst(req, res);
  if (!raUserId) return;
  const messageType = String(req.body?.messageType || "").toUpperCase();
  const name = String(req.body?.name || "").trim().replace(/\s+/g, " ");
  const template = req.body?.template;
  const templateId = req.body?.templateId ? String(req.body.templateId) : null;
  const groupIds: string[] = Array.isArray(req.body?.groupIds) ? [...new Set((req.body.groupIds as unknown[]).map((item: unknown) => String(item)))] : [];
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ success: false, message: "Enter a name between 2 and 100 characters." });
  }
  if (!isResearchCallMessageType(messageType) || !isValidResearchCallTemplate(template, messageType)) {
    return res.status(400).json({ success: false, message: "Select a valid message layout." });
  }
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  if ((templateId && !uuidPattern.test(templateId)) || groupIds.length > 1 || groupIds.some(id => !uuidPattern.test(id))) {
    return res.status(400).json({ success: false, message: "Assign a named template to one audience group only." });
  }
  let db: PoolClient | undefined;
  try {
    db = await pool.connect();
    await db.query("BEGIN");
    const eligibleGroups = await db.query(
      `SELECT id FROM ra_audience_groups WHERE ra_user_id=$1 AND id=ANY($2::uuid[])`,
      [raUserId, groupIds]
    );
    if (eligibleGroups.rowCount !== groupIds.length) {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "A selected group is no longer available." });
    }
    const assignmentConflict = await db.query(
      `SELECT 1 FROM ra_named_message_template_groups assigned
       JOIN ra_named_message_templates other ON other.id=assigned.template_id
       WHERE assigned.group_id=ANY($1::uuid[]) AND other.ra_user_id=$2
         AND other.message_type=$3 AND ($4::uuid IS NULL OR other.id<>$4)
       LIMIT 1`,
      [groupIds, raUserId, messageType, templateId]
    );
    if (assignmentConflict.rowCount) {
      await db.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "Each group can have one template for this message type. Remove the group from its current template first." });
    }
    const result = templateId
      ? await db.query(
          `UPDATE ra_named_message_templates SET name=$3,template_data=$4::jsonb,updated_at=NOW()
           WHERE id=$2 AND ra_user_id=$1 AND message_type=$5
           RETURNING id,message_type AS "messageType",name,template_data AS template,created_at AS "createdAt",updated_at AS "updatedAt"`,
          [raUserId, templateId, name, JSON.stringify(template), messageType]
        )
      : await db.query(
          `INSERT INTO ra_named_message_templates (ra_user_id,message_type,name,template_data)
           VALUES ($1,$2,$3,$4::jsonb)
           RETURNING id,message_type AS "messageType",name,template_data AS template,created_at AS "createdAt",updated_at AS "updatedAt"`,
          [raUserId, messageType, name, JSON.stringify(template)]
        );
    if (!result.rows[0]) {
      await db.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Named template was not found." });
    }
    const saved = result.rows[0];
    await db.query("DELETE FROM ra_named_message_template_groups WHERE template_id=$1", [saved.id]);
    for (const groupId of groupIds) {
      await db.query("INSERT INTO ra_named_message_template_groups (template_id,group_id) VALUES ($1,$2)", [saved.id, groupId]);
    }
    saved.groupIds = groupIds;
    await db.query("COMMIT");
    return res.status(templateId ? 200 : 201).json({ success: true, data: saved });
  } catch (error) {
    if (db) await db.query("ROLLBACK").catch(() => undefined);
    const dbError = error as { code?: string; detail?: string; constraint?: string; message?: string };
    if (dbError.code === "23505") {
      return res.status(409).json({ success: false, message: "A template with this name already exists for this message type." });
    }
    console.error("SAVE RA NAMED MESSAGE TEMPLATE ERROR:", {
      raUserId,
      messageType,
      code: dbError.code,
      constraint: dbError.constraint,
      detail: dbError.detail,
      message: dbError.message,
    });
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV !== "production"
        ? `Unable to save named template: ${dbError.message || "database error"}`
        : "Unable to save named template",
    });
  } finally { db?.release(); }
};

export const deleteNamedResearchCallTemplate = async (req: AuthRequest, res: Response) => {
  const raUserId = requireResearchAnalyst(req, res);
  if (!raUserId) return;
  const templateId = String(req.params.templateId || "");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(templateId)) {
    return res.status(400).json({ success: false, message: "Choose a valid template." });
  }
  const result = await pool.query("DELETE FROM ra_named_message_templates WHERE id=$2 AND ra_user_id=$1 RETURNING id", [raUserId, templateId]);
  if (!result.rows[0]) return res.status(404).json({ success: false, message: "Named template was not found." });
  return res.status(204).send();
};

const requireBroker = (req: AuthRequest, res: Response): string | null => {
  if (!req.user?.id) { res.status(401).json({ success: false, message: "Unauthorized" }); return null; }
  if (String(req.user.role || "").toUpperCase() !== "BROKER") { res.status(403).json({ success: false, message: "Only a Broker can manage broker message templates" }); return null; }
  return req.user.id;
};

export const getBrokerCallTemplates = async (req: AuthRequest, res: Response) => {
  const brokerUserId = requireBroker(req, res); if (!brokerUserId) return;
  try {
    const entries = await Promise.all((["NEW_CALL", "ERRATA"] as ResearchCallMessageType[]).map(async messageType => [messageType, await getBrokerResearchCallTemplate(pool, brokerUserId, messageType)]));
    return res.status(200).json({ success: true, data: Object.fromEntries(entries) });
  } catch (error) {
    console.error("GET BROKER MESSAGE TEMPLATES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load broker message templates" });
  }
};

export const saveBrokerCallTemplate = async (req: AuthRequest, res: Response) => {
  const brokerUserId = requireBroker(req, res); if (!brokerUserId) return;
  const messageType = String(req.params.messageType || "").toUpperCase();
  if (!isResearchCallMessageType(messageType)) return res.status(400).json({ success: false, message: "Message type must be NEW_CALL or ERRATA" });
  const template = req.body?.template;
  if (!isValidResearchCallTemplate(template, messageType, "BROKER")) return res.status(400).json({ success: false, message: "Template is invalid or is missing required broker fields" });
  try {
    const result = await pool.query(
      `INSERT INTO broker_message_templates (broker_user_id,message_type,template_version,template_data,created_at,updated_at)
       VALUES ($1,$2,$3,$4::jsonb,NOW(),NOW())
       ON CONFLICT (broker_user_id,message_type) DO UPDATE SET template_version=EXCLUDED.template_version,template_data=EXCLUDED.template_data,updated_at=NOW()
       RETURNING message_type,template_version,template_data,updated_at`,
      [brokerUserId,messageType,RESEARCH_CALL_TEMPLATE_VERSION,JSON.stringify(template)]
    );
    return res.status(200).json({ success: true, message: "Broker message template saved", data: { messageType: result.rows[0].message_type, templateVersion: result.rows[0].template_version, template: result.rows[0].template_data, updatedAt: result.rows[0].updated_at } });
  } catch (error) {
    console.error("SAVE BROKER MESSAGE TEMPLATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to save broker message template" });
  }
};
