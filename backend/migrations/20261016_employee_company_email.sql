ALTER TABLE employee_company_brands
  ADD COLUMN IF NOT EXISTS recipient_email varchar(254);
