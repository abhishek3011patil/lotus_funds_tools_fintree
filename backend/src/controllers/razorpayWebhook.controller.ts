import crypto from "crypto";
import type {
  Request,
  Response,
} from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";

type ProcessingResult = {
  status: "PROCESSED" | "IGNORED";
  message: string;
};

type RazorpayWebhookPayload = {
  entity?: string;
  account_id?: string;
  event?: string;
  contains?: string[];
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
    refund?: {
      entity?: RazorpayRefundEntity;
    };
  };
  created_at?: number;
};

type RazorpayPaymentEntity = {
  id?: string;
  entity?: string;
  amount?: number;
  currency?: string;
  status?: string;
  order_id?: string | null;
  captured?: boolean;
  amount_refunded?: number;
  refund_status?: string | null;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
  notes?: unknown;
  created_at?: number;
  [key: string]: unknown;
};

type RazorpayRefundEntity = {
  id?: string;
  entity?: string;
  amount?: number;
  currency?: string;
  payment_id?: string;
  status?: string;
  receipt?: string | null;
  notes?: unknown;
  created_at?: number;
  speed_requested?: string;
  speed_processed?: string;
  [key: string]: unknown;
};

class NonRetryableWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableWebhookError";
  }
}

const getHeader = (
  req: Request,
  name: string
): string => {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string"
    ? value.trim()
    : "";
};

const getWebhookSecrets = (): string[] => {
  const secrets = [
    process.env.RAZORPAY_WEBHOOK_SECRET,
    process.env.RAZORPAY_WEBHOOK_OLD_SECRET,
  ]
    .map((value) => value?.trim())
    .filter(
      (value): value is string =>
        Boolean(value)
    );

  return [...new Set(secrets)];
};

const isValidSignature = (
  rawBody: Buffer,
  receivedSignature: string,
  secrets: string[]
): boolean => {
  if (
    !receivedSignature ||
    !/^[a-f0-9]+$/i.test(
      receivedSignature
    )
  ) {
    return false;
  }

  let received: Buffer;

  try {
    received = Buffer.from(
      receivedSignature,
      "hex"
    );
  } catch {
    return false;
  }

  return secrets.some((secret) => {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest();

    return (
      received.length === expected.length &&
      crypto.timingSafeEqual(
        received,
        expected
      )
    );
  });
};

const requireString = (
  value: unknown,
  label: string
): string => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new NonRetryableWebhookError(
      `${label} is missing from the webhook payload.`
    );
  }

  return value.trim();
};

const requirePositiveInteger = (
  value: unknown,
  label: string
): number => {
  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    throw new NonRetryableWebhookError(
      `${label} must be a positive integer.`
    );
  }

  return parsed;
};

const normalizeCurrency = (
  value: unknown
): string =>
  String(value || "")
    .trim()
    .toUpperCase();

const getPaymentEntity = (
  payload: RazorpayWebhookPayload
): RazorpayPaymentEntity =>
  payload.payload?.payment?.entity || {};

const getRefundEntity = (
  payload: RazorpayWebhookPayload
): RazorpayRefundEntity =>
  payload.payload?.refund?.entity || {};

