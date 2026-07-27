CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS submission_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS supported_installation_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_installation_feet_min NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_installation_feet_max NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet_min NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_purchasing_feet_max NUMERIC,
  ADD COLUMN IF NOT EXISTS total_supplied_kit_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS excess_kit_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS projected_unsupported_feet NUMERIC,
  ADD COLUMN IF NOT EXISTS estimation_model_version TEXT;

ALTER TABLE expert_reviews
  ADD COLUMN IF NOT EXISTS contact_preference TEXT,
  ADD COLUMN IF NOT EXISTS video_call_window TEXT,
  ADD COLUMN IF NOT EXISTS time_zone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_email_status TEXT DEFAULT 'pending';

ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS dimensions_visible BOOLEAN,
  ADD COLUMN IF NOT EXISTS scale_visible BOOLEAN,
  ADD COLUMN IF NOT EXISTS scale_metadata JSONB,
  ADD COLUMN IF NOT EXISTS original_width NUMERIC,
  ADD COLUMN IF NOT EXISTS original_height NUMERIC;

CREATE OR REPLACE FUNCTION submit_review_transaction(
  p_submission_key TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_street TEXT,
  p_customer_zip TEXT,
  p_method TEXT,
  p_confidence TEXT,
  p_schema_version TEXT,
  p_pricing_version TEXT,
  p_catalog_version TEXT,
  p_estimation_model_version TEXT,
  p_property_type TEXT,
  p_stories TEXT,
  p_roof_complexity TEXT,
  p_estimated_linear_feet NUMERIC,
  p_supported_installation_feet NUMERIC,
  p_recommended_purchasing_feet NUMERIC,
  p_total_supplied_kit_feet NUMERIC,
  p_excess_kit_feet NUMERIC,
  p_customer_provided_feet NUMERIC,
  p_customer_notes TEXT,
  p_contact_preference TEXT,
  p_video_call_window TEXT,
  p_time_zone TEXT,
  p_measurement_sections JSONB,
  p_map_geometry JSONB,
  p_uploaded_photos JSONB,
  p_uploaded_plans JSONB,
  p_uploaded_videos JSONB
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_quote_id UUID;
  v_existing_reference TEXT;
  v_reference_number TEXT;
  v_file_id UUID;
  v_photo JSONB;
  v_plan JSONB;
  v_video JSONB;
  v_section JSONB;
BEGIN
  SELECT reference_number INTO v_existing_reference
  FROM quotes
  WHERE submission_key = p_submission_key;

  IF v_existing_reference IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'referenceNumber', v_existing_reference,
      'idempotent', true
    );
  END IF;

  INSERT INTO customers (name, email, phone, preferred_contact_method, street, zip)
  VALUES (p_customer_name, p_customer_email, p_customer_phone, p_contact_preference, p_customer_street, p_customer_zip)
  RETURNING id INTO v_customer_id;

  v_reference_number := 'EST-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

  INSERT INTO quotes (
    submission_key,
    reference_number,
    customer_id,
    method,
    status,
    confidence,
    schema_version,
    pricing_version,
    catalog_version,
    estimation_model_version,
    property_type,
    stories,
    roof_complexity,
    estimated_linear_feet,
    supported_installation_feet,
    recommended_purchasing_feet,
    total_supplied_kit_feet,
    excess_kit_feet,
    customer_provided_feet,
    customer_notes
  ) VALUES (
    p_submission_key,
    v_reference_number,
    v_customer_id,
    p_method,
    'review_submitted',
    p_confidence,
    p_schema_version,
    p_pricing_version,
    p_catalog_version,
    p_estimation_model_version,
    p_property_type,
    p_stories,
    p_roof_complexity,
    p_estimated_linear_feet,
    p_supported_installation_feet,
    p_recommended_purchasing_feet,
    p_total_supplied_kit_feet,
    p_excess_kit_feet,
    p_customer_provided_feet,
    p_customer_notes
  ) RETURNING id INTO v_quote_id;

  IF p_measurement_sections IS NOT NULL AND jsonb_array_length(p_measurement_sections) > 0 THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_measurement_sections) LOOP
      INSERT INTO quote_measurements (quote_id, section_name, length_feet, display_order)
      VALUES (
        v_quote_id,
        v_section->>'name',
        (v_section->>'lengthFeet')::NUMERIC,
        COALESCE((v_section->>'order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  IF p_map_geometry IS NOT NULL THEN
    INSERT INTO quote_map_drawings (quote_id, provider, geometry_json, measurement_status)
    VALUES (v_quote_id, 'google', p_map_geometry, 'pending');
  END IF;

  IF p_uploaded_photos IS NOT NULL AND jsonb_array_length(p_uploaded_photos) > 0 THEN
    FOR v_photo IN SELECT * FROM jsonb_array_elements(p_uploaded_photos) LOOP
      INSERT INTO uploaded_files (
        quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order,
        original_width, original_height
      )
      VALUES (
        v_quote_id,
        'photo',
        v_photo->>'storagePath',
        v_photo->>'name',
        v_photo->>'type',
        (v_photo->>'size')::BIGINT,
        COALESCE((v_photo->>'displayOrder')::INTEGER, 0),
        NULLIF(v_photo->>'originalWidth', '')::NUMERIC,
        NULLIF(v_photo->>'originalHeight', '')::NUMERIC
      ) RETURNING id INTO v_file_id;

      IF v_photo->'annotations' IS NOT NULL THEN
        INSERT INTO image_annotations (
          file_id, schema_version, original_image_width, original_image_height, points, measurement_status
        )
        VALUES (
          v_file_id,
          '1.0',
          COALESCE(NULLIF(v_photo->>'originalWidth', '')::NUMERIC, 0),
          COALESCE(NULLIF(v_photo->>'originalHeight', '')::NUMERIC, 0),
          v_photo->'annotations',
          'pending'
        );
      END IF;
    END LOOP;
  END IF;

  IF p_uploaded_plans IS NOT NULL AND jsonb_array_length(p_uploaded_plans) > 0 THEN
    FOR v_plan IN SELECT * FROM jsonb_array_elements(p_uploaded_plans) LOOP
      INSERT INTO uploaded_files (
        quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order,
        dimensions_visible, scale_visible, scale_metadata
      )
      VALUES (
        v_quote_id,
        'plan',
        v_plan->>'storagePath',
        v_plan->>'name',
        v_plan->>'type',
        (v_plan->>'size')::BIGINT,
        COALESCE((v_plan->>'displayOrder')::INTEGER, 0),
        COALESCE((v_plan->'planMetadata'->>'dimensionsVisible')::BOOLEAN, false),
        COALESCE((v_plan->'planMetadata'->>'scaleVisible')::BOOLEAN, false),
        v_plan->'planMetadata'
      );
    END LOOP;
  END IF;

  IF p_uploaded_videos IS NOT NULL AND jsonb_array_length(p_uploaded_videos) > 0 THEN
    FOR v_video IN SELECT * FROM jsonb_array_elements(p_uploaded_videos) LOOP
      INSERT INTO uploaded_files (quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order, notes)
      VALUES (
        v_quote_id,
        'video',
        v_video->>'storagePath',
        v_video->>'name',
        v_video->>'type',
        (v_video->>'size')::BIGINT,
        COALESCE((v_video->>'displayOrder')::INTEGER, 0),
        v_video->'videoMetadata'->>'viewLabel'
      );
    END LOOP;
  END IF;

  INSERT INTO expert_reviews (
    quote_id,
    notes,
    status,
    preferred_contact_method,
    contact_preference,
    video_call_windows,
    video_call_window,
    time_zone
  )
  VALUES (
    v_quote_id,
    p_customer_notes,
    'pending',
    p_contact_preference,
    p_contact_preference,
    p_video_call_window,
    p_video_call_window,
    p_time_zone
  );

  INSERT INTO audit_events (action, entity_type, entity_id, details)
  VALUES ('expert_review_submitted', 'quote', v_quote_id, jsonb_build_object('method', p_method));

  RETURN jsonb_build_object(
    'success', true,
    'referenceNumber', v_reference_number,
    'quoteId', v_quote_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
