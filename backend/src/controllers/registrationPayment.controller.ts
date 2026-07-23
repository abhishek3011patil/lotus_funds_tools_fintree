import crypto from "crypto";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

const ORDER_ALLOWED_STATUSES = new Set([
  "PLAN_SELECTED",
  "PAYMENT_PENDING",
  "PAYMENT_FAILED",
]);

const hashRegistrationToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const secureHashEquals = (
  storedHash: string,
  suppliedHash: string
): boolean => {
  const stored = Buffer.from(storedHash, "hex");
  const supplied = Buffer.from(suppliedHash, "hex");

  return (
    stored.length > 0 &&
    stored.length === supplied.length &&
    crypto.timingSafeEqual(stored, supplied)
  );
};

const getRegistrationToken = (
  req: Request
): string | null => {
  const value = req.header("x-registration-token");

  if (!value) {
    return null;
  }

  const token = value.trim();
  return token.length > 0 ? token : null;
};

const getClientIp = (req: Request): string =>
  req.headers["x-forwarded-for"]
    ?.toString()
    .split(",")[0]
    ?.trim() ||
  req.socket.remoteAddress ||
  "";

const getRazorpayClient = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const createReceipt = (
  applicationId: string
): string => {
  const shortApplicationId = applicationId
    .replace(/-/g, "")
    .slice(0, 12);

  // Razorpay receipt has a maximum length of 40 characters.
  return `reg_${shortApplicationId}_${Date.now().toString(36)}`;
};

const sendExistingOrder = (
  res: Response,
  application: any,
  selection: any,
  localOrder: any
): void => {
  res.status(200).json({
    success: true,
    message: "Existing payment order returned.",
    registrationStatus: application.status,
    order: {
      localOrderId: localOrder.id,
      razorpayOrderId: localOrder.provider_order_id,
      amountPaise: Number(localOrder.amount_paise),
      amountRupees:
        Number(localOrder.amount_paise) / 100,
      currency: localOrder.currency,
      receipt: localOrder.receipt,
      status: localOrder.status,
    },
    checkout: {
      keyId: process.env.RAZORPAY_KEY_ID,
      businessName:
        process.env.RAZORPAY_CHECKOUT_NAME ||
        "Lotus Funds",
      description: selection.plan_name_snapshot,
      prefill: {
        email: application.email,
        contact: application.mobile || "",
      },
    },
    nextStep: "OPEN_RAZORPAY_CHECKOUT",
  });
};

/**
 * POST /api/payments/registration-order
 *
 * Header:
 * x-registration-token: token returned after registration
 *
 * Body:
 * {
 *   "applicationId": "uuid"
 * }
 *
 * The amount, currency, plan name and duration are always read
 * from the server-side plan-selection snapshot.
 */
