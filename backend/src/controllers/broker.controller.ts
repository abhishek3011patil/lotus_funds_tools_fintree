import { Request, Response } from "express";
import { pool } from "../db";

export const createBroker = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const files = req.files as any;

    const sebi_certificate =
      files?.sebi_certificate?.[0]?.filename || null;

    const exchange_certificates =
      files?.exchange_certificates?.map((f: any) => f.filename) || [];

    const appointment_letter =
      files?.appointment_letter?.[0]?.filename || null;

    const networth_certificate =
      files?.networth_certificate?.[0]?.filename || null;

    const financial_statements =
      files?.financial_statements?.[0]?.filename || null;

    const ca_certificate =
      files?.ca_certificate?.[0]?.filename || null;

      const safeDate = (d: string) => (d && d !== "" ? d : null);

    const query = `
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

      role,
      permissions,
      authorized_person_segments,

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
      $48,$49,$50,$51,$52
    )
    RETURNING *;
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

      data.role,
      data.permissions,
      data.authorized_person_segments,

      data.no_disciplinary_action,
      data.no_suspension,
      data.no_criminal_case,
      data.agree_sebi_circulars,
      data.agree_code_of_conduct,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Broker registered successfully",
      broker: result.rows[0],
    });
  } catch (error) {
  console.error("BROKER REGISTRATION ERROR:", error);

  res.status(500).json({
    message: "Server error during broker registration",
    error
  });
}
};