-- Provision the requested employee login exactly once. The migration runner
-- reapplies SQL files on startup, so record completion before later restarts.
CREATE TABLE IF NOT EXISTS app_seed_events (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_seed_events
    WHERE name = '20261015_employee_credentials'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM company_users
      WHERE lower(username) = 'employee' AND role <> 'EMPLOYEE'
    ) THEN
      RAISE EXCEPTION 'The employee username belongs to a different role';
    END IF;

    IF EXISTS (SELECT 1 FROM company_users WHERE lower(username) = 'employee') THEN
      UPDATE company_users
      SET password_hash = '$2b$12$DpLo/V70TsjtkL/1o4BEY.eJeWhpfh.ymQUSZtNi6FSNrPL6HfzdS',
          status = 'ACTIVE',
          updated_at = now()
      WHERE lower(username) = 'employee';
    ELSE
      INSERT INTO company_users (username, email, password_hash, role, status)
      VALUES (
        'employee',
        'employee@tarkashh.local',
        '$2b$12$DpLo/V70TsjtkL/1o4BEY.eJeWhpfh.ymQUSZtNi6FSNrPL6HfzdS',
        'EMPLOYEE',
        'ACTIVE'
      );
    END IF;

    INSERT INTO app_seed_events (name)
    VALUES ('20261015_employee_credentials');
  END IF;
END $$;
