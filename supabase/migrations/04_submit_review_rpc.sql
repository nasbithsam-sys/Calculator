-- supabase/migrations/04_submit_review_rpc.sql

CREATE OR REPLACE FUNCTION submit_review_transaction(
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
  p_property_type TEXT,
  p_stories TEXT,
  p_roof_complexity TEXT,
  p_estimated_linear_feet NUMERIC,
  p_customer_provided_feet NUMERIC,
  p_customer_notes TEXT,
  p_measurement_sections JSONB,
  p_map_geometry JSONB,
  p_uploaded_photos JSONB,
  p_uploaded_plans JSONB,
  p_uploaded_videos JSONB
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_quote_id UUID;
  v_reference_number TEXT;
  v_file_id UUID;
  v_photo JSONB;
  v_plan JSONB;
  v_video JSONB;
  v_section JSONB;
  v_result JSONB;
BEGIN
  -- 1. Create or Update Customer
  INSERT INTO customers (name, email, phone, street, zip)
  VALUES (p_customer_name, p_customer_email, p_customer_phone, p_customer_street, p_customer_zip)
  RETURNING id INTO v_customer_id;

  -- 2. Generate secure Reference Number
  v_reference_number := 'EST-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 3. Create Quote (We DO NOT trust client-supplied prices or final footage)
  -- The price will be calculated later or derived by the expert. 
  -- We only store the structural parameters and raw measurements.
  INSERT INTO quotes (
    reference_number, customer_id, method, status, confidence, schema_version,
    pricing_version, catalog_version, property_type, stories, roof_complexity,
    estimated_linear_feet, customer_provided_feet, customer_notes
  ) VALUES (
    v_reference_number, v_customer_id, p_method, 'review_submitted', p_confidence, p_schema_version,
    p_pricing_version, p_catalog_version, p_property_type, p_stories, p_roof_complexity,
    p_estimated_linear_feet, p_customer_provided_feet, p_customer_notes
  ) RETURNING id INTO v_quote_id;

  -- 4. Save Measurement Sections
  IF p_measurement_sections IS NOT NULL AND jsonb_array_length(p_measurement_sections) > 0 THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_measurement_sections) LOOP
      INSERT INTO quote_measurements (quote_id, section_name, length_feet, display_order)
      VALUES (
        v_quote_id,
        v_section->>'name',
        (v_section->>'lengthFeet')::NUMERIC,
        (v_section->>'order')::INTEGER
      );
    END LOOP;
  END IF;

  -- 4b. Save Map Drawings
  IF p_map_geometry IS NOT NULL THEN
    INSERT INTO quote_map_drawings (quote_id, provider, geometry_json)
    VALUES (v_quote_id, 'google', p_map_geometry);
  END IF;

  -- 4c. Save Uploaded Photos and Annotations
  IF p_uploaded_photos IS NOT NULL AND jsonb_array_length(p_uploaded_photos) > 0 THEN
    FOR v_photo IN SELECT * FROM jsonb_array_elements(p_uploaded_photos) LOOP
      INSERT INTO uploaded_files (quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order)
      VALUES (
        v_quote_id, 'photo', v_photo->>'storagePath', v_photo->>'name', v_photo->>'type', (v_photo->>'size')::BIGINT, (v_photo->>'displayOrder')::INTEGER
      ) RETURNING id INTO v_file_id;

      IF v_photo->'annotations' IS NOT NULL THEN
        INSERT INTO image_annotations (file_id, schema_version, original_image_width, original_image_height, points)
        VALUES (v_file_id, '1.0', 1000, 1000, v_photo->'annotations');
      END IF;
    END LOOP;
  END IF;

  -- Save Uploaded Plans
  IF p_uploaded_plans IS NOT NULL AND jsonb_array_length(p_uploaded_plans) > 0 THEN
    FOR v_plan IN SELECT * FROM jsonb_array_elements(p_uploaded_plans) LOOP
      INSERT INTO uploaded_files (quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order)
      VALUES (
        v_quote_id, 'plan', v_plan->>'storagePath', v_plan->>'name', v_plan->>'type', (v_plan->>'size')::BIGINT, (v_plan->>'displayOrder')::INTEGER
      );
    END LOOP;
  END IF;
  
  -- Save Uploaded Videos
  IF p_uploaded_videos IS NOT NULL AND jsonb_array_length(p_uploaded_videos) > 0 THEN
    FOR v_video IN SELECT * FROM jsonb_array_elements(p_uploaded_videos) LOOP
      INSERT INTO uploaded_files (quote_id, file_type, storage_path, original_name, mime_type, size_bytes, display_order)
      VALUES (
        v_quote_id, 'video', v_video->>'storagePath', v_video->>'name', v_video->>'type', (v_video->>'size')::BIGINT, (v_video->>'displayOrder')::INTEGER
      );
    END LOOP;
  END IF;

  -- 5. Create Expert Review Request
  INSERT INTO expert_reviews (quote_id, notes, status)
  VALUES (v_quote_id, p_customer_notes, 'pending');

  v_result := jsonb_build_object(
    'success', true,
    'referenceNumber', v_reference_number,
    'quoteId', v_quote_id
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- The transaction will be rolled back automatically when an exception is raised
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
