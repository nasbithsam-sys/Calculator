ALTER TABLE products
  ADD COLUMN extension_compatibility TEXT,
  ADD COLUMN included_extensions NUMERIC DEFAULT 0,
  ADD COLUMN compatible_accessories JSONB DEFAULT '[]',
  ADD COLUMN installation_compatibility TEXT,
  ADD COLUMN verification_source TEXT,
  ADD COLUMN last_verified_date TIMESTAMPTZ;
