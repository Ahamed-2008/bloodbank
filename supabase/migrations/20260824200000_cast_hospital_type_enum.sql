CREATE OR REPLACE FUNCTION public.create_hospital_record(
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
  INSERT INTO public.hospitals (
    name, registration_number, hospital_type, contact_name, contact_phone,
    contact_email, coordinates, address, pincode, city, state, is_verified,
    is_active, updated_at
  )
  VALUES (
    p_name,
    p_registration_number,
    p_hospital_type::public.hospital_type_enum,
    p_contact_name,
    p_contact_phone,
    p_contact_email,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_address,
    p_pincode,
    p_city,
    p_state,
    FALSE,
    FALSE,
    NOW()
  )
  RETURNING hospitals.hospital_id INTO v_hospital_id;

  RETURN QUERY SELECT v_hospital_id;
END;
$$;