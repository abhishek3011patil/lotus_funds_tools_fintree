CREATE TABLE IF NOT EXISTS broker_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES broker_details(id) ON DELETE CASCADE,
  client_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  source varchar(16) NOT NULL DEFAULT 'MANUAL'
    CHECK (source IN ('PORTAL', 'MANUAL')),
  name varchar(160) NOT NULL,
  email varchar(255),
  phone_number varchar(20) NOT NULL,
  aadhaar_last4 char(4),
  aadhaar_hash char(64),
  pan_last4 varchar(4),
  pan_hash char(64),
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_id, client_user_id)
);

CREATE INDEX IF NOT EXISTS broker_clients_broker_status_idx
  ON broker_clients(broker_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS broker_clients_broker_phone_active_idx
  ON broker_clients(broker_id, phone_number)
  WHERE status = 'ACTIVE' AND phone_number <> '';

ALTER TABLE whatsapp_participants
  ADD COLUMN IF NOT EXISTS broker_client_id uuid
  REFERENCES broker_clients(id) ON DELETE SET NULL;

ALTER TABLE telegram_users
  ADD COLUMN IF NOT EXISTS broker_client_id uuid
  REFERENCES broker_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS whatsapp_participants_broker_client_idx
  ON whatsapp_participants(ra_user_id, broker_client_id)
  WHERE broker_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS telegram_users_broker_client_idx
  ON telegram_users(user_id, broker_client_id)
  WHERE broker_client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS broker_call_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES broker_details(id) ON DELETE CASCADE,
  research_call_id uuid NOT NULL REFERENCES research_calls(id) ON DELETE CASCADE,
  root_call_id uuid NOT NULL REFERENCES research_calls(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'STOPPED')),
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_id, root_call_id)
);

CREATE INDEX IF NOT EXISTS broker_call_publications_root_idx
  ON broker_call_publications(root_call_id, status);

CREATE TABLE IF NOT EXISTS broker_call_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES broker_details(id) ON DELETE CASCADE,
  broker_client_id uuid NOT NULL REFERENCES broker_clients(id) ON DELETE CASCADE,
  research_call_id uuid NOT NULL REFERENCES research_calls(id) ON DELETE CASCADE,
  root_call_id uuid NOT NULL REFERENCES research_calls(id) ON DELETE CASCADE,
  event_type varchar(40) NOT NULL
    CHECK (event_type IN ('RESEARCH_CALL_PUBLISHED', 'RESEARCH_CALL_ERRATA', 'RESEARCH_CALL_EXITED')),
  channel varchar(16) NOT NULL CHECK (channel IN ('WHATSAPP', 'TELEGRAM')),
  message_text text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
  provider_message_id varchar(255),
  error_message text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_client_id, research_call_id, event_type, channel)
);

CREATE INDEX IF NOT EXISTS broker_call_deliveries_broker_client_idx
  ON broker_call_deliveries(broker_id, broker_client_id, queued_at DESC);

ALTER TABLE whatsapp_message_jobs
  ADD COLUMN IF NOT EXISTS broker_delivery_id uuid
  REFERENCES broker_call_deliveries(id) ON DELETE SET NULL;
