import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { pool } from "../db";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { createAuditLog } from "../utils/auditLogger";
import axios from "axios";



const normalizeRAUpdateData = (data: any) => {
  if (data.email) data.email = data.email.trim().toLowerCase();
  if (data.mobile) data.mobile = data.mobile.trim();
  if (data.sebi_reg_no) data.sebi_reg_no = data.sebi_reg_no.trim().toUpperCase();
  if (data.nism_reg_no) data.nism_reg_no = data.nism_reg_no.trim().toUpperCase();
  if (data.pan_number) data.pan_number = data.pan_number.trim().toUpperCase();
};

const checkRADuplicatesForUpdate = async (
  data: any,
  currentRAId: string
) => {
  if (data.email) {
    const r = await pool.query(
      `SELECT 1 FROM ra_details WHERE email = $1 AND id <> $2 LIMIT 1`,
      [data.email, currentRAId]
    );
    if ((r.rowCount ?? 0) > 0) {
      return { field: "email", message: "Email is already registered." };
    }
  }

  if (data.mobile) {
  const r = await pool.query(
    `
    SELECT 1
    FROM ra_details
    WHERE TRIM(mobile) = TRIM($1)
      AND id <> $2
    LIMIT 1
    `,
    [data.mobile, currentRAId]


  );

 
  

  if ((r.rowCount ?? 0) > 0) {
    return {
      field: "mobile",
      message: "Mobile number is already registered.",
    };
  }
}

  if (data.sebi_reg_no) {
    const r = await pool.query(
      `SELECT 1 FROM ra_details WHERE UPPER(TRIM(sebi_reg_no)) = UPPER(TRIM($1)) AND id <> $2 LIMIT 1`,
      [data.sebi_reg_no, currentRAId]
    );
    if ((r.rowCount ?? 0) > 0) {
      return { field: "sebi_reg_no", message: "SEBI Registration Number already exists." };
    }
  }

  if (data.nism_reg_no) {
    const r = await pool.query(
      `SELECT 1 FROM ra_details WHERE UPPER(TRIM(nism_reg_no)) = UPPER(TRIM($1)) AND id <> $2 LIMIT 1`,
      [data.nism_reg_no, currentRAId]
    );
    if ((r.rowCount ?? 0) > 0) {
      return { field: "nism_reg_no", message: "NISM Registration Number already exists." };
    }
  }

  if (data.pan_number) {
    const r = await pool.query(
      `SELECT 1 FROM ra_details WHERE UPPER(TRIM(pan_number)) = UPPER(TRIM($1)) AND id <> $2 LIMIT 1`,
      [data.pan_number, currentRAId]
    );
    if ((r.rowCount ?? 0) > 0) {
      return { field: "pan_number", message: "PAN number is already registered." };
    }
  }

  return null;
};


/* ================= GET CLIENT IP ================= */

