-- Keep an immutable snapshot each time an RA saves a default or group template.
CREATE TABLE IF NOT EXISTS ra_message_template_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type varchar(16) NOT NULL CHECK (message_type IN ('NEW_CALL', 'ERRATA')),
  version_number integer NOT NULL,
  destination varchar(8) NOT NULL CHECK (destination IN ('DEFAULT', 'GROUP')),
  source_template_id uuid,
  template_name varchar(100),
  group_id uuid REFERENCES ra_audience_groups(id) ON DELETE SET NULL,
  group_name varchar(80),
  participants_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  template_data jsonb NOT NULL,
  imported_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ra_user_id, message_type, version_number)
);

CREATE INDEX IF NOT EXISTS ra_message_template_history_owner_idx
  ON ra_message_template_history (ra_user_id, message_type, version_number DESC);

-- The migration runner replays SQL files. An existing history row means that
-- template was already imported or saved by the new code.
WITH current_templates AS (
  SELECT t.ra_user_id, t.message_type, 'DEFAULT'::varchar(8) AS destination,
         NULL::uuid AS source_template_id, NULL::varchar(100) AS template_name,
         NULL::uuid AS group_id, NULL::varchar(80) AS group_name,
         '[]'::jsonb AS participants_snapshot, t.template_data, t.updated_at
  FROM ra_message_templates t
  WHERE NOT EXISTS (
    SELECT 1 FROM ra_message_template_history h
    WHERE h.destination = 'DEFAULT' AND h.ra_user_id = t.ra_user_id
      AND h.message_type = t.message_type
  )
  UNION ALL
  SELECT t.ra_user_id, t.message_type, 'GROUP'::varchar(8), t.id, t.name,
         g.id, g.name,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
           'type', m.member_type,
           'name', CASE m.member_type
             WHEN 'CLIENT' THEN COALESCE(NULLIF(TRIM(client.name), ''), client.email, 'Client')
             WHEN 'BROKER' THEN COALESCE(NULLIF(TRIM(broker.trade_name), ''), broker.legal_name, 'Broker')
             WHEN 'TELEGRAM' THEN COALESCE(NULLIF(TRIM(telegram.telegram_client_name), ''), 'Telegram ' || telegram.telegram_user_id::text)
             ELSE COALESCE(NULLIF(TRIM(whatsapp.participant_name), ''), whatsapp.phone_number, 'WhatsApp participant') END,
           'detail', CASE m.member_type
             WHEN 'CLIENT' THEN client.email
             WHEN 'BROKER' THEN broker.sebi_registration_no
             WHEN 'TELEGRAM' THEN telegram.telegram_user_id::text
             ELSE whatsapp.phone_number END
         ) ORDER BY m.member_type, m.created_at)
         FROM ra_audience_group_members m
         LEFT JOIN users client ON client.id = m.client_user_id
         LEFT JOIN broker_details broker ON broker.id = m.broker_id
         LEFT JOIN telegram_users telegram ON telegram.id = m.telegram_participant_id
         LEFT JOIN whatsapp_participants whatsapp ON whatsapp.id = m.whatsapp_participant_id
         WHERE m.group_id = g.id), '[]'::jsonb),
         t.template_data, t.updated_at
  FROM ra_named_message_templates t
  LEFT JOIN ra_named_message_template_groups assignment ON assignment.template_id = t.id
  LEFT JOIN ra_audience_groups g ON g.id = assignment.group_id
  WHERE NOT EXISTS (
    SELECT 1 FROM ra_message_template_history h
    WHERE h.destination = 'GROUP' AND h.source_template_id = t.id
  )
), numbered AS (
  SELECT current_templates.*,
         COALESCE((SELECT MAX(h.version_number) FROM ra_message_template_history h
                   WHERE h.ra_user_id = current_templates.ra_user_id
                     AND h.message_type = current_templates.message_type), 0)
         + ROW_NUMBER() OVER (PARTITION BY ra_user_id, message_type ORDER BY updated_at, source_template_id) AS version_number
  FROM current_templates
)
INSERT INTO ra_message_template_history
  (ra_user_id, message_type, version_number, destination, source_template_id,
   template_name, group_id, group_name, participants_snapshot, template_data,
   imported_current, created_at)
SELECT ra_user_id, message_type, version_number, destination, source_template_id,
       template_name, group_id, group_name, participants_snapshot, template_data,
       true, updated_at
FROM numbered
ON CONFLICT (ra_user_id, message_type, version_number) DO NOTHING;
