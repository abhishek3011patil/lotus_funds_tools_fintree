CREATE TABLE IF NOT EXISTS broker_research_analysts (
  broker_id uuid NOT NULL REFERENCES broker_details(id),
  ra_id uuid NOT NULL REFERENCES ra_details(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  onboarding_method text NOT NULL CHECK (onboarding_method IN ('DIRECT', 'LINK', 'EXISTING')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (broker_id, ra_id)
);
CREATE INDEX IF NOT EXISTS broker_research_analysts_ra_idx ON broker_research_analysts(ra_id);

CREATE TABLE IF NOT EXISTS broker_ra_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES broker_details(id),
  token_hash text NOT NULL UNIQUE,
  email text,
  onboarding_method text NOT NULL CHECK (onboarding_method IN ('DIRECT', 'LINK')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  ra_id uuid REFERENCES ra_details(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS broker_ra_invitations_broker_idx ON broker_ra_invitations(broker_id);
