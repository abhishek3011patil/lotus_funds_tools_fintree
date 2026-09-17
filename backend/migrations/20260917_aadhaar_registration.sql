ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_number varchar(12),
  ADD COLUMN IF NOT EXISTS aadhaar_kyc_status varchar(20),
  ADD COLUMN IF NOT EXISTS aadhaar_reference_id varchar(255),
  ADD COLUMN IF NOT EXISTS aadhaar_verified_at timestamp;

ALTER TABLE ra_details
  ADD COLUMN IF NOT EXISTS aadhaar_number varchar(12),
  ADD COLUMN IF NOT EXISTS aadhaar_kyc_status varchar(20),
  ADD COLUMN IF NOT EXISTS aadhaar_reference_id varchar(255),
  ADD COLUMN IF NOT EXISTS aadhaar_verified_at timestamp;
