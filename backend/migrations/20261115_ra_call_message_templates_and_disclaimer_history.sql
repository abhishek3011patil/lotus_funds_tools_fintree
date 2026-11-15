CREATE TABLE IF NOT EXISTS ra_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type varchar(16) NOT NULL CHECK (message_type IN ('NEW_CALL', 'ERRATA')),
  template_version integer NOT NULL DEFAULT 1,
  template_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ra_user_id, message_type)
);

CREATE INDEX IF NOT EXISTS ra_message_templates_owner_idx
  ON ra_message_templates (ra_user_id, message_type);

CREATE TABLE IF NOT EXISTS disclaimer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disclaimer_text text NOT NULL,
  version_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ra_user_id, version_number)
);

CREATE INDEX IF NOT EXISTS disclaimer_history_owner_idx
  ON disclaimer_history (ra_user_id, version_number DESC);
