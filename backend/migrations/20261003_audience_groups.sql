CREATE TABLE IF NOT EXISTS ra_audience_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  description varchar(240),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ra_audience_groups_owner_name_idx
  ON ra_audience_groups (ra_user_id, lower(name));

CREATE INDEX IF NOT EXISTS ra_audience_groups_owner_idx
  ON ra_audience_groups (ra_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ra_audience_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES ra_audience_groups(id) ON DELETE CASCADE,
  member_type varchar(16) NOT NULL CHECK (member_type IN ('CLIENT', 'BROKER')),
  client_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  broker_id uuid REFERENCES broker_details(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ra_audience_group_member_target_check CHECK (
    (member_type = 'CLIENT' AND client_user_id IS NOT NULL AND broker_id IS NULL)
    OR
    (member_type = 'BROKER' AND broker_id IS NOT NULL AND client_user_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ra_audience_group_client_member_idx
  ON ra_audience_group_members (group_id, client_user_id)
  WHERE client_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ra_audience_group_broker_member_idx
  ON ra_audience_group_members (group_id, broker_id)
  WHERE broker_id IS NOT NULL;

ALTER TABLE research_calls
  ADD COLUMN IF NOT EXISTS audience_mode varchar(24) NOT NULL DEFAULT 'ALL_CONNECTED',
  ADD COLUMN IF NOT EXISTS audience_groups_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_recipient_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'research_calls_audience_mode_check'
  ) THEN
    ALTER TABLE research_calls
      ADD CONSTRAINT research_calls_audience_mode_check
      CHECK (audience_mode IN ('ALL_CONNECTED', 'GROUPS'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS research_calls_audience_recipients_gin_idx
  ON research_calls USING gin (audience_recipient_snapshot jsonb_path_ops);
