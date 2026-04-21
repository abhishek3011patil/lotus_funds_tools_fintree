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
  rd.rejection_reason,

  tu.telegram_user_id,
  tu.telegram_client_name

FROM users u

LEFT JOIN ra_details rd 
  ON rd.user_id = u.id

LEFT JOIN telegram_users tu 
  ON tu.user_id = u.id

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

    const userId = req.user?.id || crypto.randomUUID(); // fallback ID

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM ra_details WHERE email = $1`,
      [data.email]
    );

    if ((existing.rowCount ?? 0) > 0) {
      return res.status(400).json({
        success: false,
        message: "RA already registered with this email",
      });
    }

const toBool = (val: any) => val === "true" || val === true;

const ra = {
  org_name: data.org_name || null,
  short_bio: data.short_bio || null,
  address_line1: data.address_line1 || null,
  address_line2: data.address_line2 || null,

  sebi_reg_no: data.sebi_reg_no || null,
  sebi_start_date: data.sebi_start_date || null,
  sebi_expiry_date: data.sebi_expiry_date || null,

  nism_reg_no: data.nism_reg_no || null,
  nism_valid_till: data.nism_valid_till || null,

  academic_qualification: data.academic_qualification || null,
  professional_qualification: data.professional_qualification || null,

  market_experience: data.market_experience || null,
  expertise: data.expertise || null,
  markets: data.markets || null,

  bank_name: data.bank_name || null,
  account_holder: data.account_holder || null,
  account_number: data.account_number || null,
  ifsc_code: data.ifsc_code || null,

  pan_number: data.pan_number || null,
  address_proof_type: data.address_proof_type || null,
};


const result = await pool.query(
  `INSERT INTO ra_details (
    user_id,
    salutation, first_name, middle_name, surname,
    org_name, designation, short_bio, email, mobile, telephone,
    country, state, city, pincode,
    address_line1, address_line2,
    profile_image,
    sebi_reg_no, sebi_start_date, sebi_expiry_date,
    sebi_certificate, sebi_receipt,
    nism_reg_no, nism_valid_till, nism_certificate,
    academic_qualification, professional_qualification,
    market_experience, expertise, markets,
    bank_name, account_holder, account_number, ifsc_code,
    cancelled_cheque,
    pan_number, pan_card,
    address_proof_type, address_proof_document,
    declare_info_true, consent_verification,
    no_guaranteed_returns, conflict_of_interest,
    personal_trading, sebi_compliance, platform_policy, additional_comments  
  )
  VALUES (
    $1,
    $2,$3,$4,$5,
    $6,$7,$8,$9,$10,$11,
    $12,$13,$14,$15,
    $16,$17,
    $18,
    $19,$20,$21,
    $22,$23,
    $24,$25,$26,
    $27,$28,
    $29,$30,$31,
    $32,$33,$34,$35,
    $36,
    $37,$38,
    $39,$40,
    $41,$42,
    $43,$44,$45,$46,$47,$48
  )
  RETURNING *`,
  [
    userId,

    data.salutation ?? null,
    data.first_name,
    data.middle_name ?? null,
    data.surname,

    ra.org_name,
    data.designation ?? null,
    ra.short_bio,

    data.email,
    data.mobile ?? null,
    data.telephone ?? null,

    data.country ?? null,
    data.state ?? null,
    data.city ?? null,
    data.pincode ?? null,

    ra.address_line1,
    ra.address_line2,

   files?.profile_image?.[0]?.filename ?? null,

    ra.sebi_reg_no,
    ra.sebi_start_date,
    ra.sebi_expiry_date,

    files?.sebi_certificate?.[0]?.filename ?? null,
    files?.sebi_receipt?.[0]?.filename ?? null,

    ra.nism_reg_no,
    ra.nism_valid_till,
    files?.nism_certificate?.[0]?.filename ?? null,

    ra.academic_qualification,
    ra.professional_qualification,
    ra.market_experience,
    ra.expertise,
    ra.markets,

    ra.bank_name,
    ra.account_holder,
    ra.account_number,
    ra.ifsc_code,

    files?.cancelled_cheque?.[0]?.filename ?? null,

    ra.pan_number,
    files?.pan_card?.[0]?.filename ?? null,

    ra.address_proof_type,
    files?.address_proof_document?.[0]?.filename ?? null,

    toBool(data.declare_info_true),
    toBool(data.consent_verification),
    toBool(data.no_guaranteed_returns),
toBool(data.conflict_of_interest),
toBool(data.personal_trading),
toBool(data.sebi_compliance),
toBool(data.platform_policy),
data.additional_comments || data.additionalComments || null
  ]
);
    return res.status(201).json({
      success: true,
      message: "RA Registration Submitted Successfully",
      ra_id: result.rows[0].id,
    });

  } catch (error) {
    console.error("RA Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= APPROVE REGISTRATION ================= */

export const approveRegistration = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // 1. Get RA details
    const raRes = await client.query(
      `SELECT email FROM ra_details WHERE id = $1`,
      [id]
    );

    if (raRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "RA not found" });
    }

    const email = raRes.rows[0].email;

    // 2. Generate username & password
    const username = `ra_${Math.random().toString(36).substring(2, 8)}`;
    const rawPassword = crypto.randomBytes(4).toString("hex");

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 4. Create user
    const userRes = await client.query(
      `INSERT INTO users (username, password_hash, role, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [username, hashedPassword, "RESEARCH_ANALYST", "ACTIVE"]
    );

    const userId = userRes.rows[0].id;

    // 5. Update RA
    await client.query(
      `UPDATE ra_details
       SET status = 'approved',
           user_id = $1,
           rejection_reason = NULL
       WHERE id = $2`,
      [userId, id]
    );

    await client.query("COMMIT");

    // 6. Return credentials (TEMP - later send email)
    res.status(200).json({
      message: "RA approved & account created",
      username,
      password: rawPassword
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found",
      });
    }

    /* ================= VALIDATION ================= */

    const requiredFields = [
      "salutation",
      "first_name",
      "surname",
      "email",
      "mobile",
      "country",
      "state",
      "city",
      "pincode",
      "address1",
      "panNumber",
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === "") {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    /* ================= BOOLEAN FIX ================= */

    const toBool = (val: any) => val === true || val === "true";

    /* ================= QUERY ================= */

    const query = `
      UPDATE ra_details
      SET
        user_id = $1,
        salutation = $2,
        first_name = $3,
        middle_name = $4,
        surname = $5,
        org_name = $6,
        designation = $7,
        short_bio = $8,
        email = $9,
        mobile = $10,
        telephone = $11,
        country = $12,
        state = $13,
        city = $14,
        pincode = $15,
        address_line1 = $16,
        address_line2 = $17,
        profile_image = COALESCE($18, profile_image),
        sebi_reg_no = $19,
        sebi_start_date = $20,
        sebi_expiry_date = $21,
        sebi_certificate = COALESCE($22, sebi_certificate),
        sebi_receipt = COALESCE($23, sebi_receipt),
        nism_reg_no = $24,
        nism_valid_till = $25,
        nism_certificate = COALESCE($26, nism_certificate),
        academic_qualification = $27,
        professional_qualification = $28,
        market_experience = $29,
        expertise = $30,
        markets = $31,
        bank_name = $32,
        account_holder = $33,
        account_number = $34,
        ifsc_code = $35,
        cancelled_cheque = COALESCE($36, cancelled_cheque),
        pan_number = $37,
        pan_card = COALESCE($38, pan_card),
        address_proof_type = $39,
        address_proof_document = COALESCE($40, address_proof_document),
        declare_info_true = $41,
        consent_verification = $42,
        no_guaranteed_returns = $43,
        conflict_of_interest = $44,
        personal_trading = $45,
        sebi_compliance = $46,
        platform_policy = $47,
        additional_comments = $48
      WHERE id = $49
      RETURNING *
    `;

    const values = [
      userId,

      data.salutation.trim(),
      data.first_name.trim(),
      data.middle_name?.trim() || null,
      data.surname.trim(),

      // ✅ FIXED (snake_case)
      data.org_name?.trim() || null,
      data.designation?.trim() || null,
      data.short_bio?.trim() || null,

      data.email.trim().toLowerCase(),
      data.mobile.trim(),
      data.telephone?.trim() || null,

      data.country.trim(),
      data.state.trim(),
      data.city.trim(),
      data.pincode.trim(),

      data.address1.trim(),
      data.address2?.trim() || null,

      files?.profile_image?.[0]?.filename || null,

      // ✅ FIXED names
      data.sebi_reg_no?.trim() || null,
      data.sebi_start_date || null,
      data.sebi_expiry_date || null,

      files?.sebi_certificate?.[0]?.filename || null,
      files?.sebi_receipt?.[0]?.filename || null,

      data.nism_reg_no?.trim() || null,
      data.nism_valid_till || null,
      files?.nism_certificate?.[0]?.filename || null,

      data.academic_qualification?.trim() || null,
      data.professional_qualification?.trim() || null,

      data.market_experience?.trim() || null,
      data.expertise?.trim() || null,
      data.markets?.trim() || null,

      data.bank_name?.trim() || null,
      data.account_holder?.trim() || null,
      data.account_number?.trim() || null,
      data.ifsc_code?.trim() || null,

      files?.cancelled_cheque?.[0]?.filename || null,

      data.panNumber.trim(),
      files?.pan_card?.[0]?.filename || null,

      data.address_proof_type?.trim() || null,
      files?.address_proof_document?.[0]?.filename || null,

      toBool(data.declare_info_true),
      toBool(data.consent_verification),
      toBool(data.no_guaranteed_returns),
      toBool(data.conflict_of_interest),
      toBool(data.personal_trading),
      toBool(data.sebi_compliance),
      toBool(data.platform_policy),

      // ✅ CRITICAL FIX (missing earlier)
      data.additional_comments || null,

      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "RA updated successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Update RA Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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

