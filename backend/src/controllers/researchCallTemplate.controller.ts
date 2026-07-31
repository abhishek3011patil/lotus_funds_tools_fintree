import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import {
  RESEARCH_CALL_TEMPLATE_VERSION,
  getResearchCallTemplate,
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
