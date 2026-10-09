ALTER TABLE insight_content
  ADD COLUMN IF NOT EXISTS youtube_channel_url text;

CREATE TABLE IF NOT EXISTS insight_content_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insight_content_images_owner_idx
  ON insight_content_images(owner_user_id, created_at DESC);