const insertOrLockPaymentTransaction =
  async ({
    db,
    paymentOrderId,
    payment,
    rawPayload,
    status,
  }: {
    db: PoolClient;
    paymentOrderId: string;
    payment: RazorpayPaymentEntity;
    rawPayload: RazorpayWebhookPayload;
    status: "CAPTURED" | "FAILED";
  }): Promise<string> => {
    const paymentId = requireString(
      payment.id,
      "payment.id"
    );

    const existing = await db.query(
      `
        SELECT
          id,
          payment_order_id,
          status
        FROM payment_transactions
        WHERE provider_payment_id = $1
          AND transaction_type = 'PAYMENT'
        FOR UPDATE
      `,
      [paymentId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];

      if (
        row.payment_order_id !==
        paymentOrderId
      ) {
        throw new NonRetryableWebhookError(
          "The Razorpay payment is already linked to a different local order."
        );
      }

      /*
       * Never downgrade a captured payment because webhook
       * delivery order is not guaranteed.
       */
      const nextStatus =
        row.status === "CAPTURED"
          ? "CAPTURED"
          : status;

      await db.query(
        `
          UPDATE payment_transactions
          SET
            status = $1,
            amount_paise = $2,
            currency = $3,
            failure_code = $4,
            failure_description = $5,
            provider_payload = $6::jsonb
          WHERE id = $7
        `,
        [
          nextStatus,
          requirePositiveInteger(
            payment.amount,
            "payment.amount"
          ),
          normalizeCurrency(
            payment.currency
          ),
          payment.error_code || null,
          payment.error_description ||
            null,
          JSON.stringify(rawPayload),
          row.id,
        ]
      );

      return row.id;
    }

    const inserted = await db.query(
      `
        INSERT INTO payment_transactions (
          payment_order_id,
          provider_payment_id,
          provider_signature,
          transaction_type,
          status,
          amount_paise,
          currency,
          failure_code,
          failure_description,
          provider_payload
        )
        VALUES (
          $1,
          $2,
          NULL,
          'PAYMENT',
          $3,
          $4,
          $5,
          $6,
          $7,
          $8::jsonb
        )
        RETURNING id
      `,
      [
        paymentOrderId,
        paymentId,
        status,
        requirePositiveInteger(
          payment.amount,
          "payment.amount"
        ),
        normalizeCurrency(
          payment.currency
        ),
        payment.error_code || null,
        payment.error_description ||
          null,
        JSON.stringify(rawPayload),
      ]
    );

    return inserted.rows[0].id;
  };

