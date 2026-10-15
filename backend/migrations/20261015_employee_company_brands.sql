CREATE TABLE IF NOT EXISTS employee_company_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  color char(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_mime varchar(32) NOT NULL CHECK (logo_mime IN ('image/png', 'image/jpeg', 'image/webp')),
  logo_data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS employee_company_brands_name_idx
  ON employee_company_brands (lower(name));
