-- Demo accounts and fixed OTPs:
-- Donor 1: +919999900001 / 111111
-- Donor 2: +919999900002 / 111111
-- Hospital staff: +919999900003 / 222222
-- Admin: +919999900004 / 333333

DO $$
DECLARE
  demo_admin_id UUID;
  demo_hospital_id UUID;
  demo_staff_id UUID;
  donor_one_id UUID;
  donor_two_id UUID;
BEGIN
  INSERT INTO public.admins (
    admin_id, name, email, phone, role, is_active
  ) VALUES (
    '00000000-0000-4000-8000-000000000004',
    'BloodConnect Demo Admin',
    'demo-admin@bloodconnect.test',
    '+919999900004',
    'SuperAdmin',
    TRUE
  )
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING admin_id INTO demo_admin_id;

  INSERT INTO public.hospitals (
    hospital_id,
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
    is_active
  ) VALUES (
    '00000000-0000-4000-8000-000000000003',
    'City General Hospital (Demo)',
    'DEMO-VLR-001',
    'Government',
    'Demo Hospital Admin',
    '+919999900003',
    'demo-hospital@bloodconnect.test',
    ST_SetSRID(ST_MakePoint(79.1325, 12.9165), 4326)::geography,
    'Demo Hospital Road',
    '632001',
    'Vellore',
    'Tamil Nadu',
    TRUE,
    TRUE
  )
  ON CONFLICT (registration_number) DO UPDATE SET
    name = EXCLUDED.name,
    hospital_type = EXCLUDED.hospital_type,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    coordinates = EXCLUDED.coordinates,
    address = EXCLUDED.address,
    pincode = EXCLUDED.pincode,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_verified = TRUE,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING hospital_id INTO demo_hospital_id;

  INSERT INTO public.hospital_verifications (
    verification_id,
    hospital_id,
    license_number,
    license_doc_url,
    license_issued_at,
    license_expires_at,
    verified_by,
    verified_at,
    rejection_reason,
    status
  ) VALUES (
    '00000000-0000-4000-8000-000000000006',
    demo_hospital_id,
    'DEMO-LICENSE-VLR-001',
    'demo://hospital-license',
    DATE '2024-01-01',
    DATE '2030-12-31',
    demo_admin_id,
    NOW(),
    NULL,
    'Approved'
  )
  ON CONFLICT (verification_id) DO UPDATE SET
    hospital_id = EXCLUDED.hospital_id,
    license_number = EXCLUDED.license_number,
    license_doc_url = EXCLUDED.license_doc_url,
    license_issued_at = EXCLUDED.license_issued_at,
    license_expires_at = EXCLUDED.license_expires_at,
    verified_by = EXCLUDED.verified_by,
    verified_at = EXCLUDED.verified_at,
    rejection_reason = NULL,
    status = 'Approved',
    updated_at = NOW();

  INSERT INTO public.hospital_staff (
    staff_id, hospital_id, name, phone, email, role, is_active
  ) VALUES (
    '00000000-0000-4000-8000-000000000005',
    demo_hospital_id,
    'Demo Hospital Admin',
    '+919999900003',
    'demo-hospital@bloodconnect.test',
    'Admin',
    TRUE
  )
  ON CONFLICT (phone) DO UPDATE SET
    hospital_id = EXCLUDED.hospital_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING staff_id INTO demo_staff_id;

  INSERT INTO public.users (
    user_id,
    phone,
    name,
    blood_group,
    date_of_birth,
    gender,
    is_eligible,
    eligible_from,
    donor_score,
    aadhaar_verified,
    is_available
  ) VALUES (
    '00000000-0000-4000-8000-000000000001',
    '+919999900001',
    'Demo Donor One',
    'O+',
    DATE '1995-01-01',
    'Other',
    TRUE,
    NULL,
    0,
    TRUE,
    TRUE
  )
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    blood_group = EXCLUDED.blood_group,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    is_eligible = TRUE,
    eligible_from = NULL,
    donor_score = 0,
    aadhaar_verified = TRUE,
    is_available = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
  RETURNING user_id INTO donor_one_id;

  INSERT INTO public.users (
    user_id,
    phone,
    name,
    blood_group,
    date_of_birth,
    gender,
    is_eligible,
    eligible_from,
    donor_score,
    aadhaar_verified,
    is_available
  ) VALUES (
    '00000000-0000-4000-8000-000000000002',
    '+919999900002',
    'Demo Donor Two',
    'B+',
    DATE '1990-01-01',
    'Other',
    TRUE,
    NULL,
    0,
    TRUE,
    TRUE
  )
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    blood_group = EXCLUDED.blood_group,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    is_eligible = TRUE,
    eligible_from = NULL,
    donor_score = 0,
    aadhaar_verified = TRUE,
    is_available = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
  RETURNING user_id INTO donor_two_id;

  INSERT INTO public.user_locations (
    location_id, user_id, coordinates, pincode, city, state, is_primary
  ) VALUES (
    '00000000-0000-4000-8000-000000000007',
    donor_one_id,
    ST_SetSRID(ST_MakePoint(79.1325, 12.9345), 4326)::geography,
    '632001',
    'Vellore',
    'Tamil Nadu',
    TRUE
  )
  ON CONFLICT (location_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    coordinates = EXCLUDED.coordinates,
    pincode = EXCLUDED.pincode,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_primary = TRUE,
    updated_at = NOW();

  INSERT INTO public.user_locations (
    location_id, user_id, coordinates, pincode, city, state, is_primary
  ) VALUES (
    '00000000-0000-4000-8000-000000000008',
    donor_two_id,
    ST_SetSRID(ST_MakePoint(79.1787, 12.9165), 4326)::geography,
    '632001',
    'Vellore',
    'Tamil Nadu',
    TRUE
  )
  ON CONFLICT (location_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    coordinates = EXCLUDED.coordinates,
    pincode = EXCLUDED.pincode,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_primary = TRUE,
    updated_at = NOW();
END;
$$;
