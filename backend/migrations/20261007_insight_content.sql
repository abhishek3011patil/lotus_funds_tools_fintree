CREATE TABLE IF NOT EXISTS insight_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type varchar(16) NOT NULL CHECK (content_type IN ('BLOG', 'VIDEO')),
  title varchar(180) NOT NULL,
  summary varchar(500) NOT NULL,
  category varchar(80) NOT NULL,
  article_body text,
  youtube_url text,
  youtube_video_id varchar(32),
  visibility varchar(24) NOT NULL DEFAULT 'SUBSCRIBERS' CHECK (visibility IN ('SUBSCRIBERS', 'PUBLIC')),
  status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (content_type = 'BLOG' AND article_body IS NOT NULL AND youtube_url IS NULL AND youtube_video_id IS NULL)
    OR (content_type = 'VIDEO' AND article_body IS NULL AND youtube_url IS NOT NULL AND youtube_video_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS insight_content_author_idx ON insight_content(author_user_id, content_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS insight_content_feed_idx ON insight_content(status, visibility, published_at DESC) WHERE status = 'PUBLISHED';
