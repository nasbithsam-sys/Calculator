ALTER TABLE pricing_configurations
  ADD COLUMN moderate_roof_multiplier NUMERIC DEFAULT 1.0,
  ADD COLUMN peak_charge NUMERIC DEFAULT 0,
  ADD COLUMN difficult_access_charge NUMERIC DEFAULT 0,
  ADD COLUMN accessory_charge NUMERIC DEFAULT 0,
  ADD COLUMN travel_adjustment NUMERIC DEFAULT 0,
  ADD COLUMN regional_adjustment NUMERIC DEFAULT 0,
  ADD COLUMN discount_rules JSONB DEFAULT '[]',
  ADD COLUMN purchasing_allowance_percent NUMERIC DEFAULT 10,
  ADD COLUMN estimate_uncertainty_percent NUMERIC DEFAULT 5,
  ADD COLUMN effective_date TIMESTAMPTZ DEFAULT NOW();
