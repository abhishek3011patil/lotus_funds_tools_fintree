import https from "https";
import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createAuditLog } from "../utils/auditLogger";
import { sendRejectionRefundMail } from "../config/mailer";

type ApplicantType = "RA" | "BROKER";

type ApplicantConfig = {
  table: "ra_details" | "broker_details";
  nameExpression: string;
};

type RazorpayRefund = {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  status: "pending" | "processed" | "failed";
  receipt?: string | null;
  notes?: Record<string, unknown>;
  created_at?: number;
  speed_requested?: string;
  speed_processed?: string;
  acquirer_data?: Record<string, unknown>;
};

type RazorpayErrorBody = {
  error?: {
    code?: string;
    description?: string;
    source?: string | null;
    step?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  };
};

const CONFIG: Record<ApplicantType, ApplicantConfig> = {
  RA: {
    table: "ra_details",
    nameExpression: `
      TRIM(
        CONCAT_WS(
          ' ',
          details.first_name,
          details.surname
        )
      )
    `,
  },
  BROKER: {
    table: "broker_details",
    nameExpression: "details.legal_name",
  },
};

const normalizeApplicantType = (
  value: unknown
): ApplicantType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  return normalized === "RA" ||
    normalized === "BROKER"
    ? normalized
    : null;
};

const getString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const getClientIp = (
  req: AuthRequest
): string => {
  const forwarded =
    req.headers["x-forwarded-for"]
      ?.toString()
      .split(",")[0]
      ?.trim();

  return (
    forwarded ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};

const getRazorpayCredentials = (): {
  keyId: string;
  keySecret: string;
} => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured."
    );
  }

  return {
    keyId,
    keySecret,
  };
};

const createRefundIdempotencyKey = (
  applicationId: string
): string =>
  `registration-refund-${applicationId.replace(
    /[^a-zA-Z0-9_-]/g,
    "-"
  )}`;

const createRefundReceipt = (
  applicationId: string
): string =>
  `rej_${applicationId
    .replace(/-/g, "")
    .slice(0, 20)}`;

const requestRazorpayRefund = async ({
  paymentId,
  amountPaise,
  applicationId,
  rejectionReason,
  idempotencyKey,
}: {
  paymentId: string;
  amountPaise: number;
  applicationId: string;
  rejectionReason: string;
  idempotencyKey: string;
}): Promise<RazorpayRefund> => {
  const { keyId, keySecret } =
    getRazorpayCredentials();

  const body = JSON.stringify({
    amount: amountPaise,
    speed: "normal",
    receipt:
      createRefundReceipt(applicationId),
    notes: {
      registration_application_id:
        applicationId,
      rejection_reason:
        rejectionReason.slice(0, 250),
      refund_type:
        "ADMIN_REGISTRATION_REJECTION",
    },
  });

  return new Promise<RazorpayRefund>(
    (resolve, reject) => {
      const request = https.request(
        {
          hostname: "api.razorpay.com",
          port: 443,
          path: `/v1/payments/${encodeURIComponent(
            paymentId
          )}/refund`,
          method: "POST",
          auth: `${keyId}:${keySecret}`,
          headers: {
            "Content-Type":
              "application/json",
            "Content-Length":
              Buffer.byteLength(body),
            "X-Refund-Idempotency":
              idempotencyKey,
          },
          timeout: 30_000,
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on("data", (chunk) => {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)
            );
          });

          response.on("end", () => {
            const rawBody = Buffer.concat(
              chunks
            ).toString("utf8");

            let parsed:
              | RazorpayRefund
              | RazorpayErrorBody
              | null = null;

            try {
              parsed = rawBody
                ? JSON.parse(rawBody)
                : null;
            } catch {
              parsed = null;
            }

            const statusCode =
              response.statusCode || 500;

            if (
              statusCode >= 200 &&
              statusCode < 300 &&
              parsed &&
              "id" in parsed
            ) {
              resolve(
                parsed as RazorpayRefund
              );
              return;
            }

            const errorBody =
              parsed as RazorpayErrorBody | null;

            const error = new Error(
              errorBody?.error?.description ||
                `Razorpay refund request failed with status ${statusCode}.`
            ) as Error & {
              statusCode?: number;
              providerCode?: string;
              providerBody?: unknown;
            };

            error.statusCode = statusCode;
            error.providerCode =
              errorBody?.error?.code;
            error.providerBody = parsed;

            reject(error);
          });
        }
      );

      request.on("timeout", () => {
        request.destroy(
          new Error(
            "Razorpay refund request timed out."
          )
        );
      });

      request.on("error", reject);
      request.write(body);
      request.end();
    }
  );
};

