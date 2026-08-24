import { Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../db";
import { createNotification } from "../utils/notification";
import { emailService } from "../services/email";

/* =========================================================
   REGISTER BROKER (POST /api/broker/register-broker)
   ========================================================= */
export const createBroker = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const files = req.files as any;
    const getFile = (key: string) =>
  files?.[key]?.[0]?.filename ?? null;

    const sebi_certificate = getFile("sebi_certificate");
const appointment_letter = getFile("appointment_letter");
const networth_certificate = getFile("networth_certificate");
const financial_statements = getFile("financial_statements");
const ca_certificate = getFile("ca_certificate");
const exchange_certificates =
  files?.exchange_certificates?.map((f: any) => f.filename) || [];

      const safeDate = (d: string) => (d && d !== "" ? d : null);

      const existing = await pool.query(
  "SELECT 1 FROM broker_details WHERE email = $1",
  [data.email]
);

if (existing.rows.length > 0) {
  return res.status(400).json({
    message: "Email already exists",
  });
}

    const registrationToken = crypto.randomBytes(32).toString("hex");
    const registrationTokenHash = crypto
      .createHash("sha256")
      .update(registrationToken)
      .digest("hex");
    const registrationTokenTtlHours = Math.max(
      Number(process.env.REGISTRATION_TOKEN_TTL_HOURS || 24),
      1
    );
    const registrationTokenExpiresAt = new Date(
      Date.now() + registrationTokenTtlHours * 60 * 60 * 1000
    );

    const query = `
    WITH new_broker AS (
      INSERT INTO broker_details (
      user_id,
      legal_name,
      trade_name,
      entity_type,
      incorporation_date,
      pan,
      cin,
      gstin,
      registered_address,
      correspondence_address,
      email,
      mobile,
      website,

      sebi_registration_no,
      registration_category,
      registration_date,
      registration_validity,
      membership_code,

      exchange_nse,
      exchange_bse,
      exchange_smi,
      exchange_ncdex,

      segment_cash,
      segment_fo,
      segment_currency,

      sebi_certificate,
      exchange_certificates,

      compliance_officer_name,
      compliance_designation,
      compliance_pan,
      compliance_mobile,

      net_worth,
      auditor_name,
      auditor_membership,

      appointment_letter,
      networth_certificate,
      financial_statements,
      ca_certificate,

      authorized_person_name,
      authorized_person_pan,
      authorized_person_designation,
      authorized_person_email,
      authorized_person_aadhaar,
      authorized_person_mobile,

      no_disciplinary_action,
      no_suspension,
      no_criminal_case,
      agree_sebi_circulars,
      agree_code_of_conduct
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,
      $19,$20,$21,$22,
      $23,$24,$25,
      $26,$27,
      $28,$29,$30,$31,
      $32,$33,$34,
      $35,$36,$37,$38,
      $39,$40,$41,$42,$43,$44,
      $45,$46,$47,
      $48,$49
    )
      RETURNING *
    ),
    new_application AS (
      INSERT INTO registration_applications (
        applicant_type,
        entity_id,
        user_id,
        email,
        mobile,
        status,
        submitted_at,
        registration_token_hash,
        registration_token_expires_at
      )
      SELECT
        'BROKER',
        new_broker.id,
        new_broker.user_id,
        new_broker.email,
        new_broker.mobile,
        'FORM_SUBMITTED',
        NOW(),
        $50,
        $51
      FROM new_broker
      RETURNING id
    )
    SELECT
      new_broker.*,
      new_application.id AS application_id
    FROM new_broker
    CROSS JOIN new_application;
    `;

    const values = [
      data.user_id,

      data.legal_name,
      data.trade_name,
      data.entity_type,
      safeDate(data.incorporation_date),
      data.pan,
      data.cin,
      data.gstin,
      data.registered_address,
      data.correspondence_address,
      data.email,
      data.mobile,
      data.website,

      data.sebi_registration_no,
      data.registration_category,
      safeDate(data.registration_date),
      data.registration_validity,
      data.membership_code,

      data.exchange_nse,
      data.exchange_bse,
      data.exchange_smi,
      data.exchange_ncdex,

      data.segment_cash,
      data.segment_fo,
      data.segment_currency,

      sebi_certificate,
      exchange_certificates,

      data.compliance_officer_name,
      data.compliance_designation,
      data.compliance_pan,
      data.compliance_mobile,

      data.net_worth,
      data.auditor_name,
      data.auditor_membership,

      appointment_letter,
      networth_certificate,
      financial_statements,
      ca_certificate,

      data.authorized_person_name,
      data.authorized_person_pan,
      data.authorized_person_designation,
      data.authorized_person_email,
      data.authorized_person_aadhaar,
      data.authorized_person_mobile,

      data.no_disciplinary_action,
      data.no_suspension,
      data.no_criminal_case,
      data.agree_sebi_circulars,
      data.agree_code_of_conduct,
      registrationTokenHash,
      registrationTokenExpiresAt,
    ];

      const result = await pool.query(query, values);
      const broker = result.rows[0];

await createNotification({
  source: "Dashboard",
  title: "New Broker Registration",
  description: `${broker.legal_name} submitted a registration request.`,
  notificationType: "BROKER",
  referenceId: broker.id,
  referenceTable: "broker_details",
});

    try {
      await emailService.send(
        "BROKER_REGISTRATION_RECEIVED",
        broker.email,
        {
          name: broker.legal_name,
        }
      );
    } catch (emailError) {
      console.error(
        "BROKER REGISTRATION EMAIL ERROR:",
        emailError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Broker registration submitted. Select a subscription plan to continue.",
      broker,
      application_id: broker.application_id,
      registration_token: registrationToken,
      registration_token_expires_at:
        registrationTokenExpiresAt.toISOString(),
      next_step: "SELECT_SUBSCRIPTION_PLAN",
    });

  } catch (error: any) {
    console.error("BROKER REGISTRATION ERROR:", error);

    // ✅ STEP 2: HANDLE DB UNIQUE ERROR (SAFETY NET)
    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email already exists. Cannot register again.",
      });
    }

    return res.status(500).json({
      message: "Server error during broker registration",
    });
  }
};

