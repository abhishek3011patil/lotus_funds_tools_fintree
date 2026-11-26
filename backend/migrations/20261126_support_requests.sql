-- Match the support_requests schema in the supplied PostgreSQL dump.
-- The migration runner replays files, so each change must be safe to repeat.
CREATE TABLE IF NOT EXISTS support_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  user_type varchar(20) NOT NULL,
  sender_name varchar(150) NOT NULL,
  complaint varchar(255) NOT NULL,
  category varchar(100) NOT NULL,
  description text NOT NULL,
  priority varchar(20) NOT NULL DEFAULT 'MEDIUM',
  status varchar(30) NOT NULL DEFAULT 'OPEN',
  attachment_name varchar(255),
  attachment_url text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT support_requests_user_type_check
    CHECK (user_type IN ('RA', 'BROKER', 'CLIENT')),
  CONSTRAINT support_requests_priority_check
    CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  CONSTRAINT support_requests_status_check
    CHECK (status IN ('OPEN', 'IN PROGRESS', 'RESOLVED', 'CLOSED'))
);

-- An existing table may have been created manually with only some fields.
-- Missing required fields are not filled with invented values: SET NOT NULL
-- fails and rolls back if existing rows cannot satisfy the dump's schema.
ALTER TABLE support_requests
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS user_type varchar(20),
  ADD COLUMN IF NOT EXISTS sender_name varchar(150),
  ADD COLUMN IF NOT EXISTS complaint varchar(255),
  ADD COLUMN IF NOT EXISTS category varchar(100),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS priority varchar(20) DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS status varchar(30) DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS attachment_name varchar(255),
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE support_requests
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_type SET NOT NULL,
  ALTER COLUMN sender_name SET NOT NULL,
  ALTER COLUMN complaint SET NOT NULL,
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN priority SET DEFAULT 'MEDIUM',
  ALTER COLUMN priority SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'OPEN',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'support_requests'::regclass
      AND attname = 'id' AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'Existing support_requests table has no id column; review its data before adding an identity';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'support_requests'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE support_requests
      ADD CONSTRAINT support_requests_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'support_requests'::regclass
      AND conname = 'support_requests_user_id_fkey'
  ) THEN
    ALTER TABLE support_requests
      ADD CONSTRAINT support_requests_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'support_requests'::regclass
      AND conname = 'support_requests_user_type_check'
  ) THEN
    ALTER TABLE support_requests
      ADD CONSTRAINT support_requests_user_type_check
      CHECK (user_type IN ('RA', 'BROKER', 'CLIENT'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'support_requests'::regclass
      AND conname = 'support_requests_priority_check'
  ) THEN
    ALTER TABLE support_requests
      ADD CONSTRAINT support_requests_priority_check
      CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'support_requests'::regclass
      AND conname = 'support_requests_status_check'
  ) THEN
    ALTER TABLE support_requests
      ADD CONSTRAINT support_requests_status_check
      CHECK (status IN ('OPEN', 'IN PROGRESS', 'RESOLVED', 'CLOSED'));
  END IF;
END $$;