const mapRefundState = (
  providerStatus: RazorpayRefund["status"]
): {
  applicationStatus:
    | "REFUND_PENDING"
    | "REFUNDED";
  subscriptionStatus:
    | "REFUND_PENDING"
    | "REFUNDED";
  paymentOrderStatus:
    | "REFUND_PENDING"
    | "REFUNDED";
  transactionStatus:
    | "PENDING"
    | "PROCESSED"
    | "FAILED";
} => {
  if (providerStatus === "processed") {
    return {
      applicationStatus: "REFUNDED",
      subscriptionStatus: "REFUNDED",
      paymentOrderStatus: "REFUNDED",
      transactionStatus: "PROCESSED",
    };
  }

  if (providerStatus === "failed") {
    /*
     * Existing status constraints do not contain REFUND_FAILED.
     * Keep the business entities REFUND_PENDING so an Admin or
     * webhook/reconciliation job can resolve the failed refund.
     */
    return {
      applicationStatus: "REFUND_PENDING",
      subscriptionStatus: "REFUND_PENDING",
      paymentOrderStatus: "REFUND_PENDING",
      transactionStatus: "FAILED",
    };
  }

  return {
    applicationStatus: "REFUND_PENDING",
    subscriptionStatus: "REFUND_PENDING",
    paymentOrderStatus: "REFUND_PENDING",
    transactionStatus: "PENDING",
  };
};

const sendSafeRejectionEmail = async ({
  email,
  name,
  reason,
  refundRequired,
  refundStatus,
  amountPaise,
  currency,
}: {
  email: string;
  name: string;
  reason: string;
  refundRequired: boolean;
  refundStatus?: string;
  amountPaise?: number;
  currency?: string;
}): Promise<boolean> => {
  try {
    await sendRejectionRefundMail({
      to: email,
      name,
      reason,
      refundRequired,
      refundStatus,
      amountPaise,
      currency,
    });

    return true;
  } catch (error) {
    console.error(
      "REJECTION EMAIL ERROR:",
      error
    );

    return false;
  }
};

/**
 * PUT /api/registration/reject/:type/:id
 *
 * Existing route and button can remain.
 *
 * Body accepts either:
 * {
 *   "reason": "..."
 * }
 *
 * or the older:
 * {
 *   "rejectionReason": "..."
 * }
 *
 * Paid application:
 * REJECT button -> REFUND_PENDING -> Razorpay full refund.
 *
 * Unpaid legacy application:
 * REJECT button -> REJECTED, with no Razorpay call.
 */
