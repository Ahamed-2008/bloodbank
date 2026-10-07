# BloodConnect API Guide

## Base URL and Authentication

Local base URL: `http://localhost:3000/api/v1`. Send protected calls with `Authorization: Bearer <token>`. Firebase sign-in and demo sign-in return the same application JWT response shape. Application tokens last **7 days**. There is no refresh endpoint; on 401, send the user back to sign-in.

Demo sign-in is available only when `DEMO_AUTH_ENABLED=true` and the environment is not production. Use the seeded demo accounts only in a non-production environment.

| Account | Phone | OTP | Role |
|---|---|---|---|
| Donor 1 | `+919999900001` | `111111` | donor |
| Donor 2 | `+919999900002` | `111111` | donor |
| Hospital staff | `+919999900003` | `222222` | hospital_staff |
| Admin | `+919999900004` | `333333` | admin |

## Common Errors

The global exception filter returns `statusCode` and `message`. `message` can be a string or an array of strings (for validation failures); `statusCode` is always present. Nest may include an additional `error` field for HTTP exceptions.

```json
{"statusCode":400,"message":["blood_group must be a valid enum value"],"error":"Bad Request"}
```

Invalid or absent JWTs return 401. Calls from a role that is not authorized return 403. DTO validation failures return 400. Examples below show endpoint-specific messages where the service defines one.

## Endpoints

### GET /api/v1

**Role:** Public. **Body:** None.

**Example response:**
```json
"Hello World!"
```

**Errors:** No endpoint-specific errors are defined.

### GET /api/v1/health

**Role:** Public. **Body:** None.

**Example response:**
```json
{"status":"ok","time":"2026-10-06T10:00:00.000Z"}
```

**Errors:** No endpoint-specific errors are defined.

### POST /api/v1/auth/sign-in

**Role:** Public. **Body:** `idToken` string, required; Firebase ID token containing a verified phone number.

**Example body and response:**
```json
{"idToken":"<firebase-id-token>"}
```
```json
{"token":"<app-jwt>","isNewUser":false,"role":"donor"}
```

**Errors:** 400 `Firebase ID token does not contain a phone number.`; 400 `Failed to create user account.`; 401 `Invalid or expired Firebase ID token.`; 401 `Your admin account has been deactivated.`; 401 `Your staff account has been deactivated.`

### POST /api/v1/auth/demo-sign-in

**Role:** Public. **Body:** `phone` string, required; `otp` string, required.

**Example body and response:**
```json
{"phone":"+919999900001","otp":"111111"}
```
```json
{"token":"<app-jwt>","isNewUser":false,"role":"donor"}
```

**Errors:** 400 for DTO validation; 401 `Invalid demo credentials.` for either an unknown phone or incorrect OTP; 404 when demo auth is disabled; 500 `Demo user not seeded. Run the demo seed script.`

### GET /api/v1/users/profile

**Role:** donor (not role-enforced; staff/admin tokens get 404 User not found.) **Body:** None.

**Example response:**
```json
{"user_id":"<uuid>","phone":"+919999900001","name":"Demo Donor One","blood_group":"O+","date_of_birth":"1995-01-01","gender":"Other","is_eligible":true,"last_donated_at":null,"eligible_from":null,"donor_score":0,"tier":"Registered","reward_points":0,"aadhaar_verified":true,"health_verified":false,"notifications_enabled":true,"max_alert_radius_km":10,"created_at":"<timestamp>"}
```

**Errors:** 401 invalid or missing JWT; 404 `User not found.`

### PUT /api/v1/users/profile

