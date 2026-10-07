#!/usr/bin/env bash
# Re-run supabase/seeds/demo_seed.sql before each run; step 7 starts a cooldown and resets donor 1 eligibility.
set -u

BASE="${BASE:-http://localhost:3000/api/v1}"
BASE="${BASE%/}"
FAILURES=0
BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT
HTTP_STATUS="000"
BODY=""
DONOR_ONE_TOKEN=""
DONOR_TWO_TOKEN=""
STAFF_TOKEN=""
ALERT_ID=""
SECOND_ALERT_ID=""
RESPONSE_ID=""
BASELINE_SCORE="0"
BASELINE_DONATIONS="0"
RESULT=""

request() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local payload="${4:-}"
  local -a args=(-sS -o "$BODY_FILE" -w '%{http_code}' -X "$method")

  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$payload" ]]; then
    args+=(-H 'Content-Type: application/json' --data "$payload")
  fi

  HTTP_STATUS="$(curl "${args[@]}" "$BASE$path" 2>/dev/null)" || HTTP_STATUS="000"
  BODY="$(<"$BODY_FILE")"
}

pass() {
  printf 'PASS %s (HTTP %s)\n' "$1" "$HTTP_STATUS"
}

fail() {
  printf 'FAIL %s (HTTP %s)\nResponse: %s\n' "$1" "$HTTP_STATUS" "$BODY"
  FAILURES=$((FAILURES + 1))
}

login() {
  local label="$1"
  local phone="$2"
  local otp="$3"
  request POST /auth/demo-sign-in '' "$(jq -n --arg phone "$phone" --arg otp "$otp" '{phone: $phone, otp: $otp}')"
  if [[ "$HTTP_STATUS" == "200" ]] && jq -e '.token | strings | length > 0' >/dev/null 2>&1 <<<"$BODY"; then
    pass "$label login"
    RESULT="$(jq -r '.token' <<<"$BODY")"
  else
    fail "$label login"
    RESULT=""
  fi
}

create_alert() {
  local label="$1"
  local token="$2"
  local patient_ref="$3"
  request POST /alerts "$token" "$(jq -n --arg patient_ref "$patient_ref" '{blood_group:"O+", units_needed:1, urgency:"Normal", department:"Emergency", patient_ref:$patient_ref, patient_condition:"Demo smoke test", radius_km:10, auto_expand_radius:false}')"
  if [[ "$HTTP_STATUS" == "201" ]] && jq -e '.alert.alert_id | strings | length > 0' >/dev/null 2>&1 <<<"$BODY"; then
    pass "$label"
    RESULT="$(jq -r '.alert.alert_id' <<<"$BODY")"
  else
    fail "$label"
    RESULT=""
  fi
}

login 'Step 1a: donor 1' '+919999900001' '111111'
DONOR_ONE_TOKEN="$RESULT"
login 'Step 1b: donor 2' '+919999900002' '111111'
DONOR_TWO_TOKEN="$RESULT"
login 'Step 1c: hospital staff' '+919999900003' '222222'
STAFF_TOKEN="$RESULT"

request GET /donations/stats "$DONOR_ONE_TOKEN"
if [[ "$HTTP_STATUS" == "200" ]] && jq -e '.donor_score != null and .total_donations != null' >/dev/null 2>&1 <<<"$BODY"; then
  BASELINE_SCORE="$(jq -r '.donor_score // 0' <<<"$BODY")"
  BASELINE_DONATIONS="$(jq -r '.total_donations // 0' <<<"$BODY")"
  pass 'Step 1d: donor 1 baseline stats'
else
  fail 'Step 1d: donor 1 baseline stats'
fi

create_alert 'Step 2: staff creates O+ alert' "$STAFF_TOKEN" "demo-smoke-$(date +%s)"
ALERT_ID="$RESULT"

request GET /donations/active "$DONOR_ONE_TOKEN"
if [[ "$HTTP_STATUS" == "200" && -n "$ALERT_ID" ]] && jq -e --arg alert_id "$ALERT_ID" '.alerts | any(.[]; .alert_id == $alert_id)' >/dev/null 2>&1 <<<"$BODY"; then
  pass 'Step 3: donor 1 sees compatible alert'
else
  fail 'Step 3: donor 1 sees compatible alert'
fi

request GET /donations/active "$DONOR_TWO_TOKEN"
if [[ "$HTTP_STATUS" == "200" && -n "$ALERT_ID" ]] && jq -e --arg alert_id "$ALERT_ID" '(.alerts | any(.[]; .alert_id == $alert_id)) | not' >/dev/null 2>&1 <<<"$BODY"; then
  pass 'Step 4: donor 2 does not see incompatible alert'
