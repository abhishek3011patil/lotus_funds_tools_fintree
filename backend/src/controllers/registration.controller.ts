import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";


export const getAllRegistrations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
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
        status
      FROM ra_details
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};

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
      platform_policy,
      additional_comments

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
      $43,$44,$45,$46,$47,$48
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
  data.platformPolicy,
  data.additionalComments,
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