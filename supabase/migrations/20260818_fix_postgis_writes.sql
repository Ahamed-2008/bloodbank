-- Fix PostGIS writes to build geometry server-side instead of serializing POINT(...) strings in app code.
-- This ensures raw latitude/longitude values are converted to PostGIS geometry with ST_SetSRID(ST_MakePoint(...), 4326).

CREATE OR REPLACE FUNCTION upsert_user_location(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_pincode TEXT,
  p_city TEXT,
  p_state TEXT,
  p_is_primary BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (location_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_location_id UUID;
BEGIN
  SELECT location_id
    INTO v_location_id
    FROM user_locations
   WHERE user_id = p_user_id
     AND is_primary = p_is_primary
   LIMIT 1;

  IF v_location_id IS NULL THEN
    INSERT INTO user_locations (
      user_id,
      coordinates,
      pincode,
      city,
      state,
      is_primary,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
      p_pincode,
      p_city,
      p_state,
      p_is_primary,
      NOW(),
      NOW()
    )
    RETURNING location_id INTO v_location_id;
  ELSE
    UPDATE user_locations
       SET coordinates = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
           pincode = p_pincode,
           city = p_city,
           state = p_state,
           updated_at = NOW()
     WHERE location_id = v_location_id
     RETURNING location_id INTO v_location_id;
  END IF;

  RETURN QUERY
  SELECT v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_hospital_record(
  p_name TEXT,
  p_registration_number TEXT,
  p_hospital_type TEXT,
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_email TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_address TEXT,
  p_pincode TEXT,
  p_city TEXT,
  p_state TEXT
)
RETURNS TABLE (hospital_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hospital_id UUID;
BEGIN
  INSERT INTO hospitals (
    name,
    registration_number,
    hospital_type,
    contact_name,
    contact_phone,
    contact_email,
    coordinates,
    address,
    pincode,
    city,
    state,
    is_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_name,
    p_registration_number,
    p_hospital_type,
    p_contact_name,
    p_contact_phone,
    p_contact_email,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
    p_address,
    p_pincode,
    p_city,
    p_state,
    FALSE,
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING hospital_id INTO v_hospital_id;

  RETURN QUERY
  SELECT v_hospital_id;
END;
$$;
