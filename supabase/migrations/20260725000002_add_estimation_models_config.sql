ALTER TABLE estimation_models
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Insert a default estimation model version if not exists
INSERT INTO estimation_models (version, description, config, is_active)
VALUES (
  'v1',
  'Standard Geometric Assumption Model',
  '{
    "default_frontage": 40,
    "front_sides_multiplier": 2.0,
    "full_perimeter_multiplier": 3.5,
    "peak_addition_feet": 15,
    "moderate_complexity_multiplier": 1.1,
    "complex_complexity_multiplier": 1.3
  }'::jsonb,
  true
)
ON CONFLICT (version) DO UPDATE SET config = EXCLUDED.config, is_active = EXCLUDED.is_active;
