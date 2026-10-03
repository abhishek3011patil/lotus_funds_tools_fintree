ALTER TABLE ra_audience_group_members
  ADD COLUMN IF NOT EXISTS telegram_participant_id uuid REFERENCES telegram_users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS whatsapp_participant_id uuid REFERENCES whatsapp_participants(id) ON DELETE CASCADE;

ALTER TABLE ra_audience_group_members
  DROP CONSTRAINT IF EXISTS ra_audience_group_members_member_type_check,
  DROP CONSTRAINT IF EXISTS ra_audience_group_member_target_check;

ALTER TABLE ra_audience_group_members
  ADD CONSTRAINT ra_audience_group_members_member_type_check
    CHECK (member_type IN ('CLIENT', 'BROKER', 'TELEGRAM', 'WHATSAPP')),
  ADD CONSTRAINT ra_audience_group_member_target_check CHECK (
    (member_type = 'CLIENT' AND client_user_id IS NOT NULL AND broker_id IS NULL
      AND telegram_participant_id IS NULL AND whatsapp_participant_id IS NULL)
    OR
    (member_type = 'BROKER' AND broker_id IS NOT NULL AND client_user_id IS NULL
      AND telegram_participant_id IS NULL AND whatsapp_participant_id IS NULL)
    OR
    (member_type = 'TELEGRAM' AND telegram_participant_id IS NOT NULL AND client_user_id IS NULL
      AND broker_id IS NULL AND whatsapp_participant_id IS NULL)
    OR
    (member_type = 'WHATSAPP' AND whatsapp_participant_id IS NOT NULL AND client_user_id IS NULL
      AND broker_id IS NULL AND telegram_participant_id IS NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS ra_audience_group_telegram_member_idx
  ON ra_audience_group_members (group_id, telegram_participant_id)
  WHERE telegram_participant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ra_audience_group_whatsapp_member_idx
  ON ra_audience_group_members (group_id, whatsapp_participant_id)
  WHERE whatsapp_participant_id IS NOT NULL;