**Role:** donor (not role-enforced; staff/admin tokens get 404 User not found.) **Body:** `name` string, required (2-100 characters, trimmed); `blood_group` string, required (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`); `date_of_birth` date string, required; `gender` string, required (`Male`, `Female`, `Other`).

**Example body and response:**
```json
{"name":"Asha Donor","blood_group":"O+","date_of_birth":"1995-01-01","gender":"Other"}
```
```json
{"user_id":"<uuid>","name":"Asha Donor","blood_group":"O+","date_of_birth":"1995-01-01","gender":"Other","is_eligible":true}
```

**Errors:** 400 `Donor must be between 18 and 65 years old.`; 400 `Failed to update profile.`; 400 for DTO validation; 401 invalid or missing JWT; 404 `User not found.`

### PUT /api/v1/users/location

**Role:** donor (not role-enforced; staff/admin tokens get 404 User not found.) **Body:** `latitude` number, required; `longitude` number, required; `pincode` string, required (6 characters); `city` string, optional; `state` string, optional.

**Example body and response:**
```json
{"latitude":12.9165,"longitude":79.1325,"pincode":"632001","city":"Vellore","state":"Tamil Nadu"}
```
```json
{"message":"Location updated successfully."}
```

**Errors:** 400 `Failed to update location.` or `Failed to save location.`; 400 for DTO validation; 401 invalid or missing JWT; 404 `User not found.`

### GET /api/v1/users/eligibility

**Role:** donor (not role-enforced; staff/admin tokens get 404 User not found.) **Body:** None.

**Example response:**
```json
{"is_eligible":true,"last_donated_at":null,"eligible_from":null,"donor_score":0,"tier":"Registered","days_until_eligible":null}
```

**Errors:** 401 invalid or missing JWT; 404 `User not found.`

### PUT /api/v1/users/notifications

**Role:** donor (not role-enforced; staff/admin tokens get 404 User not found.) **Body:** `notifications_enabled` boolean, required; `max_alert_radius_km` number, required (1-50).

**Example body and response:**
```json
{"notifications_enabled":true,"max_alert_radius_km":10}
```
```json
{"message":"Notification preferences updated successfully."}
```

**Errors:** 400 `Failed to update preferences.` or DTO validation; 401 invalid or missing JWT. **Code caveat:** this handler does not check whether an update matched a user row, so staff/admin tokens may receive success instead of 404.

### PUT /api/v1/users/availability

**Role:** donor. **Body:** `is_available` boolean, required.

**Example body and response:**
```json
{"is_available":true}
```
```json
{"message":"Availability updated successfully."}
```

**Errors:** 400 `Failed to update availability.` or DTO validation; 401 invalid or missing JWT; 403 role not allowed.

### POST /api/v1/hospitals/register

**Role:** Public. **Body:** `name` string (2-200), `registration_number` string (2-100), `hospital_type` enum (`Government`, `Private`, `Trust`, `Clinic`), `contact_name` string (2-100), `contact_phone` Indian phone string, `contact_email` email string, `latitude` and `longitude` numbers, `address` string, `pincode` string (6-10), `city` string, `state` string, `license_number` string, `license_issued_at` date string, `license_expires_at` date string. All fields are required.

**Example body and response:**
```json
{"name":"City Hospital","registration_number":"REG-1001","hospital_type":"Private","contact_name":"Hospital Admin","contact_phone":"+919888800005","contact_email":"admin@example.com","latitude":12.9165,"longitude":79.1325,"address":"Vellore","pincode":"632001","city":"Vellore","state":"Tamil Nadu","license_number":"LIC-1001","license_issued_at":"2024-01-01","license_expires_at":"2030-12-31"}
```
```json
{"message":"Hospital registered successfully. Awaiting admin verification.","hospital_id":"<uuid>"}
```

**Errors:** 400 `A hospital with this registration number already exists.`; 400 `Failed to register hospital.`; 400 `Failed to create staff account.`; 400 `Failed to save license details.`; 400 for DTO validation.

### GET /api/v1/hospitals/profile

**Role:** hospital staff. **Body:** None.

**Example response:**
```json
{"hospital_id":"<uuid>","name":"City General Hospital (Demo)","registration_number":"DEMO-VLR-001","hospital_type":"Government","contact_name":"Demo Hospital Admin","contact_phone":"+919999900003","contact_email":"demo-hospital@bloodconnect.test","address":"Demo Hospital Road","pincode":"632001","city":"Vellore","state":"Tamil Nadu","is_verified":true,"is_active":true,"hospital_verifications":[{"license_number":"DEMO-LICENSE-VLR-001","license_expires_at":"2030-12-31","status":"Approved"}]}
```

**Errors:** 401 invalid or missing JWT; 403 role not allowed; 404 `Hospital not found.`

### POST /api/v1/hospitals/staff

**Role:** hospital staff; the caller must have staff role `Admin`. **Body:** `name` string (2-100), `phone` Indian phone string, `role` enum (`Admin`, `Operator`), and optional `email` email string.

**Example body and response:**
```json
{"name":"Staff Member","phone":"+919999900005","email":"staff@example.com","role":"Operator"}
```
```json
{"message":"Staff member added successfully.","staff":{"staff_id":"<uuid>","name":"Staff Member","phone":"+919999900005","role":"Operator"}}
```

**Errors:** 400 `This phone number is already registered as staff.`; 400 `Failed to add staff member.`; 400 for DTO validation; 401 invalid or missing JWT; 403 `Only hospital admins can add staff members.` or role not allowed.

### GET /api/v1/hospitals/staff

**Role:** hospital staff. **Body:** None.

**Example response:**
```json
[{"staff_id":"<uuid>","name":"Demo Hospital Admin","phone":"+919999900003","email":"demo-hospital@bloodconnect.test","role":"Admin","is_active":true,"created_at":"<timestamp>"}]
```

**Errors:** 400 `Failed to fetch staff.`; 401 invalid or missing JWT; 403 role not allowed.

### POST /api/v1/alerts

**Role:** hospital staff. **Body:** `blood_group` enum, required (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`); `units_needed` integer, required (1-10); `urgency` enum, required (`Critical`, `High`, `Normal`); `department` enum, required (`Emergency`, `ICU`, `OT`, `GeneralWard`, `LabourRoom`, `BloodBank`, `Other`); `patient_ref` string, optional (1-50); `patient_condition` string, optional (1-500); `auto_expand_radius` boolean, optional; `radius_km` integer, optional (1-50).