const processPaymentCaptured =
  async (
    db: PoolClient,
    payload: RazorpayWebhookPayload,
    providerEventId: string
  ): Promise<ProcessingResult> => {
    const payment =
      getPaymentEntity(payload);

    const paymentId = requireString(
      payment.id,
      "payment.id"
    );

    const providerOrderId = requireString(
      payment.order_id,
      "payment.order_id"
    );

    const amountPaise =
      requirePositiveInteger(
        payment.amount,
        "payment.amount"
      );

    const currency = normalizeCurrency(
      payment.currency
    );

    if (
      payment.status !== "captured" &&
      payment.captured !== true
    ) {
      throw new NonRetryableWebhookError(
        "payment.captured webhook does not contain a captured payment."
      );
    }

    const orderResult = await db.query(
      `
        SELECT
          payment_order.id
            AS payment_order_id,
          payment_order.status
            AS payment_order_status,
          payment_order.amount_paise,
          payment_order.currency,

          application.id
            AS application_id,
          application.user_id,
          application.status
            AS application_status,

          selection.plan_id,
          selection.plan_code_snapshot,
          selection.plan_name_snapshot,
          selection.tier_code_snapshot,
          selection.price_paise_snapshot,
          selection.duration_days_snapshot,
          selection.plan_version_snapshot

        FROM payment_orders payment_order

        INNER JOIN registration_applications
          application
          ON application.id =
             payment_order.registration_application_id

        INNER JOIN registration_plan_selections
          selection
          ON selection.id =
             payment_order.plan_selection_id

        WHERE payment_order.provider_order_id =
              $1

        FOR UPDATE OF
          payment_order,
          application
      `,
      [providerOrderId]
    );

    /*
     * The Razorpay account may also receive payments that do
     * not belong to the registration subscription module.
     */
    if (orderResult.rows.length === 0) {
      return {
        status: "IGNORED",
        message:
          "Payment order does not belong to a registration subscription.",
      };
    }

    const order = orderResult.rows[0];

    if (
      Number(order.amount_paise) !==
      amountPaise
    ) {
      throw new NonRetryableWebhookError(
        "Captured payment amount does not match the local payment order."
      );
    }

    if (
      normalizeCurrency(order.currency) !==
      currency
    ) {
      throw new NonRetryableWebhookError(
        "Captured payment currency does not match the local payment order."
      );
    }

    const paymentTransactionId =
      await insertOrLockPaymentTransaction({
        db,
        paymentOrderId:
          order.payment_order_id,
        payment,
        rawPayload: payload,
        status: "CAPTURED",
      });

    await db.query(
      `
        UPDATE payment_orders
        SET
          status =
            CASE
              WHEN status IN (
                'CREATED',
                'PENDING',
                'FAILED'
              )
              THEN 'PAID'
              ELSE status
            END,
          paid_at = COALESCE(
            paid_at,
            NOW()
          ),
          failed_at = NULL,
          failure_reason = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [order.payment_order_id]
    );

    const applicationUpdate =
      await db.query(
        `
          UPDATE registration_applications
          SET
            status =
              CASE
                WHEN status IN (
                  'PLAN_SELECTED',
                  'PAYMENT_PENDING',
                  'PAYMENT_FAILED'
                )
                THEN 'PAID_PENDING_APPROVAL'

                WHEN status = 'REJECTED'
                THEN 'REFUND_PENDING'

                ELSE status
              END,
            paid_at = COALESCE(
              paid_at,
              NOW()
            ),
            updated_at = NOW()
          WHERE id = $1
          RETURNING status
        `,
        [order.application_id]
      );

    const applicationStatus =
      applicationUpdate.rows[0].status as string;

    const existingSubscription =
      await db.query(
        `
          SELECT
            id,
            status
          FROM subscriptions
          WHERE registration_application_id =
                $1
          FOR UPDATE
        `,
        [order.application_id]
      );

    let subscriptionId: string;
    let previousSubscriptionStatus:
      | string
      | null = null;

    const desiredSubscriptionStatus =
      applicationStatus ===
      "REFUND_PENDING"
        ? "REFUND_PENDING"
        : applicationStatus === "REFUNDED"
          ? "REFUNDED"
          : applicationStatus ===
              "APPROVED"
            ? null
            : "PAID_PENDING_APPROVAL";

    if (
      existingSubscription.rows.length ===
      0
    ) {
      if (!desiredSubscriptionStatus) {
        throw new NonRetryableWebhookError(
          "Approved application has no subscription record."
        );
      }

      const insertedSubscription =
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
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11
            )
            RETURNING id
          `,
          [
            order.user_id,
            order.application_id,
            order.plan_id,
            order.payment_order_id,
            desiredSubscriptionStatus,
            order.plan_code_snapshot,
            order.plan_name_snapshot,
            order.tier_code_snapshot,
            Number(
              order.price_paise_snapshot
            ),
            Number(
              order.duration_days_snapshot
            ),
            Number(
              order.plan_version_snapshot
            ),
          ]
        );

      subscriptionId =
        insertedSubscription.rows[0].id;
    } else {
      const subscription =
        existingSubscription.rows[0];

      subscriptionId = subscription.id;
      previousSubscriptionStatus =
        subscription.status;

      /*
       * Never regress ACTIVE, REFUNDED, SUSPENDED, or other
       * final/administrative states because webhook order is
       * not guaranteed.
       */
      if (
        desiredSubscriptionStatus &&
        [
          "PENDING_PAYMENT",
          "PAID_PENDING_APPROVAL",
          "REJECTED",
          "REFUND_PENDING",
        ].includes(subscription.status)
      ) {
        await db.query(
          `
            UPDATE subscriptions
            SET
              user_id = COALESCE(
                user_id,
                $1
              ),
              plan_id = $2,
              payment_order_id = $3,
              status = $4,
              plan_code_snapshot = $5,
              plan_name_snapshot = $6,
              tier_code_snapshot = $7,
              price_paise_snapshot = $8,
              duration_days_snapshot = $9,
              plan_version_snapshot = $10,
              updated_at = NOW()
            WHERE id = $11
          `,
          [
            order.user_id,
            order.plan_id,
            order.payment_order_id,
            desiredSubscriptionStatus,
            order.plan_code_snapshot,
            order.plan_name_snapshot,
            order.tier_code_snapshot,
            Number(
              order.price_paise_snapshot
            ),
            Number(
              order.duration_days_snapshot
            ),
            Number(
              order.plan_version_snapshot
            ),
            subscriptionId,
          ]
        );
      }
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
          $2,
          $3,
          $4,
          NULL,
          $5,
          $6::jsonb
        )
      `,
      [
        subscriptionId,
        applicationStatus ===
          "REFUND_PENDING"
          ? "LATE_PAYMENT_AFTER_REJECTION"
          : "PAYMENT_CAPTURED_WEBHOOK",
        previousSubscriptionStatus,
        desiredSubscriptionStatus ||
          previousSubscriptionStatus,
        applicationStatus ===
          "REFUND_PENDING"
          ? "Payment was captured after the registration had already been rejected"
          : "Razorpay confirmed that the registration payment was captured",
        JSON.stringify({
          providerEventId,
          applicationId:
            order.application_id,
          paymentOrderId:
            order.payment_order_id,
          paymentTransactionId,
          razorpayOrderId:
            providerOrderId,
          razorpayPaymentId: paymentId,
          amountPaise,
          currency,
        }),
      ]
    );

    return {
      status: "PROCESSED",
      message:
        applicationStatus ===
        "REFUND_PENDING"
          ? "Late captured payment recorded; registration requires refund reconciliation."
          : "Captured payment reconciled successfully.",
    };
  };

const processPaymentFailed =
  async (
    db: PoolClient,
    payload: RazorpayWebhookPayload
  ): Promise<ProcessingResult> => {
    const payment =
      getPaymentEntity(payload);

    const providerOrderId =
      requireString(
        payment.order_id,
        "payment.order_id"
      );

    const amountPaise =
      requirePositiveInteger(
        payment.amount,
        "payment.amount"
      );

    const currency = normalizeCurrency(
      payment.currency
    );

    const orderResult = await db.query(
      `
        SELECT
          payment_order.id
            AS payment_order_id,
          payment_order.status
            AS payment_order_status,
          payment_order.amount_paise,
          payment_order.currency,

          application.id
            AS application_id,
          application.status
            AS application_status

        FROM payment_orders payment_order

        INNER JOIN registration_applications
          application
          ON application.id =
             payment_order.registration_application_id

        WHERE payment_order.provider_order_id =
              $1

        FOR UPDATE OF
          payment_order,
          application
      `,
      [providerOrderId]
    );

    if (orderResult.rows.length === 0) {
      return {
        status: "IGNORED",
        message:
          "Failed payment does not belong to a registration subscription.",
      };
    }

    const order = orderResult.rows[0];

    if (
      Number(order.amount_paise) !==
      amountPaise ||
      normalizeCurrency(order.currency) !==
        currency
    ) {
      throw new NonRetryableWebhookError(
        "Failed payment amount or currency does not match the local order."
      );
    }

    await insertOrLockPaymentTransaction({
      db,
      paymentOrderId:
        order.payment_order_id,
      payment,
      rawPayload: payload,
      status: "FAILED",
    });

    /*
     * Do not regress a PAID or refunded order when a delayed
     * failed-attempt event arrives.
     */
    await db.query(
      `
        UPDATE payment_orders
        SET
          status =
            CASE
              WHEN status IN (
                'CREATED',
                'PENDING'
              )
              THEN 'FAILED'
              ELSE status
            END,
          failed_at =
            CASE
              WHEN status IN (
                'CREATED',
                'PENDING'
              )
              THEN COALESCE(
                failed_at,
                NOW()
              )
              ELSE failed_at
            END,
          failure_reason =
            CASE
              WHEN status IN (
                'CREATED',
                'PENDING'
              )
              THEN $1
              ELSE failure_reason
            END,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        payment.error_description ||
          payment.error_reason ||
          "Razorpay payment failed",
        order.payment_order_id,
      ]
    );

    await db.query(
      `
        UPDATE registration_applications
        SET
          status =
            CASE
              WHEN status =
                   'PAYMENT_PENDING'
              THEN 'PAYMENT_FAILED'
              ELSE status
            END,
          updated_at = NOW()
        WHERE id = $1
      `,
      [order.application_id]
    );

    return {
      status: "PROCESSED",
      message:
        "Failed payment attempt recorded without regressing any completed payment.",
    };
  };

