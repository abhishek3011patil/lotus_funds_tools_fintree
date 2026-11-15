ALTER TABLE ra_audience_groups
  ADD COLUMN IF NOT EXISTS custom_disclaimer text;