**Example body and response:**
```json
{"blood_group":"O+","units_needed":1,"urgency":"Normal","department":"Emergency","patient_ref":"DEMO-001","patient_condition":"Demo alert","radius_km":10,"auto_expand_radius":false}
```
```json
{"message":"Alert posted successfully.","alert":{"alert_id":"<uuid>","hospital_id":"<uuid>","blood_group":"O+","units_needed":1,"units_fulfilled":0,"urgency":"Normal","department":"Emergency","patient_ref":"DEMO-001","status":"Active","expires_at":"<timestamp>"}}
```

**Errors:** 400 `An active alert for O+ blood already exists for your hospital.`; 400 `Failed to create alert.` or DTO validation; 401 invalid or missing JWT; 403 `Hospital must be verified and active to post alerts.` or role not allowed; 404 `Hospital not found.`

### GET /api/v1/alerts/hospital

**Role:** hospital staff. **Body:** None.

**Example response:**
```json
[{"alert_id":"<uuid>","blood_group":"O+","units_needed":1,"units_fulfilled":0,"urgency":"Normal","department":"Emergency","patient_ref":"DEMO-001","status":"Active","notified_count":2,"accepted_count":0,"expires_at":"<timestamp>","created_at":"<timestamp>"}]
```

**Errors:** 400 `Failed to fetch alerts.`; 401 invalid or missing JWT; 403 role not allowed.

### GET /api/v1/alerts/:id

**Role:** Any authenticated role. **Body:** None. Replace `:id` with an alert UUID.

**Example response:**
```json
{"alert_id":"<uuid>","blood_group":"O+","units_needed":1,"units_fulfilled":0,"urgency":"Normal","department":"Emergency","patient_ref":"DEMO-001","patient_condition":"Demo alert","status":"Active","radius_km":10,"notified_count":2,"accepted_count":0,"expires_at":"<timestamp>","created_at":"<timestamp>","hospitals":{"name":"City General Hospital (Demo)","city":"Vellore","address":"Demo Hospital Road"}}
```

**Errors:** 401 invalid or missing JWT; 404 `Alert not found.`

### GET /api/v1/alerts/:id/responses

