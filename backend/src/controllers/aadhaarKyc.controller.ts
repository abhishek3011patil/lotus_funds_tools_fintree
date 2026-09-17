import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../db";
import { issueClientAadhaarProof, readClientAadhaarProof } from "../utils/clientAadhaarProof";

/* =========================================================
   SANDBOX CONFIGURATION
   ========================================================= */

const AADHAAR_API_URL =
  process.env.AADHAAR_API_URL ||
  "https://api.sandbox.co.in";

const AADHAAR_API_KEY =
  process.env.AADHAAR_API_KEY;

const AADHAAR_API_SECRET =
  process.env.AADHAAR_API_SECRET;

const AADHAAR_API_VERSION =
  process.env.AADHAAR_API_VERSION || "1.0.0";

/*
  Test environment:
  https://test-api.sandbox.co.in

  Live environment:
  https://api.sandbox.co.in
*/

const IS_TEST_ENV =
  AADHAAR_API_URL.includes("test-api.sandbox.co.in");


/* =========================================================
   GET SANDBOX ACCESS TOKEN
   ========================================================= */

const getSandboxAccessToken = async (): Promise<string> => {

  if (!AADHAAR_API_KEY) {
    throw new Error("AADHAAR_API_KEY is missing.");
  }

  if (!AADHAAR_API_SECRET) {
    throw new Error("AADHAAR_API_SECRET is missing.");
  }

  try {

    const response = await axios.post(
      `${AADHAAR_API_URL}/authenticate`,
      {},
      {
        headers: {
          "x-api-key": AADHAAR_API_KEY,
          "x-api-secret": AADHAAR_API_SECRET,
          "x-api-version": AADHAAR_API_VERSION,
          "Content-Type": "application/json",
        },

        timeout: 15000,
      }
    );

    const responseData: any =
      response.data;

    const accessToken =
      responseData?.data?.access_token;

    if (!accessToken) {
      console.error(
        "SANDBOX AUTH RESPONSE:",
        JSON.stringify(
          responseData,
          null,
          2
        )
      );

      throw new Error(
        "Sandbox access token was not returned."
      );
    }

    return String(accessToken);

  } catch (error: any) {

    console.error(
      "SANDBOX AUTHENTICATION ERROR:"
    );

    console.error(
      error?.response?.data ||
      error?.message ||
      error
    );

    throw error;
  }
};


/* =========================================================
   SEND AADHAAR OTP
   POST /api/aadhaar/send-otp
   ========================================================= */