const getClientIp = (req: Request) => {
  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  // if multiple IPs exist
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // convert IPv6 localhost
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // remove IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};

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
      LEFT JOIN LATERAL (
  SELECT telegram_user_id, telegram_client_name
  FROM telegram_users
  WHERE telegram_users.user_id = rd.user_id
  LIMIT 1
) tu ON true
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
  u.suspended_reason,

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

  COALESCE(rpur.pending_requests, 0) AS pending_requests

FROM users u

LEFT JOIN ra_details rd
  ON rd.user_id = u.id

LEFT JOIN (
  SELECT
    ra_user_id,
    COUNT(*) AS pending_requests
  FROM ra_profile_update_requests
  WHERE status = 'PENDING'
  GROUP BY ra_user_id
) rpur
  ON rpur.ra_user_id = u.id

WHERE u.role = 'RESEARCH_ANALYST'

ORDER BY u.created_at DESC
`);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};
/* ================= REGISTER RA ================= */

/* ================= REGISTER RA (FIXED) ================= */

// export const registerRA = async (req: AuthRequest, res: Response) => {
//   try {
//     const data = req.body || {};
//     const files = req.files as any;

//     // ✅ FIX: define userId
//     const userId = req.user?.id ?? null;

//     // ================= VALIDATION =================
//     if (!data.first_name || !data.surname) {
//       return res.status(400).json({
//         success: false,
//         message: "First name and surname are required",
//       });
//     }

//     if (!data.email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     data.email = data.email.trim().toLowerCase();
//     data.mobile = data.mobile?.trim();
// data.sebi_reg_no = data.sebi_reg_no?.trim().toUpperCase();
// data.nism_reg_no = data.nism_reg_no?.trim().toUpperCase();
// data.pan_number = data.pan_number?.trim().toUpperCase();

//     // ================= CHECK EXISTING =================
//     const existing = await pool.query(
//       `SELECT id FROM ra_details WHERE email = $1`,
//       [data.email]
//     );

//     if (existing.rowCount && existing.rowCount > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "RA already registered with this email",
//       });
//     }

//     // ================= CHECK DUPLICATES =================

// // Mobile duplicate check
// if (data.mobile) {
//   const mobileExists = await pool.query(
//     `
//     SELECT 1
//     FROM (
//       SELECT mobile FROM ra_details WHERE mobile IS NOT NULL
//       UNION
//       SELECT mobile FROM broker_details WHERE mobile IS NOT NULL
//     ) t
//     WHERE mobile = $1
//     LIMIT 1
//     `,
//     [data.mobile.trim()]
//   );

//   if ((mobileExists.rowCount ?? 0) > 0) {
//     return res.status(400).json({
//       success: false,
//       field: "mobile",
//       message: "Mobile number is already registered",
//     });
//   }
// }

// // SEBI duplicate check
// if (data.sebi_reg_no) {
//   const sebiExists = await pool.query(
//     `
//     SELECT 1
//     FROM ra_details
//     WHERE UPPER(TRIM(sebi_reg_no)) = UPPER(TRIM($1))
//     LIMIT 1
//     `,
//     [data.sebi_reg_no]
//   );

//   if ((sebiExists.rowCount ?? 0) > 0) {
//     return res.status(400).json({
//       success: false,
//       field: "sebi_reg_no",
//       message: "SEBI Registration Number already exists",
//     });
//   }
// }

// // NISM duplicate check
// if (data.nism_reg_no) {
//   const nismExists = await pool.query(
//     `
//     SELECT 1
//     FROM ra_details
//     WHERE UPPER(TRIM(nism_reg_no)) = UPPER(TRIM($1))
//     LIMIT 1
//     `,
//     [data.nism_reg_no]
//   );

//   if ((nismExists.rowCount ?? 0) > 0) {
//     return res.status(400).json({
//       success: false,
//       field: "nism_reg_no",
//       message: "NISM Registration Number already exists",
//     });
//   }
// }

// // PAN duplicate check
// if (data.pan_number) {
//   const panExists = await pool.query(
//     `
//     SELECT 1
//     FROM ra_details
//     WHERE UPPER(TRIM(pan_number)) = UPPER(TRIM($1))
//     LIMIT 1
//     `,
//     [data.pan_number]
//   );

//   if ((panExists.rowCount ?? 0) > 0) {
//     return res.status(400).json({
//       success: false,
//       field: "pan_number",
//       message: "PAN number is already registered",
//     });
//   }
// }

//     // ================= BOOL CONVERTER =================
//     const toBool = (val: any) => val === "true" || val === true;

//     const requiredDeclarations = [
//   "declare_info_true",
//   "consent_verification",
//   "no_guaranteed_returns",
//   "conflict_of_interest",
//   "personal_trading",
//   "sebi_compliance",
//   "platform_policy",
// ];

// for (const field of requiredDeclarations) {
//   if (!toBool(data[field])) {
//     return res.status(400).json({
//       success: false,
//       message: "Please accept all mandatory declarations",
//     });
//   }
// }

//     // ================= FILE SAFETY =================
//     const profileImage = files?.profile_image?.[0]?.filename ?? null;
//     const panCard = files?.pan_card?.[0]?.filename ?? null;
//     const addressProof = files?.address_proof_document?.[0]?.filename ?? null;

//     // ================= INSERT =================
//     const result = await pool.query(
//       `
// INSERT INTO ra_details (
//   user_id,

//   -- Step 1: Personal Info
//   salutation, first_name, middle_name, surname,
//   org_name, designation, short_bio,
//   email, mobile, telephone,
//   country, state, city, pincode,
//   address_line1, address_line2,
//   profile_image,

//   -- Step 2: Professional & SEBI
//   sebi_reg_no, sebi_start_date, sebi_expiry_date,
//   sebi_certificate, sebi_receipt,
//   nism_reg_no, nism_valid_till, nism_certificate,
//   academic_qualification, professional_qualification,
//   market_experience, expertise, markets,

//   -- Step 3: KYC & Bank
//   bank_name, account_holder, account_number, ifsc_code,
//   cancelled_cheque,
//   pan_number, pan_card,
//   address_proof_type, address_proof_document,
//   declare_info_true, consent_verification,

//   -- Step 4: Declarations
//   no_guaranteed_returns, conflict_of_interest,
//   personal_trading, sebi_compliance, platform_policy,

//   -- Extra
//   additional_comments
// )
// VALUES (
//   $1,

//   -- Step 1
//   $2,$3,$4,$5,
//   $6,$7,$8,
//   $9,$10,$11,
//   $12,$13,$14,$15,
//   $16,$17,
//   $18,

//   -- Step 2
//   $19,$20,$21,
//   $22,$23,
//   $24,$25,$26,
//   $27,$28,
//   $29,$30,$31,

//   -- Step 3
//   $32,$33,$34,$35,
//   $36,
//   $37,$38,
//   $39,$40,
//   $41,$42,

//   -- Step 4
//   $43,$44,
//   $45,$46,$47,

//   -- Extra
//   $48
// )
// RETURNING id;
//       `,
//         [
//   userId,

//   // Step 1
//   data.salutation ?? null,
//   data.first_name,
//   data.middle_name ?? null,
//   data.surname,

//   data.org_name ?? null,
//   data.designation ?? null,
//   data.short_bio ?? null,

//   data.email,
//   data.mobile ?? null,
//   data.telephone ?? null,

//   data.country ?? null,
//   data.state ?? null,
//   data.city ?? null,
//   data.pincode ?? null,

//   data.address_line1 ?? null,
//   data.address_line2 ?? null,

//   files?.profile_image?.[0]?.filename ?? null,

//   // Step 2
//   data.sebi_reg_no ?? null,
//   data.sebi_start_date ?? null,
//   data.sebi_expiry_date ?? null,

//   files?.sebi_certificate?.[0]?.filename ?? null,
//   files?.sebi_receipt?.[0]?.filename ?? null,

//   data.nism_reg_no ?? null,
//   data.nism_valid_till ?? null,
//   files?.nism_certificate?.[0]?.filename ?? null,

//   data.academic_qualification ?? null,
//   data.professional_qualification ?? null,

//   data.market_experience ?? null,
//   data.expertise ?? null,
//   data.markets ?? null,

//   // Step 3
//   data.bank_name ?? null,
//   data.account_holder ?? null,
//   data.account_number ?? null,
//   data.ifsc_code ?? null,

//   files?.cancelled_cheque?.[0]?.filename ?? null,

//   data.pan_number ?? null,
//   files?.pan_card?.[0]?.filename ?? null,

//   data.address_proof_type ?? null,
//   files?.address_proof_document?.[0]?.filename ?? null,

//   toBool(data.declare_info_true),
//   toBool(data.consent_verification),

//   // Step 4
//   toBool(data.no_guaranteed_returns),
//   toBool(data.conflict_of_interest),
//   toBool(data.personal_trading),
//   toBool(data.sebi_compliance),
//   toBool(data.platform_policy),

//   // Extra
//   data.additional_comments ?? null
// ]
//     );

//     await createAuditLog({
//   adminId: req.user?.id || undefined,
//   adminName: req.user?.name || data.first_name || "RA",
//   adminRole: req.user?.role || "RESEARCH_ANALYST",
//   action: "RA_REGISTERED",
//   module: "REGISTRATION",
//   targetEntity: data.email,
//   targetType: "RA",
//   description: "RA registration submitted",
//   status: "SUCCESS",
//   ipAddress: getClientIp(req),
//   device: req.headers["user-agent"] as string,
//   oldValue: null,
//   newValue: {
//     raId: result.rows[0].id,
//     email: data.email,
//     name: `${data.first_name} ${data.surname}`,
//     sebiRegNo: data.sebi_reg_no || null,
//   },
// });

//     return res.status(201).json({
//       success: true,
//       message: "RA Registration Submitted",
//       ra_id: result.rows[0].id,
//     });

//   } catch (error: unknown) {
    

//     const constraintMap: Record<string, { field: string; message: string }> = {
//   users_email_unique: {
//     field: "email",
//     message: "Email is already registered.",
//   },
//   ra_mobile_unique: {
//     field: "mobile",
//     message: "Mobile number is already registered.",
//   },
//   ra_sebi_unique: {
//     field: "sebi_reg_no",
//     message: "SEBI Registration Number already exists.",
//   },
//   ra_nism_unique: {
//     field: "nism_reg_no",
//     message: "NISM Registration Number already exists.",
//   },
//   ra_pan_unique: {
//     field: "pan_number",
//     message: "PAN number is already registered.",
//   },
// };

// if ((error as any).code === "23505") {
//   const constraint = (error as any).constraint;
//   const mapped = constraintMap[constraint];

//   return res.status(409).json({
//     success: false,
//     field: mapped?.field,
//     message: mapped?.message || "Duplicate record found.",
//   });
// }
//     console.error("REGISTER RA ERROR:", error);

//     const message =
//       error instanceof Error ? error.message : String(error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: message,
//     });
//   }
// };


export const registerRA = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body || {};
    const files = req.files as any;

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
        field: "email",
        message: "Email is required",
      });
    }

    data.email = data.email.trim().toLowerCase();
    data.mobile = data.mobile?.trim();
    data.sebi_reg_no = data.sebi_reg_no?.trim().toUpperCase();
    data.nism_reg_no = data.nism_reg_no?.trim().toUpperCase();
    data.pan_number = data.pan_number?.trim().toUpperCase();

    // ================= CHECK EXISTING EMAIL =================
    const existing = await pool.query(
      `SELECT id FROM ra_details WHERE email = $1 LIMIT 1`,
      [data.email]
    );

    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({
        success: false,
        field: "email",
        message: "RA already registered with this email",
      });
    }

    // ================= CHECK DUPLICATES =================

    if (data.mobile) {
      const mobileExists = await pool.query(
        `
        SELECT 1
        FROM (
          SELECT mobile FROM ra_details WHERE mobile IS NOT NULL
          UNION
          SELECT mobile FROM broker_details WHERE mobile IS NOT NULL
        ) t
        WHERE TRIM(mobile) = TRIM($1)
        LIMIT 1
        `,
        [data.mobile]
      );

      if ((mobileExists.rowCount ?? 0) > 0) {
        return res.status(409).json({
          success: false,
          field: "mobile",
          message: "Mobile number is already registered",
        });
      }
    }

    if (data.sebi_reg_no) {
      const sebiExists = await pool.query(
        `
        SELECT 1
        FROM ra_details
        WHERE UPPER(TRIM(sebi_reg_no)) = UPPER(TRIM($1))
        LIMIT 1
        `,
        [data.sebi_reg_no]
      );

      if ((sebiExists.rowCount ?? 0) > 0) {
        return res.status(409).json({
          success: false,
          field: "sebi_reg_no",
          message: "SEBI Registration Number already exists",
        });
      }
    }

    if (data.nism_reg_no) {
      const nismExists = await pool.query(
        `
        SELECT 1
        FROM ra_details
        WHERE UPPER(TRIM(nism_reg_no)) = UPPER(TRIM($1))
        LIMIT 1
        `,
        [data.nism_reg_no]
      );

      if ((nismExists.rowCount ?? 0) > 0) {
        return res.status(409).json({
          success: false,
          field: "nism_reg_no",
          message: "NISM Registration Number already exists",
        });
      }
    }

    if (data.pan_number) {
      const panExists = await pool.query(
        `
        SELECT 1
        FROM ra_details
        WHERE UPPER(TRIM(pan_number)) = UPPER(TRIM($1))
        LIMIT 1
        `,
        [data.pan_number]
      );

      if ((panExists.rowCount ?? 0) > 0) {
        return res.status(409).json({
          success: false,
          field: "pan_number",
          message: "PAN number is already registered",
        });
      }
    }

    // ================= BOOL CONVERTER =================
    const toBool = (val: any) => val === "true" || val === true;

    const requiredDeclarations = [
      "declare_info_true",
      "consent_verification",
      "no_guaranteed_returns",
      "conflict_of_interest",
      "personal_trading",
      "sebi_compliance",
      "platform_policy",
    ];

    for (const field of requiredDeclarations) {
      if (!toBool(data[field])) {
        return res.status(400).json({
          success: false,
          message: "Please accept all mandatory declarations",
        });
      }
    }

    // ================= INSERT =================
    const result = await pool.query(
      `
      INSERT INTO ra_details (
        user_id,

        salutation, first_name, middle_name, surname,
        org_name, designation, short_bio,
        email, mobile, telephone,
        country, state, city, pincode,
        address_line1, address_line2,
        profile_image,

        sebi_reg_no, sebi_start_date, sebi_expiry_date,
        sebi_certificate, sebi_receipt,
        nism_reg_no, nism_valid_till, nism_certificate,
        academic_qualification, professional_qualification,
        market_experience, expertise, markets,

        bank_name,bank_branch, account_holder, account_number, ifsc_code,
        cancelled_cheque,
        pan_number, pan_card,
        address_proof_type, address_proof_document,
        declare_info_true, consent_verification,

        no_guaranteed_returns, conflict_of_interest,
        personal_trading, sebi_compliance, platform_policy,

        additional_comments
      )
      VALUES (
        $1,

        $2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,
        $18,

        $19,$20,$21,
        $22,$23,
        $24,$25,$26,
        $27,$28,
        $29,$30,$31,

        $32,$33,$34,$35,$36,
        $37,
        $38,$39,
        $40,$41,
        $42,$43,
        $44,$45,
        $46,$47,$48,$49,
        $50
      )
      RETURNING id;
      `,
      [
        userId,

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

        data.bank_name ?? null,
        data.bank_branch ?? null,
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

        toBool(data.no_guaranteed_returns),
        toBool(data.conflict_of_interest),
        toBool(data.personal_trading),
        toBool(data.sebi_compliance),
        toBool(data.platform_policy),

        data.additional_comments ?? null,
      ]
    );

    await createAuditLog({
      adminId: req.user?.id || undefined,
      adminName: req.user?.name || data.first_name || "RA",
      adminRole: req.user?.role || "RESEARCH_ANALYST",
      action: "RA_REGISTERED",
      module: "REGISTRATION",
      targetEntity: data.email,
      targetType: "RA",
      description: "RA registration submitted",
      status: "SUCCESS",
      ipAddress: getClientIp(req),
      device: req.headers["user-agent"] as string,
      oldValue: null,
      newValue: {
        raId: result.rows[0].id,
        email: data.email,
        name: `${data.first_name} ${data.surname}`,
        sebiRegNo: data.sebi_reg_no || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "RA Registration Submitted",
      ra_id: result.rows[0].id,
    });
  } catch (error: unknown) {
    const constraintMap: Record<string, { field: string; message: string }> = {
      ra_email_unique: {
        field: "email",
        message: "RA already registered with this email.",
      },
      ra_mobile_unique: {
        field: "mobile",
        message: "Mobile number is already registered.",
      },
      ra_sebi_unique: {
        field: "sebi_reg_no",
        message: "SEBI Registration Number already exists.",
      },
      ra_nism_unique: {
        field: "nism_reg_no",
        message: "NISM Registration Number already exists.",
      },
      ra_pan_unique: {
        field: "pan_number",
        message: "PAN number is already registered.",
      },
    };

    if ((error as any).code === "23505") {
      const constraint = (error as any).constraint;
      const mapped = constraintMap[constraint];

      return res.status(409).json({
        success: false,
        field: mapped?.field,
        message: mapped?.message || "Duplicate record found.",
      });
    }

    console.error("REGISTER RA ERROR:", error);

    const message = error instanceof Error ? error.message : String(error);

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
        VALUES ($1, $2, 'RESEARCH_ANALYST', 'active')
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

    await createAuditLog({
  adminId: (req as AuthRequest).user?.id,

  adminName: (req as AuthRequest).user?.name || "ADMIN",

  adminRole: (req as AuthRequest).user?.role || "ADMIN",

  action: "APPROVE",

  module: "RA",

  targetEntity: username,

  targetType: "RA",

  description: "RA approved by admin",

  status: "SUCCESS",

 ipAddress: getClientIp(req),

  device: req.headers["user-agent"] as string,

  newValue: {
    status: "approved",
    username,
  },
});

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
export const rejectUser = async (req: AuthRequest, res: Response) => {
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

    /* ================= CREATE AUDIT LOG ================= */

await createAuditLog({
  adminId: req.user?.id || undefined,

  adminName: req.user?.name || "ADMIN",

  adminRole: req.user?.role || "ADMIN",

  action: "REJECT",

  module: lowerType.toUpperCase(),

  targetEntity: email,

  targetType: lowerType.toUpperCase(),

  description: `${lowerType.toUpperCase()} rejected by admin`,

  status: "SUCCESS",

  reason: reason,

ipAddress: getClientIp(req),

  device: req.headers["user-agent"] as string | undefined,

  oldValue: {
    status: "pending",
  },

  newValue: {
    status: "rejected",
    rejection_reason: reason,
  },
});

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
    //console.log(req.files);
    const idParam = req.params.id;

if (!idParam) {
  return res.status(400).json({
    success: false,
    message: "Invalid RA ID",
  });
}

const id = String(idParam);
    const data = req.body || {};
    const files = req.files as any;
    normalizeRAUpdateData(data);

    const oldData = await pool.query(
  `SELECT * FROM ra_details WHERE id = $1`,
  [id]
);

    if (oldData.rowCount === 0) {
  return res.status(404).json({
    success: false,
    message: "RA not found",
  });
}

const duplicate = await checkRADuplicatesForUpdate(data, id);



if (duplicate) {
  return res.status(409).json({
    success: false,
    field: duplicate.field,
    message: duplicate.message,
  });
}

   const allowedFields = [
  "salutation",
  "first_name",
  "middle_name",
  "surname",
  "org_name",
  "designation",
  "short_bio",
  "email",
  "mobile",
  "telephone",
  "country",
  "state",
  "city",
  "pincode",
  "address_line1",
  "address_line2",
  "sebi_reg_no",
  "sebi_start_date",
  "sebi_expiry_date",
  "nism_reg_no",
  "nism_valid_till",
  "academic_qualification",
  "professional_qualification",
  "market_experience",
  "expertise",
  "markets",
  "bank_name",
  "account_holder",
  "account_number",
  "ifsc_code",
  "pan_number",
  "address_proof_type",
  "declare_info_true",
  "consent_verification",
  "no_guaranteed_returns",
  "conflict_of_interest",
  "personal_trading",
  "sebi_compliance",
  "platform_policy",
  "additional_comments",
];

const updates: string[] = [];
const values: any[] = [];

allowedFields.forEach((field) => {
  if (data[field] !== undefined) {
    updates.push(`${field} = $${values.length + 1}`);
    values.push(data[field]);
  }
});

const fileMap = {
  profile_image: files?.profile_image?.[0]?.filename,
  pan_card: files?.pan_card?.[0]?.filename,
  address_proof_document:
    files?.address_proof_document?.[0]?.filename,
  sebi_certificate:
    files?.sebi_certificate?.[0]?.filename,
  sebi_receipt:
    files?.sebi_receipt?.[0]?.filename,
  nism_certificate:
    files?.nism_certificate?.[0]?.filename,
  cancelled_cheque:
    files?.cancelled_cheque?.[0]?.filename,
};

Object.entries(fileMap).forEach(([field, value]) => {
  if (value) {
    updates.push(`${field} = $${values.length + 1}`);
    values.push(value);
  }
});

if (updates.length === 0) {
  return res.status(400).json({
    success: false,
    message: "No changes submitted",
  });
}


values.push(id);

const result = await pool.query(
  `
  UPDATE ra_details
  SET ${updates.join(", ")}
  WHERE id = $${values.length}
  RETURNING *
  `,
  values
);

    // ================= UPDATE LOGIN EMAIL =================

if (result.rows[0]?.user_id && data.email) {
  await pool.query(
    `
    UPDATE users
    SET email = $1
    WHERE id = $2
    `,
    [data.email, result.rows[0].user_id]
  );
}

 await createAuditLog({
  adminName: req.user?.name || "ADMIN",

  adminId: req.user?.id,

  adminRole: req.user?.role || "ADMIN",

  action: "UPDATE",

  module: "RA",

  targetEntity: data.email,

  targetType: "RA",

  description: "RA profile updated by admin",

  status: "SUCCESS",

  ipAddress: getClientIp(req),

  device: req.headers["user-agent"],

  oldValue: oldData.rows[0],

  newValue: result.rows[0],
});

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error: any) {
  console.error("UPDATE RA ERROR:", error);

  const constraintMap: Record<string, { field: string; message: string }> = {
    ra_email_unique: {
      field: "email",
      message: "Email is already registered.",
    },
    ra_mobile_unique: {
      field: "mobile",
      message: "Mobile number is already registered.",
    },
    ra_sebi_unique: {
      field: "sebi_reg_no",
      message: "SEBI Registration Number already exists.",
    },
    ra_nism_unique: {
      field: "nism_reg_no",
      message: "NISM Registration Number already exists.",
    },
    ra_pan_unique: {
      field: "pan_number",
      message: "PAN number is already registered.",
    },
  };

  if (error.code === "23505") {
    const mapped = constraintMap[error.constraint];

    return res.status(409).json({
      success: false,
      field: mapped?.field,
      message: mapped?.message || "Duplicate record found.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server error",
  });
}
};

/* ================= UPDATE Broker REGISTRATION ================= */

export const updateBroker = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const files = req.files as any;

      /* ================= GET OLD DATA ================= */

    const oldData = await pool.query(
      `SELECT * FROM broker_details WHERE id = $1`,
      [id]
    );

    if (oldData.rowCount === 0) {
      return res.status(404).json({
        message: "Broker not found",
      });
    }


    /* ================= UPDATE QUERY ================= */

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

    // ================= UPDATE LOGIN EMAIL =================

if (result.rows[0]?.user_id) {
  await pool.query(
    `
    UPDATE users
    SET email = $1
    WHERE id = $2
    `,
    [
      data.email.trim().toLowerCase(),
      result.rows[0].user_id,
    ]
  );
}

   if (result.rowCount === 0) {
      return res.status(404).json({ message: "Broker not found" });
    }

        /* ================= CREATE AUDIT LOG ================= */
await createAuditLog({
  adminId: req.user?.id || undefined,

  adminName: req.user?.name || "ADMIN",

  adminRole: req.user?.role || "ADMIN",

  action: "UPDATE",

  module: "BROKER",

  targetEntity: data.email,

  targetType: "BROKER",

  description: `Broker profile updated: ${data.legal_name}`,

  status: "SUCCESS",

  ipAddress: getClientIp(req),

  device: req.headers["user-agent"] as string,

  oldValue: oldData.rows[0],

  newValue: result.rows[0],
});

 

    res.status(200).json({
      success: true,
      message: "Broker updated successfully",
      data: result.rows[0],
    });

  }  catch (error: any) {
  console.error("UPDATE RA ERROR:", error);

  const constraintMap: Record<string, { field: string; message: string }> = {
    ra_email_unique: {
      field: "email",
      message: "Email is already registered.",
    },
    ra_mobile_unique: {
      field: "mobile",
      message: "Mobile number is already registered.",
    },
    ra_sebi_unique: {
      field: "sebi_reg_no",
      message: "SEBI Registration Number already exists.",
    },
    ra_nism_unique: {
      field: "nism_reg_no",
      message: "NISM Registration Number already exists.",
    },
    ra_pan_unique: {
      field: "pan_number",
      message: "PAN number is already registered.",
    },
  };

  if (error.code === "23505") {
    const mapped = constraintMap[error.constraint];

    return res.status(409).json({
      success: false,
      field: mapped?.field,
      message: mapped?.message || "Duplicate record found.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server error",
  });
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


export const getMyRAProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `
      SELECT *
      FROM ra_details
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "RA profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const createRAProfileUpdateRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id; // UUID

    const data = req.body || {};
    const files = req.files as any;
    normalizeRAUpdateData(data);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const raResult = await pool.query(
  `SELECT id FROM ra_details WHERE user_id = $1`,
  [userId]
);

if (raResult.rowCount === 0) {
  return res.status(404).json({
    success: false,
    message: "RA profile not found",
  });
}

const currentRAId = raResult.rows[0].id;

const duplicate = await checkRADuplicatesForUpdate(data, currentRAId);

if (duplicate) {
  return res.status(409).json({
    success: false,
    field: duplicate.field,
    message: duplicate.message,
  });
}
    

    const fileMap = {
      profile_image: files?.profile_image?.[0]?.filename,
      pan_card: files?.pan_card?.[0]?.filename,
      address_proof_document:
        files?.address_proof_document?.[0]?.filename,
      sebi_certificate:
        files?.sebi_certificate?.[0]?.filename,
      sebi_receipt:
        files?.sebi_receipt?.[0]?.filename,
      nism_certificate:
        files?.nism_certificate?.[0]?.filename,
      cancelled_cheque:
        files?.cancelled_cheque?.[0]?.filename,
    };

    const requestedChanges = {
      ...data,
      ...Object.fromEntries(
        Object.entries(fileMap).filter(
          ([_, value]) => value
        )
      ),
    };

    if (Object.keys(requestedChanges).length === 0) {
  return res.status(400).json({
    success: false,
    message: "No changes submitted",
  });
}

  const requestResult = await pool.query(
  `
  INSERT INTO ra_profile_update_requests
  (
    ra_user_id,
    requested_changes,
    status
  )
  VALUES ($1, $2, 'PENDING')
  RETURNING id
  `,
  [userId, JSON.stringify(requestedChanges)]
);
await createAuditLog({
  adminId: req.user?.id,
  adminName: req.user?.name || "RA",
  adminRole: req.user?.role || "RESEARCH_ANALYST",
  action: "RA_PROFILE_UPDATE_REQUESTED",
  module: "RA_PROFILE",
  targetEntity: req.user?.name || userId,
  targetType: "RA_PROFILE_UPDATE_REQUEST",
  description: "RA submitted profile update request",
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  newValue: {
    requestId: requestResult.rows[0].id,
    requestedFields: Object.keys(requestedChanges),
  },
});


    return res.status(201).json({
      success: true,
      message:
        "Profile update request submitted successfully",
    });
  } catch (error: any) {
    console.error(
      "CREATE RA PROFILE UPDATE REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getRAProfileUpdateRequests = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.ra_user_id,
        r.requested_changes,
        r.status,
        r.admin_remark,
        r.created_at,
        r.reviewed_at,

        u.name,
        u.email,

        rd.salutation,
        rd.first_name,
        rd.middle_name,
        rd.surname,
        rd.org_name,
        rd.designation,
        rd.short_bio,
        rd.mobile,
        rd.telephone,

        rd.address_line1,
        rd.address_line2,
        rd.city,
        rd.state,
        rd.country,
        rd.pincode,

        rd.sebi_reg_no,
        rd.sebi_start_date,
        rd.sebi_expiry_date,

        rd.nism_reg_no,
        rd.nism_valid_till,

        rd.academic_qualification,
        rd.professional_qualification,
        rd.market_experience,
        rd.expertise,
        rd.markets,

        rd.bank_name,
        rd.account_holder,
        rd.account_number,
        rd.ifsc_code,

        rd.pan_number,
        rd.address_proof_type,

        rd.declare_info_true,
        rd.consent_verification,
        rd.no_guaranteed_returns,
        rd.conflict_of_interest,
        rd.personal_trading,
        rd.sebi_compliance,
        rd.platform_policy,

        rd.additional_comments,

        rd.profile_image,
        rd.pan_card,
        rd.address_proof_document,
        rd.sebi_certificate,
        rd.sebi_receipt,
        rd.nism_certificate,
        rd.cancelled_cheque

      FROM ra_profile_update_requests r
      JOIN users u ON u.id = r.ra_user_id
      JOIN ra_details rd ON rd.user_id = r.ra_user_id
      ORDER BY r.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET RA PROFILE REQUESTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const approveRAProfileUpdateRequest = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const requestRes = await client.query(
      `
      SELECT *
      FROM ra_profile_update_requests
      WHERE id = $1 AND status = 'PENDING'
      `,
      [id]
    );

    if (requestRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Pending request not found",
      });
    }

    const request = requestRes.rows[0];
    
    const changes = request.requested_changes;
    normalizeRAUpdateData(changes);

const raResult = await client.query(
  `SELECT id FROM ra_details WHERE user_id = $1`,
  [request.ra_user_id]
);

if (raResult.rowCount === 0) {
  await client.query("ROLLBACK");
  return res.status(404).json({
    success: false,
    message: "RA profile not found",
  });
}

const duplicate = await checkRADuplicatesForUpdate(
  changes,
  raResult.rows[0].id
);

if (duplicate) {
  await client.query("ROLLBACK");
  return res.status(409).json({
    success: false,
    field: duplicate.field,
    message: duplicate.message,
  });
}

    const allowedFields = [
      "salutation",
      "first_name",
      "middle_name",
      "surname",
      "org_name",
      "designation",
      "short_bio",
      "email",
      "mobile",
      "telephone",
      "country",
      "state",
      "city",
      "pincode",
      "address_line1",
      "address_line2",
      "sebi_reg_no",
      "sebi_start_date",
      "sebi_expiry_date",
      "nism_reg_no",
      "nism_valid_till",
      "academic_qualification",
      "professional_qualification",
      "market_experience",
      "expertise",
      "markets",
      "bank_name",
      "account_holder",
      "account_number",
      "ifsc_code",
      "pan_number",
      "address_proof_type",
      "declare_info_true",
      "consent_verification",
      "no_guaranteed_returns",
      "conflict_of_interest",
      "personal_trading",
      "sebi_compliance",
      "platform_policy",
      "additional_comments",
      "profile_image",
      "pan_card",
      "address_proof_document",
      "sebi_certificate",
      "sebi_receipt",
      "nism_certificate",
      "cancelled_cheque",
    ];

    const updates: string[] = [];
    const values: any[] = [];

    allowedFields.forEach((field) => {
      if (changes[field] !== undefined) {
        updates.push(`${field} = $${values.length + 1}`);
        values.push(changes[field]);
      }
    });

    if (updates.length > 0) {
      values.push(request.ra_user_id);

      await client.query(
        `
        UPDATE ra_details
        SET ${updates.join(", ")}
        WHERE user_id = $${values.length}
        `,
        values
      );
    }

    if (changes.email) {
      await client.query(
        `
        UPDATE users
        SET email = $1
        WHERE id = $2
        `,
        [changes.email.trim().toLowerCase(), request.ra_user_id]
      );
    }

    await client.query(
      `
      UPDATE ra_profile_update_requests
      SET status = 'APPROVED', reviewed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");
    await createAuditLog({
  adminId: req.user?.id,
  adminName: req.user?.name || "ADMIN",
  adminRole: req.user?.role || "ADMIN",
  action: "RA_PROFILE_UPDATE_APPROVED",
  module: "RA_PROFILE",
  targetEntity: request.ra_user_id,
  targetType: "RA_PROFILE_UPDATE_REQUEST",
  description: "RA profile update request approved",
  status: "SUCCESS",
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: {
    requestId: id,
    status: "PENDING",
  },
  newValue: {
    requestId: id,
    raUserId: request.ra_user_id,
    status: "APPROVED",
    approvedFields: Object.keys(changes),
  },
});

    return res.status(200).json({
      success: true,
      message: "RA profile update request approved",
    });
  }     catch (error: any) {
    await client.query("ROLLBACK");

    console.error("APPROVE RA PROFILE REQUEST ERROR:", error);

    const constraintMap: Record<string, { field: string; message: string }> = {
      ra_email_unique: {
        field: "email",
        message: "Email is already registered.",
      },
      ra_mobile_unique: {
        field: "mobile",
        message: "Mobile number is already registered.",
      },
      ra_sebi_unique: {
        field: "sebi_reg_no",
        message: "SEBI Registration Number already exists.",
      },
      ra_nism_unique: {
        field: "nism_reg_no",
        message: "NISM Registration Number already exists.",
      },
      ra_pan_unique: {
        field: "pan_number",
        message: "PAN number is already registered.",
      },
    };

    if (error.code === "23505") {
      const mapped = constraintMap[error.constraint];

      return res.status(409).json({
        success: false,
        field: mapped?.field,
        message: mapped?.message || "Duplicate record found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

export const rejectRAProfileUpdateRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { admin_remark } = req.body;

  const result = await pool.query(
  `
  UPDATE ra_profile_update_requests
  SET
    status = 'REJECTED',
    admin_remark = $1,
    reviewed_at = NOW()
  WHERE id = $2 AND status = 'PENDING'
  RETURNING id, ra_user_id, requested_changes
  `,
  [admin_remark || null, id]
);

if (result.rowCount === 0) {
  return res.status(404).json({
    success: false,
    message: "Pending request not found",
  });
}

await createAuditLog({
  adminId: req.user?.id,
  adminName: req.user?.name || "ADMIN",
  adminRole: req.user?.role || "ADMIN",
  action: "RA_PROFILE_UPDATE_REJECTED",
  module: "RA_PROFILE",
  targetEntity: result.rows[0].ra_user_id,
  targetType: "RA_PROFILE_UPDATE_REQUEST",
  description: "RA profile update request rejected",
  status: "SUCCESS",
  reason: admin_remark || null,
  ipAddress: getClientIp(req),
  device: req.headers["user-agent"] as string,
  oldValue: {
    requestId: id,
    requestedChanges: result.rows[0].requested_changes,
  },
  newValue: {
    status: "REJECTED",
  },
});


    return res.status(200).json({
      success: true,
      message: "RA profile update request rejected",
    });
  } catch (error) {
    console.error("REJECT RA PROFILE REQUEST ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getBankFromIFSC = async (
  req: Request,
  res: Response
) => {
  try {
    const { ifsc } = req.params;

    const response = await axios.get(
      `https://ifsc.razorpay.com/${ifsc}`
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (err: any) {

    // Razorpay returns 404 if IFSC is not found
    if (err.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message:
          "Bank / Branch couldn't be detected automatically. Please enter them manually.",
      });
    }

    // Any other error
    return res.status(500).json({
      success: false,
      message: "Unable to fetch bank details. Please try again later.",
    });
  }
};