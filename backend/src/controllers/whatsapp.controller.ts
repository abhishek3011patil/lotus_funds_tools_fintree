import { Request, Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";
import axios from "axios";


const normalizePhone = (phone: string): string => {
  let digits = String(phone || "").replace(/\D/g, "");

  // Default local 10-digit number to India.
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits;
};

const isValidPhone = (phone: string): boolean => {
  return /^[1-9]\d{9,14}$/.test(phone);
};

const isAdminRole = (role?: string): boolean => {
  const normalizedRole = String(role || "").toUpperCase();

  return ["ADMIN", "SUPER_ADMIN"].includes(normalizedRole);
};

const resolveRAUserId = (
  req: AuthRequest,
  requestedRAId?: string
): string | null => {
  if (!req.user?.id) {
    return null;
  }

  // Admin can manage participants for a selected RA.
  if (isAdminRole(req.user.role) && requestedRAId) {
    return requestedRAId;
  }

  // RA can manage only their own participants.
  return req.user.id;
};

/* ================= GET PARTICIPANTS ================= */

export const getWhatsAppParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const requestedRAId =
      typeof req.query.raId === "string"
        ? req.query.raId
        : undefined;

    const raUserId = resolveRAUserId(req, requestedRAId);

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const raCheck = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
        AND role = 'RESEARCH_ANALYST'
      `,
      [raUserId]
    );

    if (raCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Research Analyst not found",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        ra_user_id,
        participant_name,
        phone_number,
        consent_confirmed,
        consent_source,
        consent_confirmed_at,
        is_active,
        created_at,
        updated_at
      FROM whatsapp_participants
      WHERE ra_user_id = $1
      ORDER BY created_at DESC
      `,
      [raUserId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get WhatsApp participants error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load WhatsApp participants",
    });
  }
};

/* ================= ADD PARTICIPANT ================= */

export const addWhatsAppParticipant = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      raId,
      participantName,
      phoneNumber,
      consentConfirmed,
      consentSource,
    } = req.body;

    const raUserId = resolveRAUserId(req, raId);

    if (!raUserId || !req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const name = String(participantName || "").trim();
    const phone = normalizePhone(phoneNumber);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Participant name is required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid phone number with country code",
      });
    }

    if (consentConfirmed !== true) {
      return res.status(400).json({
        success: false,
        message:
          "WhatsApp consent confirmation is required",
      });
    }

    const raCheck = await pool.query(
      `
      SELECT id, status
      FROM users
      WHERE id = $1
        AND role = 'RESEARCH_ANALYST'
      `,
      [raUserId]
    );

    if (raCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Research Analyst not found",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO whatsapp_participants
      (
        ra_user_id,
        participant_name,
        phone_number,
        consent_confirmed,
        consent_source,
        consent_confirmed_at,
        is_active,
        created_by
      )
      VALUES
      (
        $1,
        $2,
        $3,
        TRUE,
        $4,
        NOW(),
        TRUE,
        $5
      )
      RETURNING *
      `,
      [
        raUserId,
        name,
        phone,
        String(consentSource || "RA_DECLARATION"),
        req.user.id,
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      action: "WHATSAPP_PARTICIPANT_ADDED",
      module: "WHATSAPP",
      status: "SUCCESS",
      details: {
        raUserId,
        participantId: result.rows[0].id,
        phoneNumber: phone,
      },
    } as any);

    return res.status(201).json({
      success: true,
      message: "WhatsApp participant added",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Add WhatsApp participant error:", error);

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already added for the selected RA",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add WhatsApp participant",
    });
  }
};

/* ================= UPDATE PARTICIPANT ================= */

export const updateWhatsAppParticipant = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const {
      raId,
      participantName,
      phoneNumber,
      isActive,
    } = req.body;

    const raUserId = resolveRAUserId(req, raId);

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const name = String(participantName || "").trim();
    const phone = normalizePhone(phoneNumber);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Participant name is required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const result = await pool.query(
      `
      UPDATE whatsapp_participants
      SET
        participant_name = $1,
        phone_number = $2,
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE id = $4
        AND ra_user_id = $5
      RETURNING *
      `,
      [
        name,
        phone,
        typeof isActive === "boolean" ? isActive : null,
        id,
        raUserId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "WhatsApp participant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "WhatsApp participant updated",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Update WhatsApp participant error:", error);

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already assigned to the RA",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update WhatsApp participant",
    });
  }
};

/* ================= DELETE PARTICIPANT ================= */

export const deleteWhatsAppParticipant = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const requestedRAId =
      typeof req.query.raId === "string"
        ? req.query.raId
        : undefined;

    const raUserId = resolveRAUserId(
      req,
      requestedRAId
    );

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM whatsapp_participants
      WHERE id = $1
        AND ra_user_id = $2
      RETURNING id
      `,
      [id, raUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "WhatsApp participant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "WhatsApp participant removed",
    });
  } catch (error) {
    console.error("Delete WhatsApp participant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove WhatsApp participant",
    });
  }
};

export const getWhatsAppParticipantsByRA = async (
  req: Request,
  res: Response
) => {
  try {
    const { raId } = req.params;

    if (
      !raId ||
      raId === "undefined" ||
      raId === "null"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid RA ID",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        ra_user_id,
        participant_name,
        phone_number,
        consent_confirmed,
        consent_source,
        consent_confirmed_at,
        is_active,
        created_at,
        updated_at
      FROM whatsapp_participants
      WHERE ra_user_id = $1
      ORDER BY participant_name ASC
      `,
      [raId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error(
      "GET WHATSAPP PARTICIPANTS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch WhatsApp participants",
    });
  }
};

export const testWhatsAppMessage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { raId, message } = req.body;

    const raUserId = resolveRAUserId(req, raId);

    if (!raUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const participantsResult = await pool.query(
      `
      SELECT
        participant_name,
        phone_number
      FROM whatsapp_participants
      WHERE ra_user_id = $1
        AND consent_confirmed = TRUE
        AND is_active = TRUE
      ORDER BY participant_name
      `,
      [raUserId]
    );

    if ((participantsResult.rowCount ?? 0) === 0) {
      return res.status(400).json({
        success: false,
        message: "No active WhatsApp participants found",
      });
    }

    let success = 0;
    let failed = 0;

    for (const participant of participantsResult.rows) {
      try {
        const destination = participant.phone_number.replace(/\D/g, "");

        await axios.post(
          `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: destination,
            type: "text",
            text: {
              preview_url: false,
              body: message,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            timeout: 20000,
          }
        );

        success++;
      } catch (err: any) {
        failed++;

        console.error(
          `WhatsApp failed for ${participant.phone_number}`,
          err.response?.data || err.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Test message sent to ${success} participant(s)${
        failed ? ` (${failed} failed)` : ""
      }`,
    });
  } catch (err: any) {
    console.error(
      "TEST WHATSAPP ERROR:",
      err.response?.data || err.message || err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send test WhatsApp message",
    });
  }
};