export const sendAadhaarOtp = async (
  req: Request,
  res: Response
) => {

  try {
    const isClient = req.body?.purpose === "client_registration";
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (isClient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter your registration email before requesting Aadhaar OTP." });
    }

    const {
      aadhaar_number
    } = req.body;


    /* -----------------------------------------------------
       VALIDATE AADHAAR
       ----------------------------------------------------- */

    if (!aadhaar_number) {

      return res.status(400).json({
        success: false,
        message:
          "Aadhaar number is required.",
      });

    }


    const aadhaar =
      String(aadhaar_number)
        .replace(/\s/g, "")
        .trim();


    if (!/^[0-9]{12}$/.test(aadhaar)) {

      return res.status(400).json({
        success: false,
        message:
          "Aadhaar number must contain exactly 12 digits.",
      });

    }


    /* -----------------------------------------------------
       TEST ENVIRONMENT
       -----------------------------------------------------

       Sandbox Test has a predefined saved example.

       Test Aadhaar:
       123456789012

       Test consent:
       y

       Test reason:
       For KYC
       ----------------------------------------------------- */

    if (IS_TEST_ENV) {

      if (aadhaar !== "123456789012") {

        return res.status(400).json({

          success: false,

          message:
            "Sandbox Test environment only supports the test Aadhaar number 123456789012.",

        });

      }

    }


    /* -----------------------------------------------------
       GET ACCESS TOKEN
       ----------------------------------------------------- */

    const accessToken =
      await getSandboxAccessToken();


    /* -----------------------------------------------------
       REQUEST BODY
       ----------------------------------------------------- */

    let requestBody: any;


    if (IS_TEST_ENV) {

      /*
        IMPORTANT:
        Keep the Test request EXACTLY as
        Sandbox's saved example.
      */

      requestBody = {

        "@entity":
          "in.co.sandbox.kyc.aadhaar.okyc.otp.request",

        aadhaar_number:
          "123456789012",

        consent:
          "y",

        reason:
          "For KYC",

      };

    } else {

      /*
        LIVE / PRODUCTION REQUEST
      */

      requestBody = {

        "@entity":
          "in.co.sandbox.kyc.aadhaar.okyc.otp.request",

        aadhaar_number:
          aadhaar,

        consent:
          "Y",

        reason:
          "Aadhaar KYC verification for Research Analyst registration",

      };

    }


    console.log(
      "========== AADHAAR OTP REQUEST =========="
    );

    console.log(
      "Environment:",
      IS_TEST_ENV
        ? "TEST"
        : "LIVE"
    );

    console.log(
      "API URL:",
      AADHAAR_API_URL
    );

    console.log(
      "Request Body:",
      JSON.stringify(
        requestBody,
        null,
        2
      )
    );

    console.log(
      "=========================================="
    );


    /* -----------------------------------------------------
       SEND OTP
       ----------------------------------------------------- */

    const response =
      await axios.post(

        `${AADHAAR_API_URL}/kyc/aadhaar/okyc/otp`,

        requestBody,

        {
          headers: {

            Authorization:
              accessToken,

            "x-api-key":
              AADHAAR_API_KEY,

            "x-api-version":
              AADHAAR_API_VERSION,

            "Content-Type":
              "application/json",

          },

          timeout: 30000,
        }

      );


    /* -----------------------------------------------------
       PROVIDER RESPONSE
       ----------------------------------------------------- */

    const data: any =
      response.data;


    console.log(
      "========== AADHAAR OTP RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "==========================================="
    );


    const referenceId =
      data?.data?.reference_id;


    const message =
      data?.data?.message ||
      data?.message;


    if (!referenceId) {

      return res.status(400).json({

        success: false,

        message:
          message ||
          "Unable to send Aadhaar OTP.",

        provider_response:
          data,

      });

    }


    /* -----------------------------------------------------
       SUCCESS
       ----------------------------------------------------- */

    return res.status(200).json({

      success: true,

      message:
        message ||
        "OTP sent successfully.",

      reference_id:
        String(referenceId),

      ...(isClient ? { challenge_token: issueClientAadhaarProof("challenge", {
        aadhaar, email, referenceId: String(referenceId),
      }) } : {}),

    });


  } catch (error: any) {

    console.error(
      "========== SEND AADHAAR OTP ERROR =========="
    );

    console.error(
      "HTTP STATUS:",
      error?.response?.status
    );

    console.error(
      "SANDBOX RESPONSE:",
      JSON.stringify(
        error?.response?.data ||
        null,
        null,
        2
      )
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "============================================"
    );


    return res.status(
      error?.response?.status ||
      500
    ).json({

      success: false,

      message:
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "Unable to send Aadhaar OTP. Please try again.",

      provider_response:
        error?.response?.data ||
        null,

    });

  }

};


/* =========================================================
   VERIFY AADHAAR OTP
   POST /api/aadhaar/verify-otp
   ========================================================= */