/* =========================================================
   GET ALL BROKERS (GET /api/broker/all-brokers)
   ========================================================= */
export const getAllBrokers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        broker.*,
        application.id AS application_id,
        application.status AS application_status,
        subscription.id AS subscription_id,
        subscription.status AS subscription_status,
        subscription.starts_at AS subscription_starts_at,
        subscription.expires_at AS subscription_expires_at,
        plan.display_name AS subscription_plan_name,
        users.status AS user_status,
        (
          application.status = 'PAID_PENDING_APPROVAL'
          AND subscription.status = 'PAID_PENDING_APPROVAL'
        ) AS approval_ready
      FROM broker_details broker
      LEFT JOIN LATERAL (
        SELECT registration_application.*
        FROM registration_applications registration_application
        WHERE registration_application.entity_id = broker.id
          AND registration_application.applicant_type = 'BROKER'
        ORDER BY registration_application.created_at DESC
        LIMIT 1
      ) application ON true
      LEFT JOIN LATERAL (
        SELECT broker_subscription.*
        FROM subscriptions broker_subscription
        WHERE broker_subscription.registration_application_id = application.id
        ORDER BY broker_subscription.created_at DESC
        LIMIT 1
      ) subscription ON true
      LEFT JOIN subscription_plans plan
        ON plan.id = subscription.plan_id
      LEFT JOIN users
        ON users.id = broker.user_id
      ORDER BY broker.created_at DESC
    `);
    const brokers = result.rows.map((b) => ({
  ...b,
  exchange_certificates: Array.isArray(b.exchange_certificates)
    ? b.exchange_certificates
    : typeof b.exchange_certificates === "string"
    ? b.exchange_certificates.replace(/[{}]/g, "").split(",")
    : [],
}));

res.status(200).json(brokers);
  } catch (error) {
    console.error("GET ALL BROKERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch brokers" });
  }
};