const findPaymentOrderForRefund =
  async (
    db: PoolClient,
    refundId: string,
    paymentId: string,
    providerOrderId: string
  ): Promise<string | null> => {
    const result = await db.query(
      `
        SELECT payment_order_id
        FROM (
          SELECT
            transaction.payment_order_id,
            1 AS priority
          FROM payment_transactions
            transaction
          WHERE transaction.provider_refund_id =
                $1
            AND transaction.transaction_type =
                'REFUND'

          UNION ALL

          SELECT
            transaction.payment_order_id,
            2 AS priority
          FROM payment_transactions
            transaction
          WHERE transaction.provider_payment_id =
                $2
            AND transaction.transaction_type =
                'PAYMENT'

          UNION ALL

          SELECT
            payment_order.id,
            3 AS priority
          FROM payment_orders payment_order
          WHERE payment_order.provider_order_id =
                NULLIF($3, '')
        ) matches
        ORDER BY priority
        LIMIT 1
      `,
      [
        refundId,
        paymentId,
        providerOrderId,
      ]
    );

    return result.rows[0]
      ?.payment_order_id || null;
  };

const processRefundEvent =
  async (
    db: PoolClient,
    payload: RazorpayWebhookPayload,
    providerEventId: string,
    eventType: string
  ): Promise<ProcessingResult> => {
    const refund = getRefundEntity(payload);
    const payment =
      getPaymentEntity(payload);

    const refundId = requireString(
      refund.id,
      "refund.id"
    );

    const paymentId = requireString(
      refund.payment_id || payment.id,
      "refund.payment_id"
    );

    const providerOrderId =
      typeof payment.order_id === "string"
        ? payment.order_id.trim()
        : "";

    const amountPaise =
      requirePositiveInteger(
        refund.amount,
        "refund.amount"
      );

    const currency = normalizeCurrency(
      refund.currency
    );

    const paymentOrderId =
      await findPaymentOrderForRefund(
        db,
        refundId,
        paymentId,
        providerOrderId
      );

    if (!paymentOrderId) {
      return {
        status: "IGNORED",
        message:
          "Refund does not belong to a registration subscription.",
      };
    }

    const orderResult = await db.query(
      `
        SELECT
          payment_order.id
            AS payment_order_id,
          payment_order.status
            AS payment_order_status,
          payment_order.amount_paise,
          payment_order.currency,

          application.id
            AS application_id,
          application.status
            AS application_status

        FROM payment_orders payment_order

        INNER JOIN registration_applications
          application
          ON application.id =
             payment_order.registration_application_id

        WHERE payment_order.id = $1

        FOR UPDATE OF
          payment_order,
          application
      `,
      [paymentOrderId]
    );

    if (orderResult.rows.length === 0) {
      return {
        status: "IGNORED",
        message:
          "Refund payment order was not found.",
      };
    }

    const order = orderResult.rows[0];

    if (
      amountPaise >
      Number(order.amount_paise)
    ) {
      throw new NonRetryableWebhookError(
        "Refund amount exceeds the captured registration payment."
      );
    }

    if (
      normalizeCurrency(order.currency) !==
      currency
    ) {
      throw new NonRetryableWebhookError(
        "Refund currency does not match the local payment order."
      );
    }

    let transactionStatus:
      | "PENDING"
      | "PROCESSED"
      | "FAILED";

    if (
      eventType === "refund.processed" ||
      refund.status === "processed"
    ) {
      transactionStatus = "PROCESSED";
    } else if (
      eventType === "refund.failed" ||
      refund.status === "failed"
    ) {
      transactionStatus = "FAILED";
    } else {
      transactionStatus = "PENDING";
    }

    const existingRefund =
      await db.query(
        `
          SELECT
            id,
            payment_order_id,
            status
          FROM payment_transactions
          WHERE provider_refund_id = $1
            AND transaction_type = 'REFUND'
          FOR UPDATE
        `,
        [refundId]
      );

    let refundTransactionId: string;

    if (
      existingRefund.rows.length > 0
    ) {
      const row =
        existingRefund.rows[0];

      if (
        row.payment_order_id !==
        paymentOrderId
      ) {
        throw new NonRetryableWebhookError(
          "The Razorpay refund is already linked to a different local order."
        );
      }

      /*
       * Never downgrade a processed refund when an older
       * refund.created or refund.failed event arrives later.
       */
      if (row.status === "PROCESSED") {
        transactionStatus = "PROCESSED";
      }

      await db.query(
        `
          UPDATE payment_transactions
          SET
            provider_payment_id = $1,
            status = $2,
            amount_paise = $3,
            currency = $4,
            provider_payload = $5::jsonb
          WHERE id = $6
        `,
        [
          paymentId,
          transactionStatus,
          amountPaise,
          currency,
          JSON.stringify(payload),
          row.id,
        ]
      );

      refundTransactionId = row.id;
    } else {
      const insertedRefund =
        await db.query(
          `
            INSERT INTO payment_transactions (
              payment_order_id,
              provider_payment_id,
              provider_refund_id,
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
              NULL,
              'REFUND',
              $4,
              $5,
              $6,
              $7::jsonb
            )
            RETURNING id
          `,
          [
            paymentOrderId,
            paymentId,
            refundId,
            transactionStatus,
            amountPaise,
            currency,
            JSON.stringify(payload),
          ]
        );

      refundTransactionId =
        insertedRefund.rows[0].id;
    }

    const totals = await db.query(
      `
        SELECT
          COALESCE(
            SUM(amount_paise)
              FILTER (
                WHERE status =
                      'PROCESSED'
              ),
            0
          )::bigint AS processed_total
        FROM payment_transactions
        WHERE payment_order_id = $1
          AND transaction_type = 'REFUND'
      `,
      [paymentOrderId]
    );

    const processedTotal = Number(
      totals.rows[0].processed_total
    );

    let paymentOrderStatus:
      | "REFUND_PENDING"
      | "PARTIALLY_REFUNDED"
      | "REFUNDED";

    if (
      order.payment_order_status ===
        "REFUNDED" ||
      processedTotal >=
        Number(order.amount_paise)
    ) {
      paymentOrderStatus = "REFUNDED";
    } else if (processedTotal > 0) {
      paymentOrderStatus =
        "PARTIALLY_REFUNDED";
    } else {
      paymentOrderStatus =
        "REFUND_PENDING";
    }

    await db.query(
      `
        UPDATE payment_orders
        SET
          status = $1,
          refunded_at =
            CASE
              WHEN $1 = 'REFUNDED'
              THEN COALESCE(
                refunded_at,
                NOW()
              )
              ELSE refunded_at
            END,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        paymentOrderStatus,
        paymentOrderId,
      ]
    );

    /*
     * This webhook is for registration refunds. Do not
     * silently cancel an already approved account. A
     * post-approval refund must be reviewed separately.
     */
    const canChangeRegistration =
      order.application_status !==
      "APPROVED";

    let applicationStatus =
      order.application_status as string;

    if (canChangeRegistration) {
      applicationStatus =
        paymentOrderStatus === "REFUNDED"
          ? "REFUNDED"
          : "REFUND_PENDING";

      await db.query(
        `
          UPDATE registration_applications
          SET
            status = $1,
            registration_token_hash =
              CASE
                WHEN $1 IN (
                  'REFUND_PENDING',
                  'REFUNDED'
                )
                THEN NULL
                ELSE registration_token_hash
              END,
            registration_token_expires_at =
              CASE
                WHEN $1 IN (
                  'REFUND_PENDING',
                  'REFUNDED'
                )
                THEN NULL
                ELSE registration_token_expires_at
              END,
            updated_at = NOW()
          WHERE id = $2
        `,
        [
          applicationStatus,
          order.application_id,
        ]
      );
    }

    const subscriptionResult =
      await db.query(
        `
          SELECT
            id,
            status
          FROM subscriptions
          WHERE registration_application_id =
                $1
          FOR UPDATE
        `,
        [order.application_id]
      );

    if (
      subscriptionResult.rows.length >
      0
    ) {
      const subscription =
        subscriptionResult.rows[0];

      let nextSubscriptionStatus =
        subscription.status as string;

      if (
        subscription.status !==
          "ACTIVE" &&
        subscription.status !==
          "SUSPENDED" &&
        subscription.status !==
          "CANCELLED" &&
        subscription.status !==
          "EXPIRED"
      ) {
        nextSubscriptionStatus =
          paymentOrderStatus ===
          "REFUNDED"
            ? "REFUNDED"
            : "REFUND_PENDING";

        await db.query(
          `
            UPDATE subscriptions
            SET
              status = $1,
              updated_at = NOW()
            WHERE id = $2
          `,
          [
            nextSubscriptionStatus,
            subscription.id,
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
            $2,
            $3,
            $4,
            NULL,
            $5,
            $6::jsonb
          )
        `,
        [
          subscription.id,
          eventType ===
            "refund.processed"
            ? "REFUND_PROCESSED_WEBHOOK"
            : eventType ===
                "refund.failed"
              ? "REFUND_FAILED_WEBHOOK"
              : "REFUND_CREATED_WEBHOOK",
          subscription.status,
          nextSubscriptionStatus,
          eventType ===
            "refund.processed"
            ? "Razorpay confirmed that the refund was processed"
            : eventType ===
                "refund.failed"
              ? "Razorpay reported that the refund failed"
              : "Razorpay confirmed that the refund was created",
          JSON.stringify({
            providerEventId,
            applicationId:
              order.application_id,
            paymentOrderId,
            refundTransactionId,
            razorpayPaymentId: paymentId,
            razorpayRefundId: refundId,
            providerRefundStatus:
              refund.status || null,
            transactionStatus,
            refundAmountPaise:
              amountPaise,
            processedRefundTotalPaise:
              processedTotal,
            orderAmountPaise: Number(
              order.amount_paise
            ),
            currency,
            registrationStatus:
              applicationStatus,
            paymentOrderStatus,
            postApprovalReviewRequired:
              !canChangeRegistration,
          }),
        ]
      );
    }

    return {
      status: "PROCESSED",
      message:
        paymentOrderStatus === "REFUNDED"
          ? "Refund finalized successfully."
          : transactionStatus === "FAILED"
            ? "Refund failure recorded; registration remains pending refund reconciliation."
            : "Refund update recorded.",
    };
  };