**Role:** hospital staff belonging to the alert's hospital. **Body:** None.

**Example response:**
```json
[{"response_id":"<uuid>","status":"Accepted","accepted_at":"<timestamp>","eta_minutes":20,"arrived_at":null,"confirmed_at":null,"users":{"name":"Demo Donor One","blood_group":"O+","donor_score":0,"tier":"Registered"}}]
```

**Errors:** 400 `Failed to fetch responses.`; 401 invalid or missing JWT; 403 `You do not have access to this alert.` or role not allowed.

### PUT /api/v1/alerts/:id/confirm/:responseId

**Role:** hospital staff belonging to the alert's hospital. **Body:** None.

**Example response:**
```json
{"message":"Donation confirmed successfully.","donor_locked_until":"<timestamp>","alert_status":"Active"}
```

**Errors:** 400 `This donation has already been confirmed.`; 400 `Failed to confirm donation.`; 401 invalid or missing JWT; 403 `You do not have access to this alert.` or role not allowed; 404 `Donation response not found.`

### PUT /api/v1/alerts/:id/cancel

**Role:** hospital staff belonging to the alert's hospital. **Body:** `cancellation_reason` string, required (5-500 characters).

**Example body and response:**
```json
{"cancellation_reason":"Patient no longer requires this alert."}
```
```json
{"message":"Alert cancelled successfully."}
```

**Errors:** 400 `Alert cannot be cancelled. Current status: <status>` or DTO validation; 401 invalid or missing JWT; 403 `You do not have access to this alert.` or role not allowed.

### GET /api/v1/donations/active

**Role:** donor. **Body:** None.

**Example response:**
```json
{"is_eligible":true,"alerts":[{"alert_id":"<uuid>","blood_group":"O+","units_needed":1,"units_fulfilled":0,"urgency":"Normal","department":"Emergency","patient_condition":"Demo alert","status":"Active","expires_at":"<timestamp>","hospitals":{"name":"City General Hospital (Demo)","address":"Demo Hospital Road","city":"Vellore","pincode":"632001"}}]}
```

The service does not remove alerts the donor already accepted or declined. Any still-active, unexpired alert compatible with the donor can remain in this list after either action. `GET /api/v1/donations/history` lists donation responses and their statuses, but decline only updates an alert notification and does not create a donation response. There is no endpoint that returns only the donor's currently accepted alert together with its alert ID and response status.

**Errors:** 401 invalid or missing JWT; 403 `Please complete Aadhaar verification to view alerts.` or `Please update your location to view nearby alerts.`; 404 `Donor not found.`; 400 `Failed to fetch alerts.`

### GET /api/v1/donations/history

**Role:** donor. **Body:** None.

**Example response:**
```json
[{"response_id":"<uuid>","status":"Donated","accepted_at":"<timestamp>","arrived_at":"<timestamp>","confirmed_at":"<timestamp>","points_awarded":100,"alerts":{"blood_group":"O+","urgency":"Normal","department":"Emergency","hospitals":{"name":"City General Hospital (Demo)","city":"Vellore"}}}]
```

**Errors:** 400 `Failed to fetch donation history.`; 401 invalid or missing JWT; 403 role not allowed.

### GET /api/v1/donations/stats

**Role:** donor. **Body:** None.

**Example response:**
```json
{"donor_score":10,"tier":"Registered","reward_points":100,"total_donations":1,"no_shows":0,"last_donated_at":"<timestamp>","eligible_from":"<timestamp>","is_eligible":false,"days_until_eligible":90}
```

**Errors:** 401 invalid or missing JWT; 403 role not allowed; 404 `Donor not found.`

### POST /api/v1/donations/:alertId/accept

**Role:** donor. **Body:** `eta_minutes` integer, optional (1-120).

**Example body and response:**
```json
{"eta_minutes":20}
```
```json
{"message":"Alert accepted successfully. Please proceed to the hospital.","response_id":"<uuid>","hospital":{"name":"City General Hospital (Demo)","address":"Demo Hospital Road"},"eta_minutes":20}
```

