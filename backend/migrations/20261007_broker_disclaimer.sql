ALTER TABLE broker_details
  ADD COLUMN IF NOT EXISTS disclaimer_template text,
  ADD COLUMN IF NOT EXISTS disclaimer_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS broker_disclaimer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disclaimer_template text NOT NULL,
  version_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_user_id, version_number)
);

CREATE INDEX IF NOT EXISTS broker_disclaimer_history_owner_idx
  ON broker_disclaimer_history(broker_user_id, version_number DESC);