export const rejectRegistrationWithRefund =
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const applicantType =
      normalizeApplicantType(req.params.type);

    const entityId = getString(req.params.id);

    const reason =
      getString(req.body?.reason) ||
      getString(req.body?.rejectionReason);

    const adminId = req.user?.id;

    if (
      !applicantType ||
      !entityId ||
      !reason
    ) {
      res.status(400).json({
        success: false,
        message:
          "Valid type, registration ID and rejection reason are required.",
      });
      return;
    }

    if (reason.length < 5) {
      res.status(400).json({
        success: false,
        message:
          "Rejection reason must contain at least 5 characters.",
      });
      return;
    }

    if (reason.length > 1000) {
      res.status(400).json({
        success: false,
        message:
          "Rejection reason must not exceed 1000 characters.",
      });
      return;
    }

    if (!adminId) {
      res.status(401).json({
        success: false,
        message:
          "Authenticated Admin user is required.",
      });
      return;
    }

    const config = CONFIG[applicantType];

    let prepared:
      | {
          applicationId: string;
          subscriptionId: string | null;
          paymentOrderId: string | null;
          paymentId: string | null;
          amountPaise: number | null;
          currency: string | null;
          idempotencyKey: string | null;
          name: string;
          email: string;
          refundRequired: boolean;
          alreadyFinal: boolean;
          finalStatus?: string;
        }
      | undefined;

    /*
     * Phase 1:
     * Lock and mark the application rejected/refund-pending
     * before making an external Razorpay request.
     */
    const db = await pool.connect();
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      const result = await db.query(
        `
          SELECT
            details.id AS entity_id,
            details.status AS details_status,
            ${config.nameExpression}
              AS applicant_name,
            details.email,

            application.id
              AS application_id,
            application.status
              AS application_status,
            application.user_id,

            subscription.id
              AS subscription_id,
            subscription.status
              AS subscription_status,

            payment_order.id
              AS payment_order_id,
            payment_order.status
              AS payment_order_status,
            payment_order.amount_paise,
            payment_order.currency,
            payment_order.refund_idempotency_key,

            payment_transaction.provider_payment_id,
            payment_transaction.status
              AS payment_transaction_status,

            refund_transaction.provider_refund_id,
            refund_transaction.status
              AS refund_transaction_status

          FROM ${config.table} details

          LEFT JOIN registration_applications
            application
            ON application.entity_id = details.id
           AND application.applicant_type = $2

          LEFT JOIN subscriptions subscription
            ON subscription.registration_application_id =
               application.id

          LEFT JOIN payment_orders payment_order
            ON payment_order.registration_application_id =
               application.id
           AND payment_order.status IN (
             'PAID',
             'REFUND_PENDING',
             'REFUNDED'
           )

          LEFT JOIN LATERAL (
            SELECT
              transaction.provider_payment_id,
              transaction.status
            FROM payment_transactions transaction
            WHERE transaction.payment_order_id =
                  payment_order.id
              AND transaction.transaction_type =
                  'PAYMENT'
            ORDER BY transaction.created_at DESC
            LIMIT 1
          ) payment_transaction ON true

          LEFT JOIN LATERAL (
            SELECT
              transaction.provider_refund_id,
              transaction.status
            FROM payment_transactions transaction
            WHERE transaction.payment_order_id =
                  payment_order.id
              AND transaction.transaction_type =
                  'REFUND'
            ORDER BY transaction.created_at DESC
            LIMIT 1
          ) refund_transaction ON true

          WHERE details.id = $1

          ORDER BY application.created_at DESC
          LIMIT 1

          FOR UPDATE OF
            details,
            application,
            subscription,
            payment_order
        `,
        [entityId, applicantType]
      );

      if (result.rows.length === 0) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(404).json({
          success: false,
          message:
            `${applicantType} registration was not found.`,
        });
        return;
      }

      const record = result.rows[0];

      const name = String(
        record.applicant_name || ""
      ).trim();

      const email = String(
        record.email || ""
      )
        .trim()
        .toLowerCase();

      if (
        record.application_status ===
          "APPROVED" ||
        record.subscription_status ===
          "ACTIVE" ||
        record.user_id
      ) {
        await db.query("ROLLBACK");
        transactionOpen = false;

        res.status(409).json({
          success: false,
          message:
            "An approved active registration cannot be rejected through the registration review endpoint. Use suspension/cancellation rules instead.",
        });
        return;
      }

      if (
        record.application_status ===
          "REFUNDED" &&
        record.payment_order_status ===
          "REFUNDED"
      ) {
        await db.query("COMMIT");
        transactionOpen = false;

        res.status(200).json({
          success: true,
          message:
            "Registration was already rejected and refunded.",
          registrationStatus: "REFUNDED",
          refundStatus: "PROCESSED",
          providerRefundId:
            record.provider_refund_id ||
            null,
          alreadyProcessed: true,
        });
        return;
      }

      if (
        record.application_status ===
          "REJECTED" &&
        !record.payment_order_id
      ) {
        await db.query("COMMIT");
        transactionOpen = false;

        res.status(200).json({
          success: true,
          message:
            "Registration was already rejected.",
          registrationStatus: "REJECTED",
          refundRequired: false,
          alreadyProcessed: true,
        });
        return;
      }

      const paid =
        record.payment_order_status ===
          "PAID" ||
        record.payment_order_status ===
          "REFUND_PENDING" ||
        record.payment_order_status ===
          "REFUNDED";

      /*
       * Legacy or pre-payment registrations can be rejected
       * without a refund.
       */
      if (!paid) {
        await db.query(
          `
            UPDATE ${config.table}
            SET
              status = 'rejected',
              rejection_reason = $1
              ${
                applicantType === "BROKER"
                  ? ", updated_at = NOW()"
                  : ""
              }
            WHERE id = $2
          `,
          [reason, entityId]
        );

        if (record.application_id) {
          await db.query(
            `
              UPDATE registration_applications
              SET
                status = 'REJECTED',
                rejected_at = NOW(),
                rejected_by = $1,
                rejection_reason = $2,
                registration_token_hash = NULL,
                registration_token_expires_at =
                  NULL
              WHERE id = $3
            `,
            [
              adminId,
              reason,
              record.application_id,
            ]
          );
        }

        if (record.subscription_id) {
          await db.query(
            `
              UPDATE subscriptions
              SET status = 'REJECTED'
              WHERE id = $1
            `,
            [record.subscription_id]
          );

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
                'ADMIN_REJECTED',
                $2,
                'REJECTED',
                $3,
                $4,
                $5::jsonb
              )
            `,
            [
              record.subscription_id,
              record.subscription_status,
              adminId,
              reason,
              JSON.stringify({
                applicantType,
                entityId,
                refundRequired: false,
              }),
            ]
          );
        }

        await db.query("COMMIT");
        transactionOpen = false;

        prepared = {
          applicationId:
            record.application_id || "",
          subscriptionId:
            record.subscription_id || null,
          paymentOrderId: null,
          paymentId: null,
          amountPaise: null,
          currency: null,
          idempotencyKey: null,
          name,
          email,
          refundRequired: false,
          alreadyFinal: true,
          finalStatus: "REJECTED",
        };
      } else {
        if (
          !record.application_id ||
          !record.subscription_id ||
          !record.payment_order_id ||
          !record.provider_payment_id ||
          !Number.isSafeInteger(
            Number(record.amount_paise)
          ) ||
          Number(record.amount_paise) <= 0
        ) {
          await db.query("ROLLBACK");
          transactionOpen = false;

          res.status(409).json({
            success: false,
            message:
              "Paid registration is missing the verified payment or subscription data required for a refund.",
          });
          return;
        }

        if (
          String(
            record.payment_transaction_status
          ).toUpperCase() !== "CAPTURED"
        ) {
          await db.query("ROLLBACK");
          transactionOpen = false;

          res.status(409).json({
            success: false,
            message:
              "Only a captured Razorpay payment can be refunded.",
          });
          return;
        }

        const idempotencyKey =
          record.refund_idempotency_key ||
          createRefundIdempotencyKey(
            record.application_id
          );

        await db.query(
          `
            UPDATE ${config.table}
            SET
              status = 'rejected',
              rejection_reason = $1
              ${
                applicantType === "BROKER"
                  ? ", updated_at = NOW()"
                  : ""
              }
            WHERE id = $2
          `,
          [reason, entityId]
        );

        await db.query(
          `
            UPDATE registration_applications
            SET
              status = 'REFUND_PENDING',
              rejected_at = COALESCE(
                rejected_at,
                NOW()
              ),
              rejected_by = $1,
              rejection_reason = $2,
              registration_token_hash = NULL,
              registration_token_expires_at =
                NULL
            WHERE id = $3
          `,
          [
            adminId,
            reason,
            record.application_id,
          ]
        );

        await db.query(
          `
            UPDATE subscriptions
            SET
              status = 'REFUND_PENDING',
              cancellation_reason = $1
            WHERE id = $2
          `,
          [
            reason,
            record.subscription_id,
          ]
        );

        await db.query(
          `
            UPDATE payment_orders
            SET
              status = 'REFUND_PENDING',
              refund_idempotency_key = $1
            WHERE id = $2
          `,
          [
            idempotencyKey,
            record.payment_order_id,
          ]
        );

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
              'ADMIN_REJECTED_REFUND_REQUESTED',
              $2,
              'REFUND_PENDING',
              $3,
              $4,
              $5::jsonb
            )
          `,
          [
            record.subscription_id,
            record.subscription_status,
            adminId,
            reason,
            JSON.stringify({
              applicantType,
              entityId,
              applicationId:
                record.application_id,
              paymentOrderId:
                record.payment_order_id,
              paymentId:
                record.provider_payment_id,
              amountPaise: Number(
                record.amount_paise
              ),
              idempotencyKey,
            }),
          ]
        );

        await db.query("COMMIT");
        transactionOpen = false;

        prepared = {
          applicationId:
            record.application_id,
          subscriptionId:
            record.subscription_id,
          paymentOrderId:
            record.payment_order_id,
          paymentId:
            record.provider_payment_id,
          amountPaise: Number(
            record.amount_paise
          ),
          currency:
            record.currency || "INR",
          idempotencyKey,
          name,
          email,
          refundRequired: true,
          alreadyFinal: false,
        };
      }
    } catch (error: any) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "REJECTION PREPARE ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      if (error?.code === "22P02") {
        res.status(400).json({
          success: false,
          message:
            "Invalid registration or Admin ID.",
        });
        return;
      }

      console.error(
        "PREPARE REGISTRATION REJECTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to prepare registration rejection.",
      });
      return;
    } finally {
      db.release();
    }

    if (!prepared) {
      res.status(500).json({
        success: false,
        message:
          "Rejection completed without a result.",
      });
      return;
    }

    if (!prepared.refundRequired) {
      const emailSent =
        await sendSafeRejectionEmail({
          email: prepared.email,
          name: prepared.name,
          reason,
          refundRequired: false,
        });

      try {
        await createAuditLog({
          adminId,
          adminName:
            req.user?.name || "ADMIN",
          adminRole:
            req.user?.role || "ADMIN",
          action:
            "REGISTRATION_REJECTED",
          module: applicantType,
          targetEntity: prepared.email,
          targetType: applicantType,
          description:
            `${applicantType} registration rejected without refund`,
          status: "SUCCESS",
          reason,
          ipAddress: getClientIp(req),
          device:
            req.headers["user-agent"]?.toString() ||
            "",
          oldValue: null,
          newValue: {
            applicationId:
              prepared.applicationId || null,
            registrationStatus:
              "REJECTED",
            refundRequired: false,
            emailSent,
          },
        });
      } catch (auditError) {
        console.error(
          "REJECTION AUDIT ERROR:",
          auditError
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Registration rejected successfully.",
        registrationStatus: "REJECTED",
        refundRequired: false,
        emailSent,
      });
      return;
    }

    if (
      !prepared.paymentId ||
      !prepared.paymentOrderId ||
      !prepared.subscriptionId ||
      prepared.amountPaise === null ||
      !prepared.currency ||
      !prepared.idempotencyKey
    ) {
      res.status(500).json({
        success: false,
        message:
          "Refund preparation is incomplete.",
      });
      return;
    }

    let refund: RazorpayRefund;

    try {
      refund = await requestRazorpayRefund({
        paymentId: prepared.paymentId,
        amountPaise:
          prepared.amountPaise,
        applicationId:
          prepared.applicationId,
        rejectionReason: reason,
        idempotencyKey:
          prepared.idempotencyKey,
      });
    } catch (error: any) {
      /*
       * Keep REFUND_PENDING. A retry uses the same stable
       * X-Refund-Idempotency value, protecting against a
       * duplicate refund if Razorpay received the first call
       * but the network response was lost.
       */
      try {
        await createAuditLog({
          adminId,
          adminName:
            req.user?.name || "ADMIN",
          adminRole:
            req.user?.role || "ADMIN",
          action:
            "REGISTRATION_REFUND_API_ERROR",
          module: "PAYMENT",
          targetEntity:
            prepared.paymentOrderId,
          targetType:
            "REGISTRATION_PAYMENT_ORDER",
          description:
            "Registration was rejected but Razorpay refund initiation needs reconciliation",
          status: "FAILED",
          reason:
            error instanceof Error
              ? error.message
              : "Razorpay refund failed",
          ipAddress: getClientIp(req),
          device:
            req.headers["user-agent"]?.toString() ||
            "",
          oldValue: null,
          newValue: {
            applicationId:
              prepared.applicationId,
            paymentId:
              prepared.paymentId,
            idempotencyKey:
              prepared.idempotencyKey,
            registrationStatus:
              "REFUND_PENDING",
          },
        });
      } catch (auditError) {
        console.error(
          "REFUND FAILURE AUDIT ERROR:",
          auditError
        );
      }

      res.status(502).json({
        success: false,
        message:
          "Registration was rejected, but the refund could not be confirmed. The application remains REFUND_PENDING and can be safely retried.",
        registrationStatus:
          "REFUND_PENDING",
        refundStatus: "UNKNOWN",
        retrySafe: true,
        error:
          error instanceof Error
            ? error.message
            : "Razorpay refund request failed.",
      });
      return;
    }

    const mapped =
      mapRefundState(refund.status);

    /*
     * Phase 2:
     * Persist the Razorpay refund response and final/current
     * refund state.
     */
    const finalDb = await pool.connect();
    transactionOpen = false;

    try {
      await finalDb.query("BEGIN");
      transactionOpen = true;

      const lockedOrder =
        await finalDb.query(
          `
            SELECT
              id,
              status,
              amount_paise,
              currency
            FROM payment_orders
            WHERE id = $1
            FOR UPDATE
          `,
          [prepared.paymentOrderId]
        );

      if (
        lockedOrder.rows.length === 0
      ) {
        throw new Error(
          "Local payment order disappeared during refund processing."
        );
      }

      await finalDb.query(
        `
          INSERT INTO payment_transactions (
            payment_order_id,
            provider_payment_id,
            provider_refund_id,
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
            'REFUND',
            $4,
            $5,
            $6,
            $7::jsonb
          )
          ON CONFLICT (
            provider_refund_id
          )
          WHERE provider_refund_id IS NOT NULL
            AND transaction_type = 'REFUND'
          DO UPDATE SET
            status = EXCLUDED.status,
            amount_paise =
              EXCLUDED.amount_paise,
            currency =
              EXCLUDED.currency,
            provider_payload =
              EXCLUDED.provider_payload
        `,
        [
          prepared.paymentOrderId,
          prepared.paymentId,
          refund.id,
          mapped.transactionStatus,
          Number(refund.amount),
          refund.currency ||
            prepared.currency,
          JSON.stringify(refund),
        ]
      );

      await finalDb.query(
        `
          UPDATE payment_orders
          SET
            status = $1,
            refunded_at =
              CASE
                WHEN $1 = 'REFUNDED'
                THEN NOW()
                ELSE refunded_at
              END
          WHERE id = $2
        `,
        [
          mapped.paymentOrderStatus,
          prepared.paymentOrderId,
        ]
      );

      await finalDb.query(
        `
          UPDATE registration_applications
          SET status = $1
          WHERE id = $2
        `,
        [
          mapped.applicationStatus,
          prepared.applicationId,
        ]
      );

      await finalDb.query(
        `
          UPDATE subscriptions
          SET status = $1
          WHERE id = $2
        `,
        [
          mapped.subscriptionStatus,
          prepared.subscriptionId,
        ]
      );

      await finalDb.query(
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
            $2,
            'REFUND_PENDING',
            $3,
            $4,
            $5,
            $6::jsonb
          )
        `,
        [
          prepared.subscriptionId,
          refund.status === "processed"
            ? "REFUND_PROCESSED"
            : refund.status === "failed"
              ? "REFUND_FAILED"
              : "REFUND_CREATED",
          mapped.subscriptionStatus,
          adminId,
          reason,
          JSON.stringify({
            applicationId:
              prepared.applicationId,
            paymentOrderId:
              prepared.paymentOrderId,
            providerPaymentId:
              prepared.paymentId,
            providerRefundId: refund.id,
            providerRefundStatus:
              refund.status,
            amountPaise:
              Number(refund.amount),
            currency:
              refund.currency ||
              prepared.currency,
            idempotencyKey:
              prepared.idempotencyKey,
          }),
        ]
      );

      await finalDb.query("COMMIT");
      transactionOpen = false;
    } catch (error) {
      if (transactionOpen) {
        try {
          await finalDb.query(
            "ROLLBACK"
          );
        } catch (rollbackError) {
          console.error(
            "REFUND FINALIZE ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      console.error(
        "FINALIZE REGISTRATION REFUND ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Razorpay accepted the refund, but the local database could not finalize it. Reconcile using the Razorpay refund ID.",
        registrationStatus:
          "REFUND_PENDING",
        providerRefundId: refund.id,
        providerRefundStatus:
          refund.status,
      });
      return;
    } finally {
      finalDb.release();
    }

    const emailSent =
      await sendSafeRejectionEmail({
        email: prepared.email,
        name: prepared.name,
        reason,
        refundRequired: true,
        refundStatus: refund.status,
        amountPaise:
          Number(refund.amount),
        currency:
          refund.currency ||
          prepared.currency,
      });

    try {
      await createAuditLog({
        adminId,
        adminName:
          req.user?.name || "ADMIN",
        adminRole:
          req.user?.role || "ADMIN",
        action:
          "PAID_REGISTRATION_REJECTED",
        module: applicantType,
        targetEntity: prepared.email,
        targetType: applicantType,
        description:
          `${applicantType} registration rejected and Razorpay refund created`,
        status:
          refund.status === "failed"
            ? "FAILED"
            : "SUCCESS",
        reason,
        ipAddress: getClientIp(req),
        device:
          req.headers["user-agent"]?.toString() ||
          "",
        oldValue: {
          registrationStatus:
            "PAID_PENDING_APPROVAL",
          subscriptionStatus:
            "PAID_PENDING_APPROVAL",
          paymentOrderStatus: "PAID",
        },
        newValue: {
          registrationStatus:
            mapped.applicationStatus,
          subscriptionStatus:
            mapped.subscriptionStatus,
          paymentOrderStatus:
            mapped.paymentOrderStatus,
          providerRefundId: refund.id,
          providerRefundStatus:
            refund.status,
          amountPaise:
            Number(refund.amount),
          currency:
            refund.currency ||
            prepared.currency,
          emailSent,
        },
      });
    } catch (auditError) {
      console.error(
        "PAID REJECTION AUDIT ERROR:",
        auditError
      );
    }

    const processed =
      refund.status === "processed";

    res.status(
      refund.status === "failed"
        ? 502
        : 200
    ).json({
      success:
        refund.status !== "failed",
      message: processed
        ? "Registration rejected and refund processed successfully."
        : refund.status === "pending"
          ? "Registration rejected. Razorpay refund is pending."
          : "Registration rejected, but Razorpay reported that the refund failed.",
      registrationStatus:
        mapped.applicationStatus,
      subscriptionStatus:
        mapped.subscriptionStatus,
      paymentOrderStatus:
        mapped.paymentOrderStatus,
      refundRequired: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amountPaise:
          Number(refund.amount),
        amountRupees:
          Number(refund.amount) / 100,
        currency:
          refund.currency ||
          prepared.currency,
        paymentId:
          refund.payment_id,
      },
      emailSent,
      nextStep: processed
        ? "REFUND_COMPLETE"
        : "WAIT_FOR_REFUND_WEBHOOK",
    });
  };