export const verifyAadhaarOtp = async (
  req: Request,
  res: Response
) => {

  try {
    const isClient = req.body?.purpose === "client_registration";
    const email = String(req.body?.email || "").trim().toLowerCase();

    const {
      aadhaar_number,
      otp,
      reference_id,
    } = req.body;


    /* -----------------------------------------------------
       VALIDATE AADHAAR
       ----------------------------------------------------- */

    if (!aadhaar_number) {

      return res.status(400).json({

        success: false,

        message:
          "Aadhaar number is required.",

      });

    }


    const aadhaar =
      String(aadhaar_number)
        .replace(/\s/g, "")
        .trim();


    if (!/^[0-9]{12}$/.test(aadhaar)) {

      return res.status(400).json({

        success: false,

        message:
          "Aadhaar number must contain exactly 12 digits.",

      });

    }


    /* -----------------------------------------------------
       VALIDATE OTP
       ----------------------------------------------------- */

    if (!otp) {

      return res.status(400).json({

        success: false,

        message:
          "OTP is required.",

      });

    }


    const cleanOtp =
      String(otp)
        .replace(/\s/g, "")
        .trim();


    if (!/^[0-9]{6}$/.test(cleanOtp)) {

      return res.status(400).json({

        success: false,

        message:
          "OTP must contain exactly 6 digits.",

      });

    }


    /* -----------------------------------------------------
       VALIDATE REFERENCE ID
       ----------------------------------------------------- */

    if (!reference_id) {

      return res.status(400).json({

        success: false,

        message:
          "Aadhaar verification reference is required.",

      });

    }


    /* -----------------------------------------------------
       TEST ENVIRONMENT VALIDATION
       ----------------------------------------------------- */

    if (IS_TEST_ENV) {

      if (aadhaar !== "123456789012") {

        return res.status(400).json({

          success: false,

          message:
            "Sandbox Test environment only supports the test Aadhaar number 123456789012.",

        });

      }


      if (cleanOtp !== "121212") {

        return res.status(400).json({

          success: false,

          message:
            "For Sandbox Test, use OTP 121212.",

        });

      }

    }


    /* -----------------------------------------------------
       GET ACCESS TOKEN
       ----------------------------------------------------- */

    if (isClient && !readClientAadhaarProof(req.body?.challenge_token, "challenge", {
      aadhaar, email, referenceId: String(reference_id),
    })) {
      return res.status(400).json({ success: false, message: "Aadhaar OTP request expired or does not match. Please request a new OTP." });
    }

    const accessToken =
      await getSandboxAccessToken();


    /* -----------------------------------------------------
       VERIFY REQUEST
       ----------------------------------------------------- */

    const requestBody = {

      "@entity":
        "in.co.sandbox.kyc.aadhaar.okyc.request",

      reference_id:
        String(reference_id),

      otp:
        cleanOtp,

    };


    console.log(
      "========== AADHAAR VERIFY REQUEST =========="
    );

    console.log(
      "Environment:",
      IS_TEST_ENV
        ? "TEST"
        : "LIVE"
    );

    console.log(
      "Reference ID:",
      String(reference_id)
    );

    console.log(
      "OTP length:",
      cleanOtp.length
    );

    console.log(
      "============================================="
    );


    /* -----------------------------------------------------
       CALL SANDBOX VERIFY API
       ----------------------------------------------------- */

    const response =
      await axios.post(

        `${AADHAAR_API_URL}/kyc/aadhaar/okyc/otp/verify`,

        requestBody,

        {
          headers: {

            Authorization:
              accessToken,

            "x-api-key":
              AADHAAR_API_KEY,

            "x-api-version":
              AADHAAR_API_VERSION,

            "Content-Type":
              "application/json",

          },

          timeout: 30000,

        }

      );


    /* -----------------------------------------------------
       PROVIDER RESPONSE
       ----------------------------------------------------- */

    const data: any =
      response.data;


    console.log(
      "========== AADHAAR VERIFY RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "=============================================="
    );


    /* -----------------------------------------------------
       CHECK VERIFICATION STATUS
       ----------------------------------------------------- */

    const verificationData =
      data?.data;


    if (
      verificationData?.status !==
      "VALID"
    ) {

      return res.status(400).json({

        success: false,

        message:
          verificationData?.message ||
          data?.message ||
          "Invalid OTP. Aadhaar verification failed.",

        provider_response:
          data,

      });

    }


    /* =====================================================
       AADHAAR VERIFIED
       ===================================================== */

    if (isClient) {
      return res.status(200).json({
        success: true,
        message: "Aadhaar KYC verified successfully.",
        status: "VERIFIED",
        reference_id: String(reference_id),
        verification_token: issueClientAadhaarProof("verified", {
          aadhaar, email, referenceId: String(reference_id),
        }),
      });
    }


    /* -----------------------------------------------------
       UPDATE DATABASE
       ----------------------------------------------------- */

    try {

      const updateResult =
        await pool.query(

          `
          UPDATE ra_details
          SET
            aadhaar_kyc_status = 'VERIFIED',
            aadhaar_reference_id = $1,
            aadhaar_verified_at = NOW()
          WHERE aadhaar_number = $2
          `,

          [
            String(reference_id),
            aadhaar,
          ]

        );


      console.log(
        "AADHAAR DB UPDATE RESULT:",
        updateResult.rowCount
      );


    } catch (dbError: any) {

      console.error(
        "AADHAAR DATABASE UPDATE ERROR:"
      );

      console.error(
        dbError?.message ||
        dbError
      );

    }


    /* -----------------------------------------------------
       SUCCESS RESPONSE
       ----------------------------------------------------- */

    return res.status(200).json({

      success: true,

      message:
        "Aadhaar KYC verified successfully.",

      status:
        "VERIFIED",

      reference_id:
        String(reference_id),

    });


  } catch (error: any) {

    console.error(
      "========== AADHAAR VERIFY ERROR =========="
    );

    console.error(
      "HTTP STATUS:",
      error?.response?.status
    );

    console.error(
      "SANDBOX RESPONSE:",
      JSON.stringify(
        error?.response?.data ||
        null,
        null,
        2
      )
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "==========================================="
    );


    return res.status(
      error?.response?.status ||
      500
    ).json({

      success: false,

      message:
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "Unable to verify Aadhaar OTP. Please try again.",

      provider_response:
        error?.response?.data ||
        null,

    });

  }

};
