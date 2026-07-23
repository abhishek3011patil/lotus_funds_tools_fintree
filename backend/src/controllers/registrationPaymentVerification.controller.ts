import crypto from "crypto";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { pool } from "../db";
import { createAuditLog } from "../utils/auditLogger";

type VerificationBody = {
  applicationId?: unknown;
  razorpayOrderId?: unknown;
  razorpayPaymentId?: unknown;
  razorpaySignature?: unknown;
};

const getString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const hashRegistrationToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const secureHexEquals = (
  firstValue: string,
  secondValue: string
): boolean => {
  if (
    !/^[a-f0-9]+$/i.test(firstValue) ||
    !/^[a-f0-9]+$/i.test(secondValue)
  ) {
    return false;
  }

  const first = Buffer.from(firstValue, "hex");
  const second = Buffer.from(secondValue, "hex");

  return (
    first.length > 0 &&
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
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

const getClientIp = (req: Request): string =>
  req.headers["x-forwarded-for"]
    ?.toString()
    .split(",")[0]
    ?.trim() ||
  req.socket.remoteAddress ||
  "";

const verifyRegistrationAccess = (
  registration: any,
  registrationToken: string
): { valid: true } | { valid: false; message: string } => {
  if (
    !registration.registration_token_hash ||
    !registration.registration_token_expires_at
  ) {
    return {
      valid: false,
      message:
        "This registration does not have a valid access token.",
    };
  }

  const suppliedHash =
    hashRegistrationToken(registrationToken);

  if (
    !secureHexEquals(
      registration.registration_token_hash,
      suppliedHash
    )
  ) {
    return {
      valid: false,
      message: "Invalid registration token.",
    };
  }

  if (
    new Date(
      registration.registration_token_expires_at
    ).getTime() <= Date.now()
  ) {
    return {
      valid: false,
      message:
        "Registration token has expired. Restart or resume registration.",
    };
  }

  return { valid: true };
};

const getVerificationRecord = async (
  applicationId: string,
  razorpayOrderId: string
) =>
  pool.query(
    `
      SELECT
        application.id AS application_id,
        application.user_id,
        application.status AS application_status,
        application.registration_token_hash,
        application.registration_token_expires_at,

        payment_order.id AS local_order_id,
        payment_order.provider_order_id,
        payment_order.amount_paise,
        payment_order.currency,
        payment_order.status AS payment_order_status,
        payment_order.plan_selection_id,

        selection.plan_id,
        selection.plan_code_snapshot,
        selection.plan_name_snapshot,
        selection.tier_code_snapshot,
        selection.price_paise_snapshot,
        selection.duration_days_snapshot,
        selection.plan_version_snapshot

      FROM registration_applications application

      INNER JOIN payment_orders payment_order
        ON payment_order.registration_application_id =
           application.id

      INNER JOIN registration_plan_selections selection
        ON selection.id = payment_order.plan_selection_id

      WHERE application.id = $1
        AND payment_order.provider = 'RAZORPAY'
        AND payment_order.provider_order_id = $2

      ORDER BY payment_order.created_at DESC
      LIMIT 1
    `,
    [applicationId, razorpayOrderId]
  );

/**
 * POST /api/payments/registration-verify
 *
 * Header:
 * x-registration-token: plain registration token
 *
 * Body:
 * {
 *   applicationId,
 *   razorpayOrderId,
 *   razorpayPaymentId,
 *   razorpaySignature
 * }
 *
 * Successful result:
 * application = PAID_PENDING_APPROVAL
 * payment order = PAID
 * subscription = PAID_PENDING_APPROVAL
 *
 * This endpoint does not activate the account.
 */
export const verifyRegistrationPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = (req.body || {}) as VerificationBody;

  const applicationId = getString(body.applicationId);
  const razorpayOrderId = getString(
    body.razorpayOrderId
  );
  const razorpayPaymentId = getString(
    body.razorpayPaymentId
  );
  const razorpaySignature = getString(
    body.razorpaySignature
  );
  const registrationToken =
    getRegistrationToken(req);

  if (
    !applicationId ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    res.status(400).json({
      success: false,
      message:
        "applicationId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required.",
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

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.error(
      "RAZORPAY_KEY_SECRET is not configured."
    );

    res.status(500).json({
      success: false,
      message:
        "Payment verification is not configured.",
    });
    return;
  }

  try {
    /*
     * First read the order created by this backend.
     * Razorpay requires signature generation to use the
     * server-stored order ID, not a client-trusted value.
     */
    const initialResult =
      await getVerificationRecord(
        applicationId,
        razorpayOrderId
      );

    if (initialResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message:
          "The registration payment order was not found.",
      });
      return;
    }

    const initial = initialResult.rows[0];

    const access =
      verifyRegistrationAccess(
        initial,
        registrationToken
      );

    if (!access.valid) {
      res.status(401).json({
        success: false,
        message: access.message,
      });
      return;
    }

    if (
      initial.provider_order_id !==
      razorpayOrderId
    ) {
      res.status(400).json({
        success: false,
        message:
          "Razorpay order does not match the server order.",
      });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${initial.provider_order_id}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (
      !secureHexEquals(
        expectedSignature,
        razorpaySignature
      )
    ) {
      try {
        await createAuditLog({
          adminName: "SYSTEM",
          adminRole: "SYSTEM",
          action:
            "REGISTRATION_PAYMENT_SIGNATURE_FAILED",
          module: "PAYMENT",
          targetEntity:
            initial.local_order_id,
          targetType:
            "REGISTRATION_PAYMENT_ORDER",
          description:
            "Razorpay payment signature verification failed",
          status: "FAILED",
          reason: "Invalid Razorpay signature",
          ipAddress: getClientIp(req),
          device:
            req.headers["user-agent"]?.toString() ||
            "",
          oldValue: null,
          newValue: {
            applicationId,
            razorpayOrderId,
            razorpayPaymentId,
          },
        });
      } catch (auditError) {
        console.error(
          "PAYMENT SIGNATURE AUDIT ERROR:",
          auditError
        );
      }

      res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature.",
      });
      return;
    }

    /*
     * Signature authenticity is mandatory, but also fetch the
     * Razorpay payment to verify captured status, amount,
     * currency and order linkage before changing local state.
     */
    const razorpay = getRazorpayClient();
    const providerPayment: any =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    if (
      String(providerPayment.order_id || "") !==
      initial.provider_order_id
    ) {
      res.status(409).json({
        success: false,
        message:
          "Razorpay payment is linked to a different order.",
      });
      return;
    }

    if (
      Number(providerPayment.amount) !==
      Number(initial.amount_paise)
    ) {
      res.status(409).json({
        success: false,
        message:
          "Razorpay payment amount does not match the selected plan.",
      });
      return;
    }

    if (
      String(providerPayment.currency || "")
        .toUpperCase() !==
      String(initial.currency || "").toUpperCase()
    ) {
      res.status(409).json({
        success: false,
        message:
          "Razorpay payment currency does not match the order.",
      });
      return;
    }

    if (
      String(providerPayment.status || "")
        .toLowerCase() !== "captured"
    ) {
      res.status(409).json({
        success: false,
        message:
          "The payment is authentic but has not been captured yet.",
        paymentStatus:
          providerPayment.status || "unknown",
        nextStep: "WAIT_FOR_PAYMENT_CAPTURE",
      });
      return;
    }

    const db = await pool.connect();
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      /*
       * Lock the application and payment order so callback
       * retries and double submissions are processed once.
       */
      const lockedResult = await db.query(
        `
          SELECT
            application.id AS application_id,
            application.user_id,
            application.status AS application_status,
            application.registration_token_hash,
            application.registration_token_expires_at,

            payment_order.id AS local_order_id,
            payment_order.provider_order_id,
            payment_order.amount_paise,
            payment_order.currency,
            payment_order.status AS payment_order_status,
            payment_order.plan_selection_id,

            selection.plan_id,
            selection.plan_code_snapshot,
            selection.plan_name_snapshot,
            selection.tier_code_snapshot,
            selection.price_paise_snapshot,
            selection.duration_days_snapshot,
            selection.plan_version_snapshot

          FROM registration_applications application

          INNER JOIN payment_orders payment_order
            ON payment_order.registration_application_id =
               application.id

          INNER JOIN registration_plan_selections selection
            ON selection.id =
               payment_order.plan_selection_id

          WHERE application.id = $1
            AND payment_order.provider_order_id = $2

          FOR UPDATE OF application, payment_order
        `,
        [applicationId, razorpayOrderId]
      );

      if (lockedResult.rows.length === 0) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(404).json({
          success: false,
          message:
            "The registration payment order was not found.",
        });
        return;
      }

      const locked = lockedResult.rows[0];

      const lockedAccess =
        verifyRegistrationAccess(
          locked,
          registrationToken
        );

      if (!lockedAccess.valid) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(401).json({
          success: false,
          message: lockedAccess.message,
        });
        return;
      }

      /*
       * Idempotent retry: the same verified callback can safely
       * return success without creating duplicate transactions.
       */
      if (
        locked.payment_order_status === "PAID" &&
        locked.application_status ===
          "PAID_PENDING_APPROVAL"
      ) {
        const existingTransaction =
          await db.query(
            `
              SELECT id
              FROM payment_transactions
              WHERE payment_order_id = $1
                AND provider_payment_id = $2
                AND transaction_type = 'PAYMENT'
              LIMIT 1
            `,
            [
              locked.local_order_id,
              razorpayPaymentId,
            ]
          );

        if (
          existingTransaction.rows.length > 0
        ) {
          const existingSubscription =
            await db.query(
              `
                SELECT id
                FROM subscriptions
                WHERE registration_application_id =
                      $1
                  AND status =
                      'PAID_PENDING_APPROVAL'
                LIMIT 1
              `,
              [applicationId]
            );

          await db.query("COMMIT");
          transactionOpen = false;

          res.status(200).json({
            success: true,
            message:
              "Payment was already verified.",
            registrationStatus:
              "PAID_PENDING_APPROVAL",
            subscriptionId:
              existingSubscription.rows[0]?.id ||
              null,
            nextStep: "ADMIN_APPROVAL",
          });
          return;
        }

        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "This order was already paid with a different payment record.",
        });
        return;
      }

      if (
        ![
          "PAYMENT_PENDING",
          "PAYMENT_FAILED",
        ].includes(locked.application_status)
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Payment cannot be verified at this registration stage.",
          registrationStatus:
            locked.application_status,
        });
        return;
      }

      if (
        !["CREATED", "PENDING"].includes(
          locked.payment_order_status
        )
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "Payment order is not open for verification.",
          paymentOrderStatus:
            locked.payment_order_status,
        });
        return;
      }

      const transactionResult =
        await db.query(
          `
            INSERT INTO payment_transactions (
              payment_order_id,
              provider_payment_id,
              provider_signature,
              transaction_type,
              status,
              amount_paise,
              currency,
              provider_payload
            )
            VALUES (
              $1,
              $2,
              $3,
              'PAYMENT',
              'CAPTURED',
              $4,
              $5,
              $6::jsonb
            )
            RETURNING id
          `,
          [
            locked.local_order_id,
            razorpayPaymentId,
            razorpaySignature,
            Number(providerPayment.amount),
            String(providerPayment.currency),
            JSON.stringify(providerPayment),
          ]
        );

      await db.query(
        `
          UPDATE payment_orders
          SET
            status = 'PAID',
            paid_at = NOW(),
            failure_reason = NULL,
            failed_at = NULL
          WHERE id = $1
        `,
        [locked.local_order_id]
      );

      await db.query(
        `
          UPDATE registration_applications
          SET
            status = 'PAID_PENDING_APPROVAL',
            paid_at = NOW()
          WHERE id = $1
        `,
        [applicationId]
      );

      const existingSubscription =
        await db.query(
          `
            SELECT
              id,
              status
            FROM subscriptions
            WHERE registration_application_id = $1
            FOR UPDATE
          `,
          [applicationId]
        );

      let subscriptionId: string;
      let previousSubscriptionStatus:
        | string
        | null = null;

      if (
        existingSubscription.rows.length === 0
      ) {
        const subscriptionResult =
          await db.query(
            `
              INSERT INTO subscriptions (
                user_id,
                registration_application_id,
                plan_id,
                payment_order_id,
                status,
                plan_code_snapshot,
                plan_name_snapshot,
                tier_code_snapshot,
                price_paise_snapshot,
                duration_days_snapshot,
                plan_version_snapshot
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                'PAID_PENDING_APPROVAL',
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
              )
              RETURNING id
            `,
            [
              locked.user_id,
              applicationId,
              locked.plan_id,
              locked.local_order_id,
              locked.plan_code_snapshot,
              locked.plan_name_snapshot,
              locked.tier_code_snapshot,
              Number(
                locked.price_paise_snapshot
              ),
              Number(
                locked.duration_days_snapshot
              ),
              Number(
                locked.plan_version_snapshot
              ),
            ]
          );

        subscriptionId =
          subscriptionResult.rows[0].id;
      } else {
        subscriptionId =
          existingSubscription.rows[0].id;
        previousSubscriptionStatus =
          existingSubscription.rows[0].status;

        await db.query(
          `
            UPDATE subscriptions
            SET
              user_id = COALESCE(user_id, $1),
              plan_id = $2,
              payment_order_id = $3,
              status =
                'PAID_PENDING_APPROVAL',
              plan_code_snapshot = $4,
              plan_name_snapshot = $5,
              tier_code_snapshot = $6,
              price_paise_snapshot = $7,
              duration_days_snapshot = $8,
              plan_version_snapshot = $9
            WHERE id = $10
          `,
          [
            locked.user_id,
            locked.plan_id,
            locked.local_order_id,
            locked.plan_code_snapshot,
            locked.plan_name_snapshot,
            locked.tier_code_snapshot,
            Number(
              locked.price_paise_snapshot
            ),
            Number(
              locked.duration_days_snapshot
            ),
            Number(
              locked.plan_version_snapshot
            ),
            subscriptionId,
          ]
        );
      }

      await db.query(
        `
          INSERT INTO subscription_events (
            subscription_id,
            event_type,
            previous_status,
            new_status,
            actor_user_id,
            reason,
            metadata
          )
          VALUES (
            $1,
            'PAYMENT_VERIFIED',
            $2,
            'PAID_PENDING_APPROVAL',
            NULL,
            'Razorpay payment captured and verified',
            $3::jsonb
          )
        `,
        [
          subscriptionId,
          previousSubscriptionStatus,
          JSON.stringify({
            applicationId,
            paymentOrderId:
              locked.local_order_id,
            paymentTransactionId:
              transactionResult.rows[0].id,
            razorpayOrderId,
            razorpayPaymentId,
          }),
        ]
      );

      await db.query("COMMIT");
      transactionOpen = false;

      try {
        await createAuditLog({
          adminName: "SYSTEM",
          adminRole: "SYSTEM",
          action:
            "REGISTRATION_PAYMENT_VERIFIED",
          module: "PAYMENT",
          targetEntity: subscriptionId,
          targetType: "SUBSCRIPTION",
          description:
            "Razorpay registration payment captured and verified",
          status: "SUCCESS",
          ipAddress: getClientIp(req),
          device:
            req.headers["user-agent"]?.toString() ||
            "",
          oldValue: {
            applicationStatus:
              locked.application_status,
            paymentOrderStatus:
              locked.payment_order_status,
          },
          newValue: {
            applicationStatus:
              "PAID_PENDING_APPROVAL",
            paymentOrderStatus: "PAID",
            subscriptionStatus:
              "PAID_PENDING_APPROVAL",
            applicationId,
            razorpayOrderId,
            razorpayPaymentId,
            amountPaise: Number(
              providerPayment.amount
            ),
            currency:
              providerPayment.currency,
          },
        });
      } catch (auditError) {
        console.error(
          "PAYMENT VERIFICATION AUDIT ERROR:",
          auditError
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Payment verified. Registration is pending Admin approval.",
        registrationStatus:
          "PAID_PENDING_APPROVAL",
        subscriptionId,
        nextStep: "ADMIN_APPROVAL",
      });
    } catch (transactionError: any) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "PAYMENT VERIFICATION ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      if (transactionError?.code === "23505") {
        res.status(409).json({
          success: false,
          message:
            "This Razorpay payment has already been processed.",
        });
        return;
      }

      throw transactionError;
    } finally {
      db.release();
    }
  } catch (error: any) {
    if (error?.code === "22P02") {
      res.status(400).json({
        success: false,
        message:
          "Invalid registration application ID.",
      });
      return;
    }

    console.error(
      "VERIFY REGISTRATION PAYMENT ERROR:",
      error
    );

    res.status(502).json({
      success: false,
      message:
        "Unable to verify the Razorpay payment.",
    });
  }
};
