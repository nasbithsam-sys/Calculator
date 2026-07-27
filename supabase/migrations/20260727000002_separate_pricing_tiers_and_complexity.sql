-- Migration: Decouple Light Requirements from Installation Pricing Tiers

-- 1. Add pricing tier matrix and complexity rules to pricing_configurations
ALTER TABLE pricing_configurations
  ADD COLUMN IF NOT EXISTS job_size_thresholds JSONB DEFAULT '{
    "small": 100,
    "medium": 180,
    "large": 280
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS complexity_scoring_rules JSONB DEFAULT '{
    "two_story_points": 15,
    "three_story_points": 35,
    "moderate_roof_points": 15,
    "complex_roof_points": 30,
    "gable_points": 5,
    "arch_points": 10,
    "dormer_points": 15,
    "porch_points": 10,
    "balcony_points": 10,
    "multiple_levels_points": 15,
    "detached_garage_points": 10,
    "hidden_sections_points": 15,
    "difficult_corners_points": 15,
    "difficult_access_points": 20
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS complexity_bands JSONB DEFAULT '{
    "low": 20,
    "moderate": 45,
    "high": 75
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_tier_matrix JSONB DEFAULT '{
    "SMALL_LOW": { "name": "Small / Low Complexity", "min": 650, "max": 950 },
    "SMALL_MODERATE": { "name": "Small / Moderate Complexity", "min": 850, "max": 1250 },
    "SMALL_HIGH": { "name": "Small / High Complexity", "min": 1100, "max": 1600 },
    "SMALL_EXTREME": { "name": "Small / Extreme Complexity", "min": 1400, "max": 2000 },
    "MEDIUM_LOW": { "name": "Medium / Low Complexity", "min": 1100, "max": 1550 },
    "MEDIUM_MODERATE": { "name": "Medium / Moderate Complexity", "min": 1400, "max": 1950 },
    "MEDIUM_HIGH": { "name": "Medium / High Complexity", "min": 1800, "max": 2500 },
    "MEDIUM_EXTREME": { "name": "Medium / Extreme Complexity", "min": 2300, "max": 3200 },
    "LARGE_LOW": { "name": "Large / Low Complexity", "min": 1700, "max": 2300 },
    "LARGE_MODERATE": { "name": "Large / Moderate Complexity", "min": 2100, "max": 2900 },
    "LARGE_HIGH": { "name": "Large / High Complexity Residential", "min": 2700, "max": 3800 },
    "LARGE_EXTREME": { "name": "Large / Extreme Complexity", "min": 3500, "max": 4800 },
    "XL_LOW": { "name": "Extra Large / Low Complexity", "min": 2500, "max": 3500 },
    "XL_MODERATE": { "name": "Extra Large / Moderate Complexity", "min": 3200, "max": 4400 },
    "XL_HIGH": { "name": "Extra Large / High Complexity", "min": 4000, "max": 5600 },
    "XL_EXTREME": { "name": "Extra Large / Extreme Complexity", "min": 5000, "max": 7500 }
  }'::jsonb;

-- 2. Add full persistent properties, light requirements, and pricing tier columns to quotes
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS property_category TEXT,
  ADD COLUMN IF NOT EXISTS coverage_type TEXT,
  ADD COLUMN IF NOT EXISTS roofline_type TEXT,
  ADD COLUMN IF NOT EXISTS gable_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arch_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_dormers BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_porch BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_multiple_roof_levels BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_detached_garage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_multiple_structures BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_hidden_sections BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_difficult_corners BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_difficulty TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS footage_method TEXT,
  ADD COLUMN IF NOT EXISTS footage_status TEXT,
  ADD COLUMN IF NOT EXISTS estimated_installation_feet_min NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_installation_feet_max NUMERIC,
  ADD COLUMN IF NOT EXISTS projected_unsupported_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS purchasing_allowance_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet_min NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet_max NUMERIC,
  ADD COLUMN IF NOT EXISTS total_supplied_kit_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS excess_kit_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_kits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_size TEXT,
  ADD COLUMN IF NOT EXISTS complexity_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complexity_band TEXT,
  ADD COLUMN IF NOT EXISTS pricing_tier_code TEXT,
  ADD COLUMN IF NOT EXISTS pricing_tier_name TEXT,
  ADD COLUMN IF NOT EXISTS installation_price_min NUMERIC,
  ADD COLUMN IF NOT EXISTS installation_price_max NUMERIC,
  ADD COLUMN IF NOT EXISTS installation_pricing_model_version TEXT,
  ADD COLUMN IF NOT EXISTS review_reasons JSONB DEFAULT '[]'::jsonb;
