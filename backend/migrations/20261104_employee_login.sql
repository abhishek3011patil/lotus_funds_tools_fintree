-- Provision the shared employee login once.
-- Username: employee
-- Password: employee (stored only as a bcrypt hash)
CREATE TABLE IF NOT EXISTS app_seed_events (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_seed_events
    WHERE name = '20261104_employee_login'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM company_users
      WHERE lower(username) = 'employee' AND role <> 'EMPLOYEE'
    ) THEN
      RAISE EXCEPTION 'The employee username belongs to a different role';
    END IF;

    IF EXISTS (SELECT 1 FROM company_users WHERE lower(username) = 'employee') THEN
      UPDATE company_users
      SET password_hash = '$2b$12$anmLQVC6Pj2/OuUAOJCTJOkS1bgZWOs9.dgOel8W62RhhmltjcSgO',
          role = 'EMPLOYEE',
          status = 'ACTIVE',
          updated_at = now()
      WHERE lower(username) = 'employee';
    ELSE
      INSERT INTO company_users (username, email, password_hash, role, status)
      VALUES (
        'employee',
        'employee@tarkashh.local',
        '$2b$12$anmLQVC6Pj2/OuUAOJCTJOkS1bgZWOs9.dgOel8W62RhhmltjcSgO',
        'EMPLOYEE',
        'ACTIVE'
      );
    END IF;

    INSERT INTO app_seed_events (name)
    VALUES ('20261104_employee_login');
  END IF;
END $$;
