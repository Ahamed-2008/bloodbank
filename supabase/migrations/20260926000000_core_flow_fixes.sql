ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS patient_ref TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.admins(admin_id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.get_hospital_coordinates(
  p_hospital_id UUID
)
RETURNS TABLE (
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ST_X(h.coordinates::geometry) AS longitude,
    ST_Y(h.coordinates::geometry) AS latitude
  FROM public.hospitals AS h
  WHERE h.hospital_id = p_hospital_id;
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_eligible_donors(
  p_blood_group public.blood_group_enum,
  p_hospital_id UUID,
  p_radius_km INTEGER,
  p_compatible_groups public.blood_group_enum[],
  p_alert_id UUID,
  p_limit INTEGER
)
RETURNS TABLE (
  user_id UUID,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    matches.user_id,
    MIN(matches.distance_meters)::DOUBLE PRECISION AS distance_meters
  FROM (
    SELECT
      u.user_id,
      ST_Distance(ul.coordinates, h.coordinates) AS distance_meters
    FROM public.users AS u
    JOIN public.user_locations AS ul
      ON ul.user_id = u.user_id
     AND ul.is_primary = TRUE
    JOIN public.hospitals AS h
      ON h.hospital_id = p_hospital_id
    WHERE p_blood_group = ANY(p_compatible_groups)
      AND u.blood_group = ANY(p_compatible_groups)
      AND u.is_eligible = TRUE
      AND (u.eligible_from IS NULL OR u.eligible_from <= NOW())
      AND u.aadhaar_verified = TRUE
      AND u.is_available = TRUE
      AND ST_DWithin(ul.coordinates, h.coordinates, p_radius_km * 1000)
      AND NOT EXISTS (
        SELECT 1
        FROM public.alerts AS a
        JOIN public.hospital_staff AS hs
          ON hs.staff_id = a.created_by
        WHERE a.alert_id = p_alert_id
          AND hs.phone = u.phone
      )
  ) AS matches
  GROUP BY matches.user_id
  ORDER BY MIN(matches.distance_meters) ASC
  LIMIT GREATEST(p_limit, 0);
$$;

CREATE OR REPLACE FUNCTION public.increment_accepted_count(
  p_alert_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.alerts
     SET accepted_count = accepted_count + 1,
         updated_at = NOW()
   WHERE alert_id = p_alert_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert not found: %', p_alert_id;
  END IF;
END;
$$;