else
  fail 'Step 4: donor 2 does not see incompatible alert'
fi

request POST "/donations/$ALERT_ID/accept" "$DONOR_ONE_TOKEN" '{"eta_minutes":20}'
if [[ "$HTTP_STATUS" == "200" ]] && jq -e '.response_id | strings | length > 0' >/dev/null 2>&1 <<<"$BODY"; then
  RESPONSE_ID="$(jq -r '.response_id' <<<"$BODY")"
  pass 'Step 5: donor 1 accepts alert'
else
  fail 'Step 5: donor 1 accepts alert'
fi

request GET "/alerts/$ALERT_ID/responses" "$STAFF_TOKEN"
if [[ "$HTTP_STATUS" == "200" && -n "$ALERT_ID" ]] && jq -e 'any(.[]; .users.name == "Demo Donor One")' >/dev/null 2>&1 <<<"$BODY"; then
  RESPONSE_ID="$(jq -r '.[] | select(.users.name == "Demo Donor One") | .response_id' <<<"$BODY" | head -n 1)"
  pass 'Step 6: staff sees donor 1 response'
else
  fail 'Step 6: staff sees donor 1 response'
fi

request PUT "/alerts/$ALERT_ID/confirm/$RESPONSE_ID" "$STAFF_TOKEN"
if [[ "$HTTP_STATUS" == "200" ]]; then
  pass 'Step 7: staff confirms donation'
else
  fail 'Step 7: staff confirms donation'
fi

request GET /donations/stats "$DONOR_ONE_TOKEN"
if [[ "$HTTP_STATUS" == "200" ]] && jq -e --argjson baseline_score "$BASELINE_SCORE" --argjson baseline_donations "$BASELINE_DONATIONS" '(.donor_score > $baseline_score) and (.total_donations > $baseline_donations)' >/dev/null 2>&1 <<<"$BODY"; then
  pass 'Step 8a: donor score and donation count increased'
else
  fail 'Step 8a: donor score and donation count increased'
fi

request GET /donations/history "$DONOR_ONE_TOKEN"
if [[ "$HTTP_STATUS" == "200" && -n "$RESPONSE_ID" ]] && jq -e --arg response_id "$RESPONSE_ID" 'any(.[]; .response_id == $response_id and .status == "Donated")' >/dev/null 2>&1 <<<"$BODY"; then
  pass 'Step 8b: history contains confirmed donation'
else
  fail 'Step 8b: history contains confirmed donation'
fi

request GET /users/eligibility "$DONOR_ONE_TOKEN"
if [[ "$HTTP_STATUS" == "200" ]] && jq -e '.is_eligible == false and (.eligible_from | strings | length > 0)' >/dev/null 2>&1 <<<"$BODY"; then
  ELIGIBLE_FROM="$(jq -r '.eligible_from' <<<"$BODY")"
  ELIGIBLE_EPOCH="$(date -d "$ELIGIBLE_FROM" +%s 2>/dev/null || printf '0')"
  NOW_EPOCH="$(date +%s)"
  if (( ELIGIBLE_EPOCH > NOW_EPOCH )); then
    pass 'Step 9: donor is ineligible with future cooldown'
  else
    fail 'Step 9: donor is ineligible with future cooldown'
  fi
else
  fail 'Step 9: donor is ineligible with future cooldown'
fi

create_alert 'Step 10a: staff creates second O+ alert' "$STAFF_TOKEN" "demo-smoke-second-$(date +%s)"
SECOND_ALERT_ID="$RESULT"
request POST "/donations/$SECOND_ALERT_ID/accept" "$DONOR_ONE_TOKEN" '{}'
if [[ "$HTTP_STATUS" == "403" ]]; then
  pass 'Step 10b: cooldown blocks donor 1 acceptance'
else
  fail 'Step 10b: cooldown blocks donor 1 acceptance'
fi

if [[ -n "$SECOND_ALERT_ID" ]]; then
  request PUT "/alerts/$SECOND_ALERT_ID/cancel" "$STAFF_TOKEN" '{"cancellation_reason":"Demo smoke cleanup"}'
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass 'Step 11: cancel second test alert for repeatable runs'
  else
    fail 'Step 11: cancel second test alert for repeatable runs'
  fi
fi

if (( FAILURES > 0 )); then
  printf 'FAIL: %s demo smoke step(s) failed.\n' "$FAILURES"
  exit 1
fi

printf 'PASS: all demo smoke steps completed.\n'
