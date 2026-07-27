-- Seed Active Pricing Configuration
INSERT INTO pricing_configurations (
  version, 
  base_labor_price_per_foot, 
  minimum_installation_charge, 
  two_story_multiplier, 
  three_story_multiplier, 
  moderate_roof_multiplier, 
  complex_roof_multiplier, 
  peak_charge, 
  purchasing_allowance_percent, 
  estimate_uncertainty_percent, 
  active
) VALUES (
  'v1.0', 
  18.00, 
  750.00, 
  1.25, 
  1.50, 
  1.15, 
  1.30, 
  45.00, 
  15.00, 
  10.00, 
  true
) ON CONFLICT (version) DO UPDATE SET 
  base_labor_price_per_foot = EXCLUDED.base_labor_price_per_foot,
  minimum_installation_charge = EXCLUDED.minimum_installation_charge,
  active = EXCLUDED.active;

-- Seed Verified Products
INSERT INTO products (
  name, product_family, length_feet, max_connected_length, price, is_active, verification_status, catalog_version
) VALUES
  ('Govee Permanent Outdoor Lights (100ft Kit)', 'Standard', 100, 150, 299.99, true, 'verified', 'v1.0'),
  ('Govee Permanent Outdoor Lights (150ft Kit)', 'Standard', 150, 150, 449.99, true, 'verified', 'v1.0'),
  ('Govee Permanent Outdoor Lights Pro (100ft Kit)', 'Pro', 100, 200, 399.99, true, 'verified', 'v1.0'),
  ('Govee Permanent Outdoor Lights Pro (150ft Kit)', 'Pro', 150, 200, 549.99, true, 'verified', 'v1.0'),
  ('Govee Permanent Outdoor Lights (50ft Expansion)', 'Standard', 50, 200, 149.99, true, 'verified', 'v1.0')
ON CONFLICT DO NOTHING;
