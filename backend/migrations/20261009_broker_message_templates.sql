CREATE TABLE IF NOT EXISTS broker_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type varchar(16) NOT NULL CHECK (message_type IN ('NEW_CALL', 'ERRATA')),
  template_version integer NOT NULL DEFAULT 1,
  template_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_user_id, message_type)
);

CREATE INDEX IF NOT EXISTS broker_message_templates_owner_idx
  ON broker_message_templates(broker_user_id, message_type);
