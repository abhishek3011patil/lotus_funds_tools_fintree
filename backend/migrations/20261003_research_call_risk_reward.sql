ALTER TABLE research_calls
  ADD COLUMN IF NOT EXISTS risk_reward_ratio numeric(12, 4);

UPDATE research_calls
SET risk_reward_ratio = CASE
  WHEN UPPER(action) = 'BUY'
    AND COALESCE(entry_price, entry_price_upper, entry_price_low) > stop_loss
    AND target_price > COALESCE(entry_price, entry_price_upper, entry_price_low)
  THEN ROUND(
    (target_price - COALESCE(entry_price, entry_price_upper, entry_price_low)) /
    NULLIF(COALESCE(entry_price, entry_price_upper, entry_price_low) - stop_loss, 0),
    4
  )
  WHEN UPPER(action) = 'SELL'
    AND stop_loss > COALESCE(entry_price, entry_price_low, entry_price_upper)
    AND COALESCE(entry_price, entry_price_low, entry_price_upper) > target_price
  THEN ROUND(
    (COALESCE(entry_price, entry_price_low, entry_price_upper) - target_price) /
    NULLIF(stop_loss - COALESCE(entry_price, entry_price_low, entry_price_upper), 0),
    4
  )
  ELSE NULL
END
WHERE risk_reward_ratio IS NULL;

ALTER TABLE research_calls
  DROP CONSTRAINT IF EXISTS research_calls_risk_reward_positive;

ALTER TABLE research_calls
  ADD CONSTRAINT research_calls_risk_reward_positive
  CHECK (risk_reward_ratio IS NULL OR risk_reward_ratio > 0);
