CREATE TABLE IF NOT EXISTS client_broker_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES broker_details(id) ON DELETE CASCADE,
  latest_payment_order_id uuid REFERENCES payment_orders(id) ON DELETE SET NULL,
  status varchar(32) NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'CANCELLED', 'EXPIRED')),
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  starts_at timestamptz,
  expires_at timestamptz,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_user_id, broker_id)
);

CREATE INDEX IF NOT EXISTS client_broker_subscriptions_client_status_idx
  ON client_broker_subscriptions(client_user_id, status, expires_at);