**Errors:** 400 `This alert is no longer active. Current status: <status>`; 400 `This alert has expired.`; 400 `You have already responded to this alert.`; 400 `Failed to accept alert.`; 400 `Failed to update alert accepted count.`; 400 for DTO validation; 401 invalid or missing JWT; 403 `Please complete Aadhaar verification before accepting alerts.`; 403 `You are not eligible to donate at this time. Eligible from: <date>.`; 403 `Your blood group does not match this alert.`; 403 role not allowed; 404 `Donor not found.` or `Alert not found.`

### POST /api/v1/donations/:alertId/decline

**Role:** donor. **Body:** None.

**Example response:**
```json
{"message":"Alert declined."}
```

**Errors:** 400 `Failed to decline alert.`; 401 invalid or missing JWT; 403 role not allowed.

### PUT /api/v1/donations/:alertId/arrived

**Role:** donor. **Body:** None.

**Example response:**
```json
{"message":"Arrival confirmed. Please check in with hospital staff."}
```

**Errors:** 400 `Cannot mark arrived. Current status: <status>`; 401 invalid or missing JWT; 403 role not allowed; 404 `No accepted response found for this alert.`

### GET /api/v1/admin/dashboard

**Role:** admin. **Body:** None.

**Example response:**
```json
{"total_donors":2,"total_hospitals":1,"pending_hospitals":0,"active_alerts":1,"total_donations":0}
```

**Errors:** 401 invalid or missing JWT; 403 role not allowed.

### GET /api/v1/admin/hospitals

**Role:** admin. **Query:** `status` optional string enum (`Pending`, `Approved`, `Rejected`).

**Example URL and response:**
```text
GET /api/v1/admin/hospitals?status=Pending
```
```json
[{"hospital_id":"<uuid>","name":"Pending Vellore Hospital","registration_number":"PENDING-VLR-1001","hospital_type":"Private","contact_name":"Hospital Admin","contact_phone":"+919888800005","contact_email":"admin@example.com","city":"Vellore","state":"Tamil Nadu","is_verified":false,"is_active":false,"hospital_verifications":[{"verification_id":"<uuid>","license_number":"LIC-1001","status":"Pending","rejection_reason":null,"verified_at":null}]}]
```

**Errors:** 400 `Failed to fetch hospitals.`; 400 for an invalid `status`; 401 invalid or missing JWT; 403 role not allowed.

### GET /api/v1/admin/hospitals/:id

**Role:** admin. **Body:** None.

**Example response:**
```json
{"hospital_id":"<uuid>","name":"City General Hospital (Demo)","registration_number":"DEMO-VLR-001","hospital_type":"Government","city":"Vellore","state":"Tamil Nadu","is_verified":true,"is_active":true,"hospital_verifications":[{"license_number":"DEMO-LICENSE-VLR-001","status":"Approved"}],"hospital_staff":[{"staff_id":"<uuid>","name":"Demo Hospital Admin","phone":"+919999900003","role":"Admin","is_active":true}]}
```

**Errors:** 401 invalid or missing JWT; 403 role not allowed; 404 `Hospital not found.`

### PUT /api/v1/admin/hospitals/:id/approve

**Role:** admin. **Body:** None.

**Example response:**
```json
{"message":"Hospital approved successfully. Staff account activated."}
```

**Errors:** 400 `Hospital is already verified.`; 401 invalid or missing JWT; 403 role not allowed; 404 `Hospital not found.`

### PUT /api/v1/admin/hospitals/:id/reject

**Role:** admin. **Body:** `reason` string, required (10-500 characters).

**Example body and response:**
```json
{"reason":"License document could not be verified."}
```
```json
{"message":"Hospital rejected successfully."}
```

**Errors:** 400 `Cannot reject an already verified hospital.` or DTO validation; 401 invalid or missing JWT; 403 role not allowed; 404 `Hospital not found.`

### GET /api/v1/admin/donors

**Role:** admin. **Query:** `verified` optional string boolean (`true`, `false`); filters `aadhaar_verified`.

