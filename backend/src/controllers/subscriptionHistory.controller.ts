import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";

export const getMySubscriptionHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
    return;
  }

  try {
    const [paymentResult, eventResult] =
      await Promise.all([
        pool.query(
          `
            SELECT
              payment_order.id,
              payment_order.provider,
              payment_order.provider_order_id,
              payment_order.status,
              payment_order.amount_paise,
              TRIM(payment_order.currency) AS currency,
              COALESCE(
                payment_order.notes ->> 'purpose',
                'REGISTRATION_SUBSCRIPTION'
              ) AS purpose,
              payment_order.notes ->> 'planName' AS plan_name,
              payment_order.paid_at,
              payment_order.created_at,
              transaction.provider_payment_id,
              transaction.status AS transaction_status,
              transaction.created_at AS transaction_created_at
            FROM payment_orders payment_order
            LEFT JOIN LATERAL (
              SELECT
                payment_transaction.provider_payment_id,
                payment_transaction.status,
                payment_transaction.created_at
              FROM payment_transactions payment_transaction
              WHERE payment_transaction.payment_order_id =
                    payment_order.id
                AND payment_transaction.transaction_type = 'PAYMENT'
              ORDER BY payment_transaction.created_at DESC
              LIMIT 1
            ) transaction ON true
            WHERE payment_order.user_id = $1
            ORDER BY
              COALESCE(
                payment_order.paid_at,
                payment_order.created_at
              ) DESC
            LIMIT 100
          `,
          [userId]
        ),
        pool.query(
          `
            SELECT
              subscription_event.id,
              subscription_event.subscription_id,
              subscription_event.event_type,
              subscription_event.previous_status,
              subscription_event.new_status,
              subscription_event.reason,
              subscription_event.metadata,
              subscription_event.created_at
            FROM subscription_events subscription_event
            INNER JOIN subscriptions subscription
              ON subscription.id =
                 subscription_event.subscription_id
            WHERE subscription.user_id = $1
            ORDER BY subscription_event.created_at DESC
            LIMIT 100
          `,
          [userId]
        ),
      ]);

    res.status(200).json({
      success: true,
      payments: paymentResult.rows.map(
        (payment) => ({
          id: payment.id,
          provider: payment.provider,
          providerOrderId:
            payment.provider_order_id,
          providerPaymentId:
            payment.provider_payment_id,
          status:
            payment.transaction_status ||
            payment.status,
          orderStatus: payment.status,
          amount:
            Number(payment.amount_paise) /
            100,
          currency: payment.currency,
          purpose: payment.purpose,
          planName: payment.plan_name,
          paidAt:
            payment.paid_at ||
            payment.transaction_created_at,
          createdAt: payment.created_at,
        })
      ),
      events: eventResult.rows.map(
        (event) => ({
          id: event.id,
          subscriptionId:
            event.subscription_id,
          type: event.event_type,
          previousStatus:
            event.previous_status,
          newStatus: event.new_status,
          reason: event.reason,
          metadata: event.metadata || {},
          createdAt: event.created_at,
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET SUBSCRIPTION HISTORY ERROR:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Unable to load subscription history.",
    });
  }
};
