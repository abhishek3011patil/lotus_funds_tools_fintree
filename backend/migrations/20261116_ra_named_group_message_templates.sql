CREATE TABLE IF NOT EXISTS ra_named_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type varchar(16) NOT NULL CHECK (message_type IN ('NEW_CALL', 'ERRATA')),
  name varchar(100) NOT NULL,
  template_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ra_named_message_templates_name_idx
  ON ra_named_message_templates (ra_user_id, message_type, lower(name));

CREATE TABLE IF NOT EXISTS ra_named_message_template_groups (
  template_id uuid NOT NULL REFERENCES ra_named_message_templates(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES ra_audience_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, group_id)
);

CREATE INDEX IF NOT EXISTS ra_named_message_template_groups_group_idx
  ON ra_named_message_template_groups (group_id, template_id);
