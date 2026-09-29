ALTER TABLE telegram_users
  ADD COLUMN IF NOT EXISTS client_user_id uuid
  REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE whatsapp_participants
  ADD COLUMN IF NOT EXISTS client_user_id uuid
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS telegram_users_ra_client_idx
  ON telegram_users(user_id, client_user_id)
  WHERE client_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_participants_ra_client_idx
  ON whatsapp_participants(ra_user_id, client_user_id)
  WHERE client_user_id IS NOT NULL;