**Example URL and response:**
```text
GET /api/v1/admin/donors?verified=true
```
```json
[{"user_id":"<uuid>","name":"Demo Donor One","phone":"+919999900001","blood_group":"O+","is_eligible":true,"aadhaar_verified":true,"health_verified":false,"donor_score":0,"tier":"Registered","reward_points":0,"last_donated_at":null,"created_at":"<timestamp>"}]
```

**Errors:** 400 `Failed to fetch donors.`; 400 for a query value other than `true` or `false`; 401 invalid or missing JWT; 403 role not allowed.

### PUT /api/v1/admin/donors/:id/approve

**Role:** admin. **Body:** None.

**Example response:**
```json
{"message":"Donor approved successfully."}
```

**Errors:** 400 `Failed to approve donor.`; 401 invalid or missing JWT; 403 role not allowed; 404 `Donor not found.`

### PUT /api/v1/admin/donors/:id/reject

**Role:** admin. **Body:** `reason` string, required (10-500 characters).

**Example body and response:**
```json
{"reason":"Identity details did not match."}
```
```json
{"message":"Donor rejected successfully."}
```

**Errors:** 400 `Failed to reject donor.` or DTO validation; 401 invalid or missing JWT; 403 role not allowed; 404 `Donor not found.`

### GET /api/v1/admin/alerts

**Role:** admin. **Body:** None.

**Example response:**
```json
[{"alert_id":"<uuid>","blood_group":"O+","units_needed":1,"units_fulfilled":0,"urgency":"Normal","department":"Emergency","status":"Active","notified_count":2,"accepted_count":0,"expires_at":"<timestamp>","created_at":"<timestamp>","hospitals":{"name":"City General Hospital (Demo)","city":"Vellore"}}]
```

**Errors:** 400 `Failed to fetch alerts.`; 401 invalid or missing JWT; 403 role not allowed.

## Suggested Frontend Flows

### Donor
1. Sign in with `POST /api/v1/auth/sign-in` or demo `POST /api/v1/auth/demo-sign-in`.
2. Read and complete `GET` and `PUT /api/v1/users/profile`; save location with `PUT /api/v1/users/location`.
3. New donors cannot see alerts until an admin approves donor verification with `PUT /api/v1/admin/donors/:id/approve`; before approval, `GET /api/v1/donations/active` returns 403 because `aadhaar_verified` is false.
4. Set availability using `PUT /api/v1/users/availability` (`true` to be matched, `false` to pause matching); fetch alerts with `GET /api/v1/donations/active`.
5. Accept an alert with `POST /api/v1/donations/:alertId/accept`, or decline it with `POST /api/v1/donations/:alertId/decline`. Mark arrival with `PUT /api/v1/donations/:alertId/arrived`; check `GET /api/v1/donations/history`, `/stats`, and `/users/eligibility`.

### Hospital Staff
1. Register the hospital with `POST /api/v1/hospitals/register`.
2. An admin reviews it with `GET /api/v1/admin/hospitals?status=Pending` and approves using `PUT /api/v1/admin/hospitals/:id/approve`; approval activates the initial hospital staff account.
3. Hospital staff sign in using Firebase or demo sign-in, then inspect `GET /api/v1/hospitals/profile` and `/hospitals/staff`.
4. Post an alert with `POST /api/v1/alerts`; review it with `GET /api/v1/alerts/hospital`.
5. View donors at `GET /api/v1/alerts/:id/responses`; confirm a completed donation with `PUT /api/v1/alerts/:id/confirm/:responseId` or cancel an alert with `PUT /api/v1/alerts/:id/cancel`.

### Admin
1. Sign in and load `GET /api/v1/admin/dashboard`.
2. Review hospitals with `GET /api/v1/admin/hospitals` and `GET /api/v1/admin/hospitals/:id`; approve or reject them.
3. Review donors with `GET /api/v1/admin/donors?verified=false`; approve or reject donor verification.
4. Review alerts with `GET /api/v1/admin/alerts`.

## Alert Polling

Donors fetch new alerts using `GET /api/v1/donations/active`; push notifications are not implemented yet. Poll every 10-15 seconds while the donor is actively viewing alerts, and stop polling when the view is inactive.
