#!/usr/bin/env bash

BASE_URL="http://localhost:3000/api/v1"

FIREBASE_ID_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjZhYzkwNDdmNjcxMmZjZDVjZjY3YTMzMDc5NDFkOWZhNDIyODM5NTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmxvb2QtYmFuay1kM2ViNiIsImF1ZCI6ImJsb29kLWJhbmstZDNlYjYiLCJhdXRoX3RpbWUiOjE3ODc2Nzc4MzgsInVzZXJfaWQiOiJrVElJYkVMcVJHT2lPb0dhSDB0aWhyYUJ3T2UyIiwic3ViIjoia1RJSWJFTHFSR09pT29HYUgwdGlocmFCd09lMiIsImlhdCI6MTc4NzY3NzgzOCwiZXhwIjoxNzg3NjgxNDM4LCJwaG9uZV9udW1iZXIiOiIrOTE4ODA3MjEzMTM3IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJwaG9uZSI6WyIrOTE4ODA3MjEzMTM3Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGhvbmUifX0.IE697l3dEEMuPtDS9YD4oOxiW9oX0f3MnhRsZXOvcEURGJHHLkZtXJr-dopN5ZDsomIgJJpQlbeZGOZkQMAmYM6rPBuums9TccUfi5qWA2FQyXCA898rBAVsXiLXekdw30Zv6D34L-bU7XM4SRbojQImjfERXCOju-EvTyDFWb5tKw5g6t6x-s20TeGKH_7cSlBABgWPCyauHgPaOt1t3GSsUNJzID4MLbsv1GWq3t-x7fUVsWm5EfGdWQFZkF7mMvNCX90akSb_2vAS7bu1_L40-fRR1cJClhQ81SB0ssW2dPzgIxksH-UOb8_nB4RhPo4KyPXrpgo9zSje2hikIw"
DONOR_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNWYzMjljMC1iNGNlLTRlNjEtYmFiZi04NDcxZDUwZGE5NjYiLCJwaG9uZSI6Iis5MTc1Mzg4MzI2MzMiLCJyb2xlIjoiZG9ub3IiLCJpYXQiOjE3ODc2NzgxOTcsImV4cCI6MTc4ODI4Mjk5N30.3i8Ls6uva72UGnAD8bBasfDF6yJgrgVyFgYDbDKk8Nw"
HOSPITAL_STAFF_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQzZGM2ZS1iMThhLTRkMWMtYjU1NS04OTIyOWU0MTA5NDEiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTYiLCJyb2xlIjoiaG9zcGl0YWxfc3RhZmYiLCJob3NwaXRhbF9pZCI6IjVmYjVmMjljLTdkNTctNGY0ZS04YTBkLThlYTg5ZTg4ZGUyOSIsInN0YWZmX3JvbGUiOiJBZG1pbiIsImlhdCI6MTc4NzY3ODQzMiwiZXhwIjoxNzg4MjgzMjMyfQ.5amrE-jCSNuU7gnbYp7lwlnWqAEYV2sH0EGaVKd_odw"
ADMIN_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOGZkNjM2OC1hM2RkLTQ4NjktOTM1NS03NjU2NTExYmI5YmYiLCJwaG9uZSI6Iis5MTg4MDcyMTMxMzciLCJyb2xlIjoiYWRtaW4iLCJhZG1pbl9yb2xlIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc4NzY3NzkzNiwiZXhwIjoxNzg4MjgyNzM2fQ.d5JPfSxeCKR6kDlKWwDFqtgX1zdgWl4bPQPcxxoVxTE"

HOSPITAL_ID="5fb5f29c-7d57-4f4e-8a0d-8ea89e88de29"

request() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local body="${4:-}"

  printf '\n===== %s %s =====\n' "$method" "$path"

  if [[ -n "$body" && -n "$token" ]]; then
    curl -sS -i -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$body"
  elif [[ -n "$body" ]]; then
    curl -sS -i -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  elif [[ -n "$token" ]]; then
    curl -sS -i -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $token"
  else
    curl -sS -i -X "$method" "$BASE_URL$path"
  fi
  printf '\n'
}

request POST /auth/sign-in "" \
  "{\"idToken\":\"$FIREBASE_ID_TOKEN\"}"

request GET /users/profile "$DONOR_JWT"
request PUT /users/profile "$DONOR_JWT" \
  '{"name":"Test Donor","blood_group":"O+","date_of_birth":"2000-01-01","gender":"Other"}'
