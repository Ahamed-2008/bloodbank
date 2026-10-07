# BloodLink Connect

Build a modern responsive web frontend for a Blood Bank Management System called "BloodLink".

IMPORTANT:

- This is FRONTEND ONLY.

- An existing NestJS REST API backend already exists.

- Do NOT create a new backend.

- Do NOT create a new database.

- Do NOT replace or modify the backend architecture.

- For now, use realistic mock data for the UI and interactions.

- We will connect the existing backend APIs later.

TECHNOLOGY:

- React

- TypeScript

- Tailwind CSS

- Modern component-based architecture

- Responsive design for desktop, tablet and mobile

DESIGN:

Create a professional healthcare application rather than a generic admin dashboard.

Use a clean white/light background with a strong red blood-bank accent.

Use modern cards, subtle borders, rounded corners, clear typography and accessible contrast.

Use icons appropriately.

The UI should feel trustworthy, clean, modern and suitable for a real blood donation platform.

APPLICATION ROLES:

1. DONOR

2. HOSPITAL STAFF

3. ADMIN

PUBLIC PAGES:

1. Landing Page

- BloodLink branding

- Hero section explaining the platform

- Call to action for donors

- Call to action for hospitals

- How it works

- Benefits

- Emergency blood request messaging

- Footer

2. Phone Login

- Phone number input

- Continue button

- OTP verification screen

- Loading and error states

- Clean healthcare design

3. Hospital Registration

Create a complete hospital registration form with:

- Hospital name

- Registration number

- Hospital type

  - Government

  - Private

  - Trust

  - Clinic

- Contact name

- Contact phone

- Contact email

- Latitude

- Longitude

- Address

- Pincode

- City

- State

- License number

- License issued date

- License expiry date

DONOR APPLICATION:

Create a donor dashboard with:

1. Donor Dashboard

- Welcome message

- Blood group card

- Donation eligibility status

- Donation statistics

- Recent/active blood requests

- Quick actions

2. Active Blood Alerts

Each alert should display:

- Blood group required

- Urgency

- Hospital

- Location/distance

- Number of units required

- Request date/time

- Status

- Accept button

- Decline button

3. Alert Details

- Full blood request information

- Hospital information

- Location

- Required blood group

- Units

- Urgency

- Request status

- Accept / Decline actions

4. Donation History

- List/table of previous donations

- Hospital

- Date

- Blood group

- Status

5. Donation Statistics

Show useful donor statistics such as:

- Total donations

- Successful donations

- Current eligibility

- Last donation

- Next eligible date

Use attractive statistic cards and simple visualizations where appropriate.

6. Eligibility

- Show whether donor is currently eligible

- Explain eligibility status clearly

- Show relevant dates/information

7. Profile

Fields:

- Name

- Blood group

- Date of birth

- Gender

8. Location

Fields:

- Latitude

- Longitude

- Pincode

- City

- State

Include a clean location interface.

9. Notification Settings

- Enable/disable notifications

- Maximum alert radius in km

- Save settings

HOSPITAL STAFF APPLICATION:

1. Hospital Dashboard

- Hospital overview

- Active alerts

- Recent donor responses

- Quick action to create blood alert

- Useful statistics

2. Create Blood Alert

Create a form for hospital staff to create a blood request.

The form should have fields appropriate for:

- Blood group

- Units required

- Urgency

- Location/request information

- Any other fields required by the existing backend DTO

3. My Alerts

- List alerts created by the hospital

- Status

- Blood group

- Units

- Created date

- Response count

- View details

4. Alert Management

- Alert details

- View donor responses

- Confirm donation

- Cancel alert

- Show cancellation reason when applicable

5. Hospital Profile

Display hospital information in a professional profile layout.

6. Staff Management

- List existing staff

- Add staff

- Staff name

- Phone

- Email

- Role

  - Admin

  - Operator

ADMIN APPLICATION:

1. Admin Dashboard

Show:

- Overall system statistics

- Number of hospitals

- Pending hospital verifications

- Number of donors

- Active blood alerts

2. Hospital Verification

- List hospitals

- Filter by verification status

- View hospital details

- Approve hospital

- Reject hospital

- Rejection reason form

3. Donor Management

- List donors

- Search/filter donors

- Display useful donor information

4. Active Alerts

- List active blood alerts

- Show blood group, hospital, urgency and status

NAVIGATION:

Create role-specific navigation.

Donor:

- Dashboard

- Blood Alerts

- Donation History

- Statistics

- Eligibility

- Profile

- Settings

Hospital Staff:

- Dashboard

- Create Alert

- My Alerts

- Hospital Profile

- Staff Management

Admin:

- Dashboard

- Hospitals

- Donors

- Alerts

Use a responsive sidebar on desktop and appropriate mobile navigation.

AUTHENTICATION UI:

Create authentication state handling in the frontend architecture.

For now, mock authentication.

Support role-based routing for:

- donor

- hospital_staff

- admin

Create protected routes for authenticated pages.

UX REQUIREMENTS:

- Loading states

- Empty states

- Error states

- Success notifications/toasts

- Confirmation dialogs for destructive actions

- Form validation

- Responsive layouts

- Accessible buttons and inputs

- Consistent status badges

- Consistent blood group badges

- Good mobile experience

IMPORTANT:

Do not implement a new backend or database.

Do not invent a different application architecture.

Keep API integration isolated in a clean service/API layer so the existing NestJS backend can be connected later.

Use mock data only until API integration is implemented.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d20e029-bb06-40b4-b722-b664a7fb2747).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