const processWebhookEvent =
  async (
    db: PoolClient,
    eventType: string,
    payload: RazorpayWebhookPayload,
    providerEventId: string
  ): Promise<ProcessingResult> => {
    switch (eventType) {
      case "payment.captured":
        return processPaymentCaptured(
          db,
          payload,
          providerEventId
        );

      case "payment.failed":
        return processPaymentFailed(
          db,
          payload
        );

      case "refund.created":
      case "refund.processed":
      case "refund.failed":
        return processRefundEvent(
          db,
          payload,
          providerEventId,
          eventType
        );

      default:
        return {
          status: "IGNORED",
          message:
            `Webhook event ${eventType} is not used by the registration subscription flow.`,
        };
    }
  };

/**
 * POST /api/payments/razorpay/webhook
 *
 * This route must receive express.raw({ type:
 * "application/json" }) before the application's global
 * express.json() middleware.
 */
export const handleRazorpayWebhook =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      res.status(500).json({
        success: false,
        message:
          "Razorpay webhook route is not configured with raw body middleware.",
      });
      return;
    }

    const secrets = getWebhookSecrets();

    if (secrets.length === 0) {
      res.status(500).json({
        success: false,
        message:
          "RAZORPAY_WEBHOOK_SECRET is not configured.",
      });
      return;
    }

    const signature = getHeader(
      req,
      "x-razorpay-signature"
    );

    if (
      !isValidSignature(
        rawBody,
        signature,
        secrets
      )
    ) {
      res.status(401).json({
        success: false,
        message:
          "Invalid Razorpay webhook signature.",
      });
      return;
    }

    const providerEventId = getHeader(
      req,
      "x-razorpay-event-id"
    );

    if (!providerEventId) {
      res.status(400).json({
        success: false,
        message:
          "x-razorpay-event-id header is required.",
      });
      return;
    }

    let payload: RazorpayWebhookPayload;

    try {
      payload = JSON.parse(
        rawBody.toString("utf8")
      ) as RazorpayWebhookPayload;
    } catch {
      res.status(400).json({
        success: false,
        message:
          "Webhook body is not valid JSON.",
      });
      return;
    }

    let eventType: string;

    try {
      eventType = requireString(
        payload.event,
        "event"
      );
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Webhook event type is required.",
      });
      return;
    }

    /*
     * Insert the event before processing. Duplicate deliveries
     * collide on provider_event_id and then serialize on the
     * row lock below.
     */
    try {
      await pool.query(
        `
          INSERT INTO razorpay_webhook_events (
            provider_event_id,
            event_type,
            signature,
            payload,
            processing_status,
            attempt_count,
            last_attempt_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4::jsonb,
            'RECEIVED',
            0,
            NULL
          )
          ON CONFLICT (
            provider_event_id
          )
          WHERE provider_event_id
                IS NOT NULL
          DO NOTHING
        `,
        [
          providerEventId,
          eventType,
          signature,
          JSON.stringify(payload),
        ]
      );
    } catch (error) {
      console.error(
        "STORE RAZORPAY WEBHOOK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to store Razorpay webhook.",
      });
      return;
    }

    const db = await pool.connect();
    let transactionOpen = false;

    try {
      await db.query("BEGIN");
      transactionOpen = true;

      const eventResult = await db.query(
        `
          SELECT
            id,
            processing_status
          FROM razorpay_webhook_events
          WHERE provider_event_id = $1
          FOR UPDATE
        `,
        [providerEventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error(
          "Stored Razorpay webhook event was not found."
        );
      }

      const eventRecord =
        eventResult.rows[0];

      if (
        eventRecord.processing_status ===
          "PROCESSED" ||
        eventRecord.processing_status ===
          "IGNORED"
      ) {
        await db.query("COMMIT");
        transactionOpen = false;

        res.status(200).json({
          success: true,
          received: true,
          duplicate: true,
          processingStatus:
            eventRecord.processing_status,
        });
        return;
      }

      await db.query(
        `
          UPDATE razorpay_webhook_events
          SET
            processing_status =
              'RECEIVED',
            error_message = NULL,
            attempt_count =
              attempt_count + 1,
            last_attempt_at = NOW()
          WHERE id = $1
        `,
        [eventRecord.id]
      );

      const processingResult =
        await processWebhookEvent(
          db,
          eventType,
          payload,
          providerEventId
        );

      await db.query(
        `
          UPDATE razorpay_webhook_events
          SET
            processing_status = $1,
            error_message = NULL,
            processed_at = NOW()
          WHERE id = $2
        `,
        [
          processingResult.status,
          eventRecord.id,
        ]
      );

      await db.query("COMMIT");
      transactionOpen = false;

      res.status(200).json({
        success: true,
        received: true,
        eventId: providerEventId,
        eventType,
        processingStatus:
          processingResult.status,
        message:
          processingResult.message,
      });
    } catch (error) {
      if (transactionOpen) {
        try {
          await db.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "RAZORPAY WEBHOOK ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unknown webhook error";

      try {
        await pool.query(
          `
            UPDATE razorpay_webhook_events
            SET
              processing_status =
                'FAILED',
              error_message = $1,
              processed_at = NOW()
            WHERE provider_event_id = $2
          `,
          [
            message.slice(0, 5000),
            providerEventId,
          ]
        );
      } catch (statusError) {
        console.error(
          "UPDATE FAILED WEBHOOK STATUS ERROR:",
          statusError
        );
      }

      console.error(
        "PROCESS RAZORPAY WEBHOOK ERROR:",
        error
      );

      if (
        error instanceof
        NonRetryableWebhookError
      ) {
        /*
         * Signature is valid, but the provider payload cannot
         * safely be applied to local state. Acknowledge it to
         * avoid an endless retry loop while preserving FAILED
         * status for Admin reconciliation.
         */
        res.status(200).json({
          success: false,
          received: true,
          retryable: false,
          processingStatus: "FAILED",
          message,
        });
        return;
      }

      /*
       * Transient database/server errors return non-2xx so
       * Razorpay can retry the same event. Duplicate handling
       * makes those retries safe.
       */
      res.status(500).json({
        success: false,
        received: true,
        retryable: true,
        processingStatus: "FAILED",
        message:
          "Temporary webhook processing failure.",
      });
    } finally {
      db.release();
    }
  };
