import type { Request, Response } from "express";
import { pool } from "../db";

const summarySql = `
  SELECT
    (SELECT COUNT(*)::int FROM payment_orders) AS "paymentOrders",
    (SELECT COUNT(*)::int FROM payment_orders WHERE status = 'PAID') AS "paidOrders",
    (
      (SELECT COUNT(*) FROM subscriptions) +
      (SELECT COUNT(*) FROM client_ra_subscriptions) +
      (SELECT COUNT(*) FROM client_broker_subscriptions)
    )::int AS "subscriptions",
    (
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE') +
      (SELECT COUNT(*) FROM client_ra_subscriptions WHERE status = 'ACTIVE') +
      (SELECT COUNT(*) FROM client_broker_subscriptions WHERE status = 'ACTIVE')
    )::int AS "activeSubscriptions"
`;

const paymentFromSql = `
  FROM payment_orders payment
  LEFT JOIN users account ON account.id = payment.user_id
  LEFT JOIN registration_applications registration
    ON registration.id = payment.registration_application_id
  LEFT JOIN registration_plan_selections selection
    ON selection.id = payment.plan_selection_id
  LEFT JOIN LATERAL (
    SELECT plan_name_snapshot
    FROM subscriptions
    WHERE payment_order_id = payment.id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  ) linked_plan ON true
  LEFT JOIN LATERAL (
    SELECT status, transaction_type, provider_payment_id
    FROM payment_transactions
    WHERE payment_order_id = payment.id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  ) latest_transaction ON true
  WHERE (
    $1::text = '' OR
    account.name ILIKE $2 OR
    account.email ILIKE $2 OR
    registration.email ILIKE $2 OR
    payment.id::text ILIKE $2 OR
    payment.provider_order_id ILIKE $2 OR
    selection.plan_name_snapshot ILIKE $2 OR
    linked_plan.plan_name_snapshot ILIKE $2
  )
`;

const paymentSelectSql = `
  SELECT
    payment.id,
    payment.provider_order_id AS "providerOrderId",
    payment.status AS "orderStatus",
    payment.amount_paise AS "amountPaise",
    BTRIM(payment.currency) AS currency,
    payment.created_at AS "createdAt",
    payment.paid_at AS "paidAt",
    COALESCE(
      NULLIF(BTRIM(account.name), ''),
      NULLIF(BTRIM(registration.email), ''),
      NULLIF(BTRIM(account.email), ''),
      'Account unavailable'
    ) AS "accountName",
    COALESCE(account.email, registration.email) AS "accountEmail",
    COALESCE(registration.applicant_type, account.role) AS "accountType",
    COALESCE(selection.plan_name_snapshot, linked_plan.plan_name_snapshot) AS "planName",
    latest_transaction.status AS "transactionStatus",
    latest_transaction.transaction_type AS "transactionType",
    latest_transaction.provider_payment_id AS "providerPaymentId"
  ${paymentFromSql}
  ORDER BY payment.created_at DESC, payment.id DESC
  LIMIT $3 OFFSET $4
`;

