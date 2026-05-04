import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

/* ================= GET ALL REGISTRATIONS ================= */
export const getAllRegistrations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        rd.id,
        rd.user_id,
        first_name,
        rd.surname AS last_name, 
        mobile,
        profile_image,
        pan_card,
        address_proof_document,
        sebi_certificate,
        sebi_receipt,
        nism_certificate,
        cancelled_cheque,
        status,
        rejection_reason,
        tu.telegram_user_id,
        tu.telegram_client_name
      FROM ra_details rd
      LEFT JOIN telegram_users tu ON tu.user_id = rd.user_id
      ORDER BY rd.created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};


/* ================= GET ALL REGISTRATIONS via users table (ACTIVE users with role RESEARCH_ANALYST)================= */

export const getAllRegistrationsActiveUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
     SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  u.username,
  u.role,
  u.status AS user_status,

  rd.id AS ra_id,
  rd.first_name,
  rd.surname,
  rd.mobile,
  rd.profile_image,
  rd.pan_card,
  rd.address_proof_document,
  rd.sebi_certificate,
  rd.sebi_receipt,
  rd.nism_certificate,
  rd.cancelled_cheque,
  rd.status AS ra_status,
  rd.rejection_reason

FROM users u

LEFT JOIN ra_details rd 
  ON rd.user_id = u.id

WHERE u.role = 'RESEARCH_ANALYST'

ORDER BY u.created_at DESC;
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};
/* ================= REGISTER RA ================= */

/* ================= REGISTER RA (FIXED) ================= */

export const registerRA = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body || {};
    const files = req.files as any;

    // ✅ FIX: define userId
    const userId = req.user?.id ?? null;

    // ================= VALIDATION =================
    if (!data.first_name || !data.surname) {
      return res.status(400).json({
        success: false,
        message: "First name and surname are required",
      });
    }

    if (!data.email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    data.email = data.email.trim().toLowerCase();

    // ================= CHECK EXISTING =================
    const existing = await pool.query(
      `SELECT id FROM ra_details WHERE email = $1`,
      [data.email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "RA already registered with this email",
      });
    }

    // ================= BOOL CONVERTER =================
    const toBool = (val: any) => val === "true" || val === true;

    // ================= FILE SAFETY =================
    const profileImage = files?.profile_image?.[0]?.filename ?? null;
    const panCard = files?.pan_card?.[0]?.filename ?? null;
    const addressProof = files?.address_proof_document?.[0]?.filename ?? null;

    // ================= INSERT =================
    const result = await pool.query(
      `
INSERT INTO ra_details (
  user_id,

  -- Step 1: Personal Info
  salutation, first_name, middle_name, surname,
  org_name, designation, short_bio,
  email, mobile, telephone,
  country, state, city, pincode,
  address_line1, address_line2,
  profile_image,

  -- Step 2: Professional & SEBI
  sebi_reg_no, sebi_start_date, sebi_expiry_date,
  sebi_certificate, sebi_receipt,
  nism_reg_no, nism_valid_till, nism_certificate,
  academic_qualification, professional_qualification,
  market_experience, expertise, markets,

  -- Step 3: KYC & Bank
  bank_name, account_holder, account_number, ifsc_code,
  cancelled_cheque,
  pan_number, pan_card,
  address_proof_type, address_proof_document,
  declare_info_true, consent_verification,

  -- Step 4: Declarations
  no_guaranteed_returns, conflict_of_interest,
  personal_trading, sebi_compliance, platform_policy,

  -- Extra
  additional_comments
)
VALUES (
  $1,

  -- Step 1
  $2,$3,$4,$5,
  $6,$7,$8,
  $9,$10,$11,
  $12,$13,$14,$15,
  $16,$17,
  $18,

  -- Step 2
  $19,$20,$21,
  $22,$23,
  $24,$25,$26,
  $27,$28,
  $29,$30,$31,

  -- Step 3
  $32,$33,$34,$35,
  $36,
  $37,$38,
  $39,$40,
  $41,$42,

  -- Step 4
  $43,$44,
  $45,$46,$47,

  -- Extra
  $48
)
RETURNING id;
      `,
        [
  userId,

  // Step 1
  data.salutation ?? null,
  data.first_name,
  data.middle_name ?? null,
  data.surname,

  data.org_name ?? null,
  data.designation ?? null,
  data.short_bio ?? null,

  data.email,
  data.mobile ?? null,
  data.telephone ?? null,

  data.country ?? null,
  data.state ?? null,
  data.city ?? null,
  data.pincode ?? null,

  data.address_line1 ?? null,
  data.address_line2 ?? null,

  files?.profile_image?.[0]?.filename ?? null,

  // Step 2
  data.sebi_reg_no ?? null,
  data.sebi_start_date ?? null,
  data.sebi_expiry_date ?? null,

  files?.sebi_certificate?.[0]?.filename ?? null,
  files?.sebi_receipt?.[0]?.filename ?? null,

  data.nism_reg_no ?? null,
  data.nism_valid_till ?? null,
  files?.nism_certificate?.[0]?.filename ?? null,

  data.academic_qualification ?? null,
  data.professional_qualification ?? null,

  data.market_experience ?? null,
  data.expertise ?? null,
  data.markets ?? null,

  // Step 3
  data.bank_name ?? null,
  data.account_holder ?? null,
  data.account_number ?? null,
  data.ifsc_code ?? null,

  files?.cancelled_cheque?.[0]?.filename ?? null,

  data.pan_number ?? null,
  files?.pan_card?.[0]?.filename ?? null,

  data.address_proof_type ?? null,
  files?.address_proof_document?.[0]?.filename ?? null,

  toBool(data.declare_info_true),
  toBool(data.consent_verification),

  // Step 4
  toBool(data.no_guaranteed_returns),
  toBool(data.conflict_of_interest),
  toBool(data.personal_trading),
  toBool(data.sebi_compliance),
  toBool(data.platform_policy),

  // Extra
  data.additional_comments ?? null
]
    );

    return res.status(201).json({
      success: true,
      message: "RA Registration Submitted",
      ra_id: result.rows[0].id,
    });

  } catch (error: unknown) {
    console.error("REGISTER RA ERROR:", error);

    const message =
      error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: message,
    });
  }
};
/* ================= APPROVE REGISTRATION ================= */

