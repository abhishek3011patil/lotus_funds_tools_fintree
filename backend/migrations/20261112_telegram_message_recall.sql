CREATE TABLE IF NOT EXISTS telegram_message_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  research_call_id uuid REFERENCES research_calls(id) ON DELETE SET NULL,
  message_text text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'SENDING'
    CHECK (status IN ('SENDING', 'SENT', 'PARTIAL', 'FAILED', 'DELETED', 'DELETE_FAILED')),
  recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_message_broadcasts_sender_created_idx
  ON telegram_message_broadcasts(sender_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS telegram_message_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES telegram_message_broadcasts(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES telegram_users(id) ON DELETE SET NULL,
  telegram_peer text NOT NULL,
  recipient_name text NOT NULL,
  entity_type varchar(16) NOT NULL CHECK (entity_type IN ('USER', 'GROUP', 'CHANNEL')),
  message_ids bigint[] NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'SENT'
    CHECK (status IN ('SENT', 'PARTIAL', 'FAILED', 'DELETING', 'DELETED', 'DELETE_FAILED')),
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_message_deliveries_broadcast_idx
  ON telegram_message_deliveries(broadcast_id, sent_at DESC);