const subscriptionUnionSql = `
  SELECT
    subscription.id,
    'PLATFORM'::text AS source,
    COALESCE(NULLIF(BTRIM(account.name), ''), account.email, 'Account unavailable') AS account_name,
    account.email AS account_email,
    account.role AS account_type,
    COALESCE(subscription.plan_name_snapshot, plan.display_name, 'Plan unavailable') AS plan_name,
    subscription.status,
    subscription.price_paise_snapshot AS amount_paise,
    BTRIM(COALESCE(payment.currency, plan.currency, 'INR')) AS currency,
    subscription.starts_at,
    subscription.expires_at,
    subscription.created_at,
    subscription.payment_order_id,
    payment.status AS payment_status
  FROM subscriptions subscription
  LEFT JOIN users account ON account.id = subscription.user_id
  LEFT JOIN subscription_plans plan ON plan.id = subscription.plan_id
  LEFT JOIN payment_orders payment ON payment.id = subscription.payment_order_id

  UNION ALL

  SELECT
    subscription.id,
    'ANALYST'::text AS source,
    COALESCE(NULLIF(BTRIM(client.name), ''), client.email, 'Account unavailable') AS account_name,
    client.email AS account_email,
    client.role AS account_type,
    'Analyst: ' || COALESCE(NULLIF(BTRIM(analyst.name), ''), analyst.email, 'Unavailable') AS plan_name,
    subscription.status,
    subscription.amount_paise,
    BTRIM(subscription.currency) AS currency,
    subscription.starts_at,
    subscription.expires_at,
    subscription.created_at,
    subscription.latest_payment_order_id AS payment_order_id,
    payment.status AS payment_status
  FROM client_ra_subscriptions subscription
  LEFT JOIN users client ON client.id = subscription.client_user_id
  LEFT JOIN users analyst ON analyst.id = subscription.ra_user_id
  LEFT JOIN payment_orders payment ON payment.id = subscription.latest_payment_order_id

  UNION ALL

  SELECT
    subscription.id,
    'BROKER'::text AS source,
    COALESCE(NULLIF(BTRIM(client.name), ''), client.email, 'Account unavailable') AS account_name,
    client.email AS account_email,
    client.role AS account_type,
    'Broker: ' || COALESCE(
      NULLIF(BTRIM(broker.trade_name), ''),
      NULLIF(BTRIM(broker.legal_name), ''),
      'Unavailable'
    ) AS plan_name,
    subscription.status,
    subscription.amount_paise,
    BTRIM(subscription.currency) AS currency,
    subscription.starts_at,
    subscription.expires_at,
    subscription.created_at,
    subscription.latest_payment_order_id AS payment_order_id,
    payment.status AS payment_status
  FROM client_broker_subscriptions subscription
  LEFT JOIN users client ON client.id = subscription.client_user_id
  LEFT JOIN broker_details broker ON broker.id = subscription.broker_id
  LEFT JOIN payment_orders payment ON payment.id = subscription.latest_payment_order_id
`;

const subscriptionFromSql = `
  FROM (${subscriptionUnionSql}) record
  WHERE (
    $1::text = '' OR
    record.account_name ILIKE $2 OR
    record.account_email ILIKE $2 OR
    record.plan_name ILIKE $2 OR
    record.id::text ILIKE $2
  )
`;

const subscriptionSelectSql = `
  SELECT
    record.id,
    record.source,
    record.account_name AS "accountName",
    record.account_email AS "accountEmail",
    record.account_type AS "accountType",
    record.plan_name AS "planName",
    record.status,
    record.amount_paise AS "amountPaise",
    record.currency,
    record.starts_at AS "startsAt",
    record.expires_at AS "expiresAt",
    record.created_at AS "createdAt",
    record.payment_order_id AS "paymentOrderId",
    record.payment_status AS "paymentStatus"
  ${subscriptionFromSql}
  ORDER BY record.created_at DESC, record.id DESC
  LIMIT $3 OFFSET $4
`;

export const getAdminBillingRecords = async (req: Request, res: Response) => {
  const view = req.query.view === "subscriptions" ? "subscriptions" : "payments";
  const requestedPage = Number(req.query.page);
  const requestedLimit = Number(req.query.limit);
  const page = Number.isInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 10000)
    : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 50)
    : 20;
  const search = typeof req.query.search === "string"
    ? req.query.search.trim().slice(0, 100)
    : "";
  const searchValues = [search, `%${search}%`];
  const fromSql = view === "subscriptions" ? subscriptionFromSql : paymentFromSql;
  const selectSql = view === "subscriptions" ? subscriptionSelectSql : paymentSelectSql;

  try {
    const [summaryResult, countResult, recordsResult] = await Promise.all([
      pool.query(summarySql),
      pool.query(`SELECT COUNT(*)::int AS total ${fromSql}`, searchValues),
      pool.query(selectSql, [...searchValues, limit, (page - 1) * limit]),
    ]);

    return res.json({
      success: true,
      view,
      page,
      limit,
      total: countResult.rows[0].total,
      summary: summaryResult.rows[0],
      records: recordsResult.rows,
    });
  } catch (error) {
    console.error("Admin billing review error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load billing records",
    });
  }
};
