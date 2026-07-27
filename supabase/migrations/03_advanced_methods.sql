-- supabase/migrations/03_advanced_methods.sql

CREATE TABLE IF NOT EXISTS estimation_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_calibrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
  reference_length_feet NUMERIC NOT NULL,
  reference_points JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS supported_installation_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS projected_unsupported_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS estimation_model_version TEXT REFERENCES estimation_models(version),
  ADD COLUMN IF NOT EXISTS expert_confirmed_feet NUMERIC;

ALTER TABLE expert_reviews
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
  ADD COLUMN IF NOT EXISTS video_call_windows TEXT;

ALTER TABLE image_annotations
  ADD COLUMN IF NOT EXISTS measurement_status TEXT DEFAULT 'pending';

ALTER TABLE quote_map_drawings
  ADD COLUMN IF NOT EXISTS measurement_status TEXT DEFAULT 'pending';

INSERT INTO storage.buckets (id, name, public) VALUES ('property-videos', 'property-videos', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Admins can access all videos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'property-videos' AND is_admin());

ALTER TABLE estimation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_calibrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on estimation_models" ON estimation_models FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on photo_calibrations" ON photo_calibrations FOR ALL TO authenticated USING (is_admin());
