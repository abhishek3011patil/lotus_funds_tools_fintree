ALTER TABLE broker_research_analysts
  DROP CONSTRAINT IF EXISTS broker_research_analysts_status_check;

ALTER TABLE broker_research_analysts
  ADD CONSTRAINT broker_research_analysts_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'));

