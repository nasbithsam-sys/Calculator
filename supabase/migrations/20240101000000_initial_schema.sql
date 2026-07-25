-- Supabase Schema Migration: Stabilized Production Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Profiles (Role-based access)
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers / Leads
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  phone TEXT,
  preferred_contact_method TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pricing Configurations (Versioned)
CREATE TABLE pricing_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  base_labor_price_per_foot NUMERIC NOT NULL,
  minimum_installation_charge NUMERIC NOT NULL,
  two_story_multiplier NUMERIC DEFAULT 1.0,
  three_story_multiplier NUMERIC DEFAULT 1.0,
  complex_roof_multiplier NUMERIC DEFAULT 1.0,
  jump_extension_fee NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Catalogs (Versioned)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  product_family TEXT,
  generation TEXT,
  model_number TEXT,
  length_feet NUMERIC NOT NULL,
  color TEXT,
  max_connected_length NUMERIC,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'verified', 'inactive'
  catalog_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quotes (The core record)
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL, -- Public friendly ID generated securely
  customer_id UUID REFERENCES customers(id),
  method TEXT,
  status TEXT DEFAULT 'incomplete', -- 'incomplete', 'preliminary', 'calculated', 'ready_for_review', 'review_submitted', 'expert_confirmed'
  confidence TEXT DEFAULT 'not_calculated',
  schema_version TEXT NOT NULL,
  pricing_version TEXT REFERENCES pricing_configurations(version),
  catalog_version TEXT,
  property_type TEXT,
  stories TEXT,
  roof_complexity TEXT,
  estimated_linear_feet NUMERIC,
  customer_provided_feet NUMERIC,
  map_measured_feet NUMERIC,
  expert_confirmed_feet NUMERIC,
  final_installed_feet NUMERIC,
  estimated_price_min NUMERIC,
  estimated_price_max NUMERIC,
  expert_confirmed_price NUMERIC,
  customer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quote Measurements (Customer provided or map generated)
CREATE TABLE quote_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  length_feet NUMERIC NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Expert Review Requests
CREATE TABLE expert_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE UNIQUE,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'rejected'
  reviewed_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Uploaded Files (Images, Plans)
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- 'photo', 'plan'
  storage_path TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  label TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Image Annotations
CREATE TABLE image_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
  schema_version TEXT NOT NULL,
  original_image_width NUMERIC NOT NULL,
  original_image_height NUMERIC NOT NULL,
  section_label TEXT,
  customer_notes TEXT,
  points JSONB NOT NULL, -- Array of { normalizedX, normalizedY }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Map Drawings
CREATE TABLE quote_map_drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  provider TEXT,
  center_lat NUMERIC,
  center_lng NUMERIC,
  zoom INTEGER,
  geometry_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Events
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID, -- null if public/system
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Setup Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_map_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Create Admin Check Function
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Policies for Admins (Can do everything)
CREATE POLICY "Admins can do everything on admin_profiles" ON admin_profiles FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on customers" ON customers FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on pricing_configurations" ON pricing_configurations FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on products" ON products FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on quotes" ON quotes FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on quote_measurements" ON quote_measurements FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on expert_reviews" ON expert_reviews FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on uploaded_files" ON uploaded_files FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on image_annotations" ON image_annotations FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on quote_map_drawings" ON quote_map_drawings FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on audit_events" ON audit_events FOR ALL TO authenticated USING (is_admin());


-- Public Policies
-- Note: Customers cannot INSERT directly into tables. They must use securely verified Server Actions that operate with a service_role key to write to the DB.
-- This ensures strict payload validation on the server before hitting the database.

-- Public can read active pricing configurations (needed for UI estimation without roundtrips)
CREATE POLICY "Public can read active pricing" ON pricing_configurations FOR SELECT TO public USING (active = true);

-- Public can read active verified products
CREATE POLICY "Public can read active products" ON products FOR SELECT TO public USING (is_active = true AND verification_status = 'verified');

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('property-plans', 'property-plans', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Only admins or service role can access private files directly)
CREATE POLICY "Admins can access all photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'property-photos' AND is_admin());
CREATE POLICY "Admins can access all plans" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'property-plans' AND is_admin());