export const approveRegistration = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const username = `ra_${Math.random().toString(36).slice(2, 8)}`;
    const rawPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const result = await client.query(
      `
      WITH new_user AS (
        INSERT INTO users (username, password_hash, role, status)
        VALUES ($1, $2, 'RESEARCH_ANALYST', 'ACTIVE')
        RETURNING id
      )
      UPDATE ra_details
      SET user_id = (SELECT id FROM new_user),
          status = 'approved'
      WHERE id = $3
      RETURNING id, user_id;
      `,
      [username, hashedPassword, id]
    );

    if (result.rowCount === 0) {
      throw new Error("RA not found");
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Approved",
      username,
      password: rawPassword,
      user_id: result.rows[0].user_id,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


/* ================= REJECT USER (RA/BROKER) ================= */
export const rejectUser = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { id, type } = req.params;
    const { reason } = req.body;

    /* ================= VALIDATION ================= */
    if (!id || !type) {
      return res.status(400).json({
        success: false,
        message: "ID and type are required",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason required",
      });
    }

    /* ================= SAFE TYPE HANDLING ================= */
    const safeType = Array.isArray(type) ? type[0] : type;
    const lowerType = safeType.toLowerCase();

    const table =
      lowerType === "ra"
        ? "ra_details"
        : lowerType === "broker"
        ? "broker_details"
        : null;

    if (!table) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    await client.query("BEGIN");

    /* ================= GET DETAILS RECORD ================= */
    const recordRes = await client.query(
      `SELECT id, email FROM ${table} WHERE id = $1`,
      [id]
    );

    if (recordRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: `${lowerType.toUpperCase()} not found`,
      });
    }

    const { email } = recordRes.rows[0];

    /* ================= UPDATE DETAILS TABLE ================= */
    await client.query(
      `
      UPDATE ${table}
      SET status = $1,
          rejection_reason = $2
      WHERE id = $3
      `,
      ["rejected", reason, id]
    );

    /* ================= UPDATE USERS TABLE (FIXED) ================= */
    if (email) {
      await client.query(
        `
        UPDATE users
        SET status = $1
        WHERE LOWER(email) = LOWER($2)
        `,
        ["rejected", email]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `${lowerType.toUpperCase()} rejected successfully`,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};
/* ================= GET SINGLE REGISTRATION ================= */

export const getRegistrationById = async (req: Request, res: Response) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM ra_details WHERE id=$1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Fetch single registration error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ================= Broker id  ================= */
export const getBrokerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM broker_details WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Broker not found" });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Fetch broker error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE RA REGISTRATION ================= */

export const updateRARegistration = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const files = req.files as any;

    const result = await pool.query(
      `
      UPDATE ra_details
      SET
        first_name = $1,
        surname = $2,
        email = $3,
        mobile = $4,
        profile_image = COALESCE($5, profile_image)
      WHERE id = $6
      RETURNING *
      `,
      [
        data.first_name,
        data.surname,
        data.email,
        data.mobile,
        files?.profile_image?.[0]?.filename || null,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE Broker REGISTRATION ================= */

export const updateBroker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const files = req.files as any;

    const query = `
      UPDATE broker_details SET
        legal_name = $1,
        trade_name = $2,
        entity_type = $3,
        incorporation_date = $4,
        pan = $5,
        cin = $6,
        gstin = $7,
        registered_address = $8,
        correspondence_address = $9,
        email = $10,
        mobile = $11,
        website = $12,
        sebi_registration_no = $13,
        registration_category = $14,
        registration_date = $15,
        registration_validity = $16,
        membership_code = $17,
        exchange_nse = $18,
        exchange_bse = $19,
        exchange_smi = $20,
        exchange_ncdex = $21,
        segment_cash = $22,
        segment_fo = $23,
        segment_currency = $24,
        sebi_certificate = COALESCE($25, sebi_certificate),
        exchange_certificates = COALESCE($26, exchange_certificates),
        compliance_officer_name = $27,
        compliance_designation = $28,
        compliance_pan = $29,
        compliance_mobile = $30,
        net_worth = $31,
        auditor_name = $32,
        auditor_membership = $33,
        appointment_letter = COALESCE($34, appointment_letter),
        networth_certificate = COALESCE($35, networth_certificate),
        financial_statements = COALESCE($36, financial_statements),
        ca_certificate = COALESCE($37, ca_certificate),
        authorized_person_name = $38,
        authorized_person_pan = $39,
        authorized_person_designation = $40,
        authorized_person_email = $41,
        authorized_person_aadhaar = $42,
        authorized_person_mobile = $43,
        no_disciplinary_action = $44,
        no_suspension = $45,
        no_criminal_case = $46,
        agree_sebi_circulars = $47,
        agree_code_of_conduct = $48
      WHERE id = $49
      RETURNING *
    `;

    const values = [
      data.legal_name,
      data.trade_name,
      data.entity_type,
      data.incorporation_date,
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
      data.registration_date,
      data.registration_validity,
      data.membership_code,
      data.exchange_nse,
      data.exchange_bse,
      data.exchange_smi,
      data.exchange_ncdex,
      data.segment_cash,
      data.segment_fo,
      data.segment_currency,
      files?.sebi_certificate?.[0]?.filename || null,
      files?.exchange_certificates?.[0]?.filename || null,
      data.compliance_officer_name,
      data.compliance_designation,
      data.compliance_pan,
      data.compliance_mobile,
      data.net_worth,
      data.auditor_name,
      data.auditor_membership,
      files?.appointment_letter?.[0]?.filename || null,
      files?.networth_certificate?.[0]?.filename || null,
      files?.financial_statements?.[0]?.filename || null,
      files?.ca_certificate?.[0]?.filename || null,
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
      id
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Broker not found" });
    }

    res.status(200).json({
      success: true,
      message: "Broker updated successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Update Broker Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const changeRAUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔥 CHANGE PASSWORD HIT");

    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 🔍 fetch user
    const userResult = await pool.query(
      `SELECT id, password_hash, role 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // 🔒 FIXED ROLE CHECK
    if (user.role !== "RESEARCH_ANALYST") {
      return res.status(403).json({ message: "Only Research Analysts allowed" });
    }

    // 🔐 verify password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // 🔐 hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🔄 update
    const updateResult = await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ message: "Password update failed" });
    }

    return res.json({
      success: true,
      message: "Password changed successfully ✅",
    });

  } catch (error) {
    console.error("💥 CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};