request PUT /users/location "$DONOR_JWT" \
  '{"latitude":12.9716,"longitude":77.5946,"pincode":"560001","city":"Bengaluru","state":"Karnataka"}'
request GET /users/eligibility "$DONOR_JWT"
request PUT /users/notifications "$DONOR_JWT" \
  '{"notifications_enabled":true,"max_alert_radius_km":10}'

request POST /hospitals/register "" \
  '{"name":"Test General Hospital","registration_number":"TEST-HOSP-001","hospital_type":"Private","contact_name":"Test Contact","contact_phone":"+919999999999","contact_email":"test-hospital@example.com","latitude":12.9716,"longitude":77.5946,"address":"1 Test Main Road, Bengaluru","pincode":"560001","city":"Bengaluru","state":"Karnataka","license_number":"TEST-LICENSE-001","license_issued_at":"2025-01-01","license_expires_at":"2030-01-01"}'
request GET /hospitals/profile "$HOSPITAL_STAFF_JWT"
request POST /hospitals/staff "$HOSPITAL_STAFF_JWT" \
  '{"name":"Test Operator","phone":"+919999999998","email":"test-operator@example.com","role":"Operator"}'
request GET /hospitals/staff "$HOSPITAL_STAFF_JWT"

request POST /alerts "$HOSPITAL_STAFF_JWT" \
  '{"blood_group":"O+","units_needed":1,"urgency":"Critical","department":"Emergency","patient_ref":"TEST-PATIENT-001","patient_condition":"Emergency blood requirement","auto_expand_radius":true,"radius_km":10}'
request GET /alerts/hospital "$HOSPITAL_STAFF_JWT"

ALERT_ID="$(curl -sS "$BASE_URL/alerts/hospital" \
  -H "Authorization: Bearer $HOSPITAL_STAFF_JWT" \
  | jq -r '[.[] | select(.status == "Active") | select((.expires_at | sub("\\.[0-9]+"; "") | sub("\\+00:00$"; "Z") | fromdateiso8601) > now)] | first.alert_id // empty')"

if [[ -z "$ALERT_ID" ]]; then
  printf 'No non-expired active alert was found for hospital %s.\n' "$HOSPITAL_ID" >&2
  exit 1
fi

request GET "/alerts/$ALERT_ID" "$DONOR_JWT"
request GET "/alerts/$ALERT_ID/responses" "$HOSPITAL_STAFF_JWT"

RESPONSE_ID="$(curl -sS "$BASE_URL/alerts/$ALERT_ID/responses" \
  -H "Authorization: Bearer $HOSPITAL_STAFF_JWT" \
  | jq -r '[.[] | select(.status == "Accepted" or .status == "Arrived")] | first.response_id // empty')"

if [[ -z "$RESPONSE_ID" ]]; then
  printf 'No accepted donor response was found for alert %s.\n' "$ALERT_ID" >&2
  exit 1
fi

request PUT "/alerts/$ALERT_ID/confirm/$RESPONSE_ID" "$HOSPITAL_STAFF_JWT"
request PUT "/alerts/$ALERT_ID/cancel" "$HOSPITAL_STAFF_JWT" \
  '{"cancellation_reason":"Test cancellation after endpoint verification"}'

request GET /donations/active "$DONOR_JWT"
request GET /donations/history "$DONOR_JWT"
request GET /donations/stats "$DONOR_JWT"
request POST "/donations/$ALERT_ID/accept" "$DONOR_JWT" \
  '{"eta_minutes":30}'
request POST "/donations/$ALERT_ID/decline" "$DONOR_JWT"
request PUT "/donations/$ALERT_ID/arrived" "$DONOR_JWT"

request GET /admin/dashboard "$ADMIN_JWT"
request GET "/admin/hospitals?status=all" "$ADMIN_JWT"
request GET "/admin/hospitals/$HOSPITAL_ID" "$ADMIN_JWT"
request PUT "/admin/hospitals/$HOSPITAL_ID/approve" "$ADMIN_JWT"
request PUT "/admin/hospitals/$HOSPITAL_ID/reject" "$ADMIN_JWT" \
  '{"reason":"Test rejection reason for endpoint verification"}'
request GET /admin/donors "$ADMIN_JWT"
request GET /admin/alerts "$ADMIN_JWT"