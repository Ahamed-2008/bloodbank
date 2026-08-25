CREATE OR REPLACE FUNCTION public.increment_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.users
     SET reward_points = reward_points + p_points,
         updated_at = NOW()
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_donor_score(
  p_user_id UUID,
  p_delta INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.users
     SET donor_score = donor_score + p_delta,
         updated_at = NOW()
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_donation(
  p_alert_id UUID,
  p_response_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  donor_locked_until TIMESTAMP,
  alert_status public.alert_status_enum
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_response_status public.response_status_enum;
  v_alert_status public.alert_status_enum;
  v_units_needed INTEGER;
  v_units_fulfilled INTEGER;
  v_now TIMESTAMP := NOW();
  v_eligible_from TIMESTAMP;
  v_new_fulfilled INTEGER;
  v_new_score INTEGER;
  v_new_points INTEGER;
BEGIN
  SELECT dr.status
    INTO v_response_status
    FROM public.donation_responses AS dr
   WHERE dr.response_id = p_response_id
     AND dr.alert_id = p_alert_id
     AND dr.user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation response not found';
  END IF;

  IF v_response_status = 'Donated' THEN
    RAISE EXCEPTION 'This donation has already been confirmed';
  END IF;

  IF v_response_status NOT IN ('Accepted', 'Arrived') THEN
    RAISE EXCEPTION 'Donation cannot be confirmed from status: %', v_response_status;
  END IF;

  SELECT a.status, a.units_needed, a.units_fulfilled
    INTO v_alert_status, v_units_needed, v_units_fulfilled
    FROM public.alerts AS a
   WHERE a.alert_id = p_alert_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  v_eligible_from := v_now + INTERVAL '90 days';
  v_new_fulfilled := v_units_fulfilled + 1;
  v_alert_status := CASE
    WHEN v_new_fulfilled >= v_units_needed THEN 'Fulfilled'::public.alert_status_enum
    ELSE 'Active'::public.alert_status_enum
  END;

  UPDATE public.donation_responses
     SET status = 'Donated',
         confirmed_at = v_now,
         points_awarded = 100,
         score_delta = 10
   WHERE response_id = p_response_id;

  UPDATE public.users
     SET last_donated_at = v_now,
         eligible_from = v_eligible_from,
         is_eligible = FALSE,
         reward_points = reward_points + 100,
         donor_score = donor_score + 10,
         updated_at = v_now
   WHERE user_id = p_user_id
   RETURNING donor_score, reward_points
        INTO v_new_score, v_new_points;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  INSERT INTO public.score_events (
    user_id,
    response_id,
    event_type,
    points_delta,
    score_delta,
    score_after,
    points_after,
    reason
  ) VALUES (
    p_user_id,
    p_response_id,
    'Donated',
    100,
    10,
    v_new_score,
    v_new_points,
    'Donation confirmed by hospital'
  );

  UPDATE public.alerts
     SET units_fulfilled = v_new_fulfilled,
         status = v_alert_status,
         fulfilled_at = CASE WHEN v_alert_status = 'Fulfilled' THEN v_now ELSE NULL END,
         updated_at = v_now
   WHERE alert_id = p_alert_id;

  RETURN QUERY SELECT v_eligible_from, v_alert_status;
END;
$$;
