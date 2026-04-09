import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";

import bcrypt from "bcrypt";
import crypto from "crypto";

/* ================= GET ALL REGISTRATIONS ================= */

export const getAllRegistrations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        rd.id,
        rd.user_id,
        first_name,
        surname,
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


/* ================= REGISTER RA ================= */

export const registerRA = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const data = req.body;
    const files = req.files as any;

    data.noGuaranteedReturns = data.noGuaranteedReturns === "true";
    data.conflictOfInterest = data.conflictOfInterest === "true";
    data.personalTrading = data.personalTrading === "true";
    data.sebiCompliance = data.sebiCompliance === "true";
    data.platformPolicy = data.platformPolicy === "true";
    data.declare1 = data.declare1 === "true";
    data.declare2 = data.declare2 === "true";

    const query = `
    INSERT INTO ra_details (
      user_id,
      salutation,
      first_name,
      middle_name,
      surname,
      org_name,
      designation,
      short_bio,
      email,
      mobile,
      telephone,
      country,
      state,
      city,
      pincode,
      address_line1,
      address_line2,
      profile_image,
      sebi_reg_no,
      sebi_start_date,
      sebi_expiry_date,
      sebi_certificate,
      sebi_receipt,
      nism_reg_no,
      nism_valid_till,
      nism_certificate,
      academic_qualification,
      professional_qualification,
      market_experience,
      expertise,
      markets,
      bank_name,
      account_holder,
      account_number,
      ifsc_code,
      cancelled_cheque,
      pan_number,
      pan_card,
      address_proof_type,
      address_proof_document,
      declare_info_true,
      consent_verification,
      no_guaranteed_returns,
      conflict_of_interest,
      personal_trading,
      sebi_compliance,
      platform_policy
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
      $12,$13,$14,$15,$16,$17,$18,
      $19,$20,$21,$22,$23,
      $24,$25,$26,
      $27,$28,$29,$30,$31,
      $32,$33,$34,$35,$36,
      $37,$38,$39,$40,
      $41,$42,
      $43,$44,$45,$46,$47
    )
    RETURNING id
    `;

    const values = [
      userId,
      data.salutation,
      data.firstName,
      data.middleName,
      data.surname,
      data.orgName,
      data.designation,
      data.shortBio,
      data.email,
      data.mobile,
      data.telephone,
      data.country,
      data.state,
      data.city,
      data.pincode,
      data.address1,
      data.address2,
      files?.profileImage?.[0]?.filename || null,
      data.sebiRegNo,
      data.sebiStartDate,
      data.sebiExpiryDate,
      files?.sebiCert?.[0]?.filename || null,
      files?.sebiReceipt?.[0]?.filename || null,
      data.nismRegNo,
      data.nismValidTill,
      files?.nismCert?.[0]?.filename || null,
      data.academicQual,
      data.profQual,
      data.marketExp,
      data.expertise,
      data.markets,
      data.bankName,
      data.accountHolder,
      data.accountNumber,
      data.ifscCode,
      files?.cancelledCheque?.[0]?.filename || null,
      data.panNumber,
      files?.panCard?.[0]?.filename || null,
      data.addressProofType,
      files?.addressProofDoc?.[0]?.filename || null,
      data.declare1,
      data.declare2,
      data.noGuaranteedReturns,
      data.conflictOfInterest,
      data.personalTrading,
      data.sebiCompliance,
      data.platformPolicy
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
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
      return res.status(400).json({ success: false, message: "ID and type are required" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Rejection reason required" });
    }

    const normalizedType = String(type).toLowerCase();
    let table: "ra_details" | "broker_details";

    if (normalizedType === "ra") table = "ra_details";
    else if (normalizedType === "broker") table = "broker_details";
    else return res.status(400).json({ success: false, message: "Invalid type" });

    await client.query("BEGIN");

    /* ================= FETCH SPECIFIC RECORD ================= */
    const recordRes = await client.query(
      `SELECT id, user_id FROM ${table} WHERE id = $1`,
      [id]
    );

    if (recordRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: `${normalizedType.toUpperCase()} not found` });
    }

    const record = recordRes.rows[0];
    const userId = record.user_id;

    /* ================= REJECT THE RECORD ================= */
    await client.query(
      `UPDATE ${table}
       SET status = 'rejected',
           rejection_reason = $1
       WHERE id = $2`,
      [reason, id]
    );

    /* ================= UPDATE THE USER (SAFE) ================= */
    if (userId) {
      const role = normalizedType === "ra" ? "RESEARCH_ANALYST" : "BROKER";

      const userCheck = await client.query(
        `SELECT id FROM users WHERE id = $1 AND role = $2`,
        [userId, role]
      );

      if (userCheck && userCheck.rowCount && userCheck.rowCount === 1) {
        await client.query(
          `UPDATE users
           SET status = 'REJECTED'
           WHERE id = $1`,
          [userId]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `${normalizedType.toUpperCase()} rejected successfully`
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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
    const data = req.body;
    const files = req.files as any;

    // Convert boolean strings to actual booleans
    data.noGuaranteedReturns = data.noGuaranteedReturns === "true";
    data.conflictOfInterest = data.conflictOfInterest === "true";
    data.personalTrading = data.personalTrading === "true";
    data.sebiCompliance = data.sebiCompliance === "true";
    data.platformPolicy = data.platformPolicy === "true";
    data.declare1 = data.declare1 === "true";
    data.declare2 = data.declare2 === "true";

    const query = `
      UPDATE ra_details
      SET
        salutation = $1,
        first_name = $2,
        middle_name = $3,
        surname = $4,
        org_name = $5,
        designation = $6,
        short_bio = $7,
        email = $8,
        mobile = $9,
        telephone = $10,
        country = $11,
        state = $12,
        city = $13,
        pincode = $14,
        address_line1 = $15,
        address_line2 = $16,
        profile_image = COALESCE($17, profile_image),
        sebi_reg_no = $18,
        sebi_start_date = $19,
        sebi_expiry_date = $20,
        sebi_certificate = COALESCE($21, sebi_certificate),
        sebi_receipt = COALESCE($22, sebi_receipt),
        nism_reg_no = $23,
        nism_valid_till = $24,
        nism_certificate = COALESCE($25, nism_certificate),
        academic_qualification = $26,
        professional_qualification = $27,
        market_experience = $28,
        expertise = $29,
        markets = $30,
        bank_name = $31,
        account_holder = $32,
        account_number = $33,
        ifsc_code = $34,
        cancelled_cheque = COALESCE($35, cancelled_cheque),
        pan_number = $36,
        pan_card = COALESCE($37, pan_card),
        address_proof_type = $38,
        address_proof_document = COALESCE($39, address_proof_document),
        declare_info_true = $40,
        consent_verification = $41,
        no_guaranteed_returns = $42,
        conflict_of_interest = $43,
        personal_trading = $44,
        sebi_compliance = $45,
        platform_policy = $46
      WHERE id = $47
      RETURNING *
    `;

    const values = [
      data.salutation,
      data.first_name,
      data.middle_name,
      data.surname,
      data.org_name,
      data.designation,
      data.short_bio,
      data.email,
      data.mobile,
      data.telephone,
      data.country,
      data.state,
      data.city,
      data.pincode,
      data.address_line1,
      data.address_line2,
      files?.profile_image?.[0]?.filename || null,
      data.sebi_reg_no,
      data.sebi_start_date,
      data.sebi_expiry_date,
      files?.sebi_certificate?.[0]?.filename || null,
      files?.sebi_receipt?.[0]?.filename || null,
      data.nism_reg_no,
      data.nism_valid_till,
      files?.nism_certificate?.[0]?.filename || null,
      data.academic_qualification,
      data.professional_qualification,
      data.market_experience,
      data.expertise,
      data.markets,
      data.bank_name,
      data.account_holder,
      data.account_number,
      data.ifsc_code,
      files?.cancelled_cheque?.[0]?.filename || null,
      data.pan_number,
      files?.pan_card?.[0]?.filename || null,
      data.address_proof_type,
      files?.address_proof_document?.[0]?.filename || null,
      data.declare1,
      data.declare2,
      data.noGuaranteedReturns,
      data.conflictOfInterest,
      data.personalTrading,
      data.sebiCompliance,
      data.platformPolicy,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json({
      success: true,
      message: "RA updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Update RA Error:", error);
    res.status(500).json({ message: "Server error" });
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