export const createRegistrationOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const applicationId =
    typeof req.body?.applicationId === "string"
      ? req.body.applicationId.trim()
      : "";

  const registrationToken = getRegistrationToken(req);

  if (!applicationId) {
    res.status(400).json({
      success: false,
      message: "applicationId is required.",
    });
    return;
  }

  if (!registrationToken) {
    res.status(401).json({
      success: false,
      message: "Registration token is required.",
    });
    return;
  }

  const db = await pool.connect();
  let transactionOpen = false;

  try {
    await db.query("BEGIN");
    transactionOpen = true;

    /*
     * Lock the application and active selection so two repeated
     * button clicks cannot create two Razorpay orders.
     */
    const registrationResult = await db.query(
      `
        SELECT
          a.id,
          a.applicant_type,
          a.email,
          a.mobile,
          a.status,
          a.registration_token_hash,
          a.registration_token_expires_at,

          selection.id AS selection_id,
          selection.plan_id,
          selection.plan_code_snapshot,
          selection.plan_name_snapshot,
          selection.audience_type_snapshot,
          selection.tier_code_snapshot,
          selection.price_paise_snapshot,
          selection.currency_snapshot,
          selection.duration_days_snapshot,
          selection.plan_version_snapshot

        FROM registration_applications a
        INNER JOIN registration_plan_selections selection
          ON selection.registration_application_id = a.id
         AND selection.replaced_at IS NULL
        WHERE a.id = $1
        FOR UPDATE OF a, selection
      `,
      [applicationId]
    );

    if (registrationResult.rowCount === 0) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(404).json({
        success: false,
        message:
          "Registration application or selected plan was not found.",
      });
      return;
    }

    const registration = registrationResult.rows[0];

    if (
      !registration.registration_token_hash ||
      !registration.registration_token_expires_at
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(401).json({
        success: false,
        message:
          "This registration does not have a valid access token.",
      });
      return;
    }

    const suppliedTokenHash =
      hashRegistrationToken(registrationToken);

    if (
      !secureHashEquals(
        registration.registration_token_hash,
        suppliedTokenHash
      )
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(401).json({
        success: false,
        message: "Invalid registration token.",
      });
      return;
    }

    if (
      new Date(
        registration.registration_token_expires_at
      ).getTime() <= Date.now()
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(401).json({
        success: false,
        message:
          "Registration token has expired. Restart or resume registration.",
      });
      return;
    }

    if (!ORDER_ALLOWED_STATUSES.has(registration.status)) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(409).json({
        success: false,
        message:
          "A payment order cannot be created at this registration stage.",
        registrationStatus: registration.status,
      });
      return;
    }

    if (
      registration.applicant_type !==
      registration.audience_type_snapshot
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(409).json({
        success: false,
        message:
          "The selected plan does not match the registration type.",
      });
      return;
    }

    const amountPaise = Number(
      registration.price_paise_snapshot
    );

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      await db.query("ROLLBACK");
      transactionOpen = false;

      res.status(409).json({
        success: false,
        message:
          "This plan does not have a payable price configured. Update price_paise before creating a Razorpay order.",
        plan: {
          planCode: registration.plan_code_snapshot,
          displayName:
            registration.plan_name_snapshot,
          amountPaise,
        },
      });
      return;
    }

    /*
     * Reuse an existing open provider order. This makes the
     * endpoint safe when the user double-clicks Pay or refreshes.
     */
    const existingOrderResult = await db.query(
      `
        SELECT
          id,
          provider_order_id,
          amount_paise,
          currency,
          receipt,
          status
        FROM payment_orders
        WHERE registration_application_id = $1
          AND plan_selection_id = $2
          AND status IN ('CREATED', 'PENDING', 'PAID')
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [
        applicationId,
        registration.selection_id,
      ]
    );

    if (existingOrderResult.rows.length > 0) {
      const existingOrder =
        existingOrderResult.rows[0];

      if (existingOrder.status === "PAID") {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Payment has already been completed for this registration.",
          registrationStatus:
            registration.status,
        });
        return;
      }

      if (existingOrder.provider_order_id) {
        await db.query("COMMIT");
        transactionOpen = false;

        sendExistingOrder(
          res,
          registration,
          registration,
          existingOrder
        );
        return;
      }
    }

    const razorpay = getRazorpayClient();
    const receipt = createReceipt(applicationId);

    /*
     * Razorpay amount is already in paise because the plan
     * snapshot stores price_paise_snapshot.
     */
    const razorpayOrder: any =
      await razorpay.orders.create({
        amount: amountPaise,
        currency:
          registration.currency_snapshot,
        receipt,
        notes: {
          registration_application_id:
            applicationId,
          plan_selection_id:
            registration.selection_id,
          plan_code:
            registration.plan_code_snapshot,
          audience_type:
            registration.audience_type_snapshot,
        },
      });

    const idempotencyKey =
      `registration:${applicationId}:selection:${registration.selection_id}`;

    const localOrderResult = await db.query(
      `
        INSERT INTO payment_orders (
          registration_application_id,
          plan_selection_id,
          user_id,
          provider,
          provider_order_id,
          amount_paise,
          currency,
          status,
          idempotency_key,
          receipt,
          notes
        )
        VALUES (
          $1,
          $2,
          NULL,
          'RAZORPAY',
          $3,
          $4,
          $5,
          'CREATED',
          $6,
          $7,
          $8::jsonb
        )
        ON CONFLICT (idempotency_key)
        DO UPDATE SET
          provider_order_id =
            EXCLUDED.provider_order_id,
          amount_paise =
            EXCLUDED.amount_paise,
          currency =
            EXCLUDED.currency,
          status = 'CREATED',
          receipt =
            EXCLUDED.receipt,
          notes =
            EXCLUDED.notes,
          failure_reason = NULL,
          failed_at = NULL
        RETURNING
          id,
          provider_order_id,
          amount_paise,
          currency,
          status,
          receipt
      `,
      [
        applicationId,
        registration.selection_id,
        razorpayOrder.id,
        amountPaise,
        registration.currency_snapshot,
        idempotencyKey,
        receipt,
        JSON.stringify({
          registrationApplicationId:
            applicationId,
          planSelectionId:
            registration.selection_id,
          planCode:
            registration.plan_code_snapshot,
          audienceType:
            registration.audience_type_snapshot,
        }),
      ]
    );

    await db.query(
      `
        UPDATE registration_applications
        SET status = 'PAYMENT_PENDING'
        WHERE id = $1
      `,
      [applicationId]
    );

    await db.query("COMMIT");
    transactionOpen = false;

    const localOrder = localOrderResult.rows[0];

    try {
      await createAuditLog({
        adminName: "SYSTEM",
        adminRole: "SYSTEM",
        action:
          "REGISTRATION_PAYMENT_ORDER_CREATED",
        module: "PAYMENT",
        targetEntity: localOrder.id,
        targetType:
          "REGISTRATION_PAYMENT_ORDER",
        description:
          "Razorpay order created for registration subscription",
        status: "SUCCESS",
        ipAddress: getClientIp(req),
        device:
          req.headers["user-agent"]?.toString() ||
          "",
        oldValue: null,
        newValue: {
          applicationId,
          localOrderId: localOrder.id,
          razorpayOrderId:
            razorpayOrder.id,
          planCode:
            registration.plan_code_snapshot,
          amountPaise,
          currency:
            registration.currency_snapshot,
        },
      });
    } catch (auditError) {
      // Payment order must not fail because audit logging failed.
      console.error(
        "PAYMENT ORDER AUDIT ERROR:",
        auditError
      );
    }

    res.status(201).json({
      success: true,
      message:
        "Razorpay payment order created.",
      registrationStatus: "PAYMENT_PENDING",
      order: {
        localOrderId: localOrder.id,
        razorpayOrderId:
          razorpayOrder.id,
        amountPaise,
        amountRupees: amountPaise / 100,
        currency:
          registration.currency_snapshot,
        receipt,
        status: localOrder.status,
      },
      checkout: {
        keyId: process.env.RAZORPAY_KEY_ID,
        businessName:
          process.env.RAZORPAY_CHECKOUT_NAME ||
          "Lotus Funds",
        description:
          registration.plan_name_snapshot,
        prefill: {
          email: registration.email,
          contact: registration.mobile || "",
        },
      },
      nextStep: "OPEN_RAZORPAY_CHECKOUT",
    });
  } catch (error: any) {
    if (transactionOpen) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "PAYMENT ORDER ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    if (error?.code === "22P02") {
      res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
      return;
    }

    console.error(
      "CREATE REGISTRATION RAZORPAY ORDER ERROR:",
      error
    );

    res.status(502).json({
      success: false,
      message:
        "Unable to create the Razorpay payment order.",
    });
  } finally {
    db.release();
  }
};
