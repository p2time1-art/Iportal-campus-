# API Architecture

## Target API shape

The Laravel application should expose a versioned REST API so the React frontend communicates only with Laravel and never with MySQL directly.

```text
/api/v1
├── auth
├── schools
├── users
├── memberships
├── students
├── teachers
├── parents
├── classes
├── subjects
├── academics
├── attendance
├── results
├── assignments
├── finance
├── payments
├── notifications
├── announcements
├── admissions
├── reports
├── files
├── audit
└── platform
```

## Auth routes

### `/api/v1/auth`
- `POST /login` — authenticate user by login PIN or email + password
- `POST /logout` — revoke session or token
- `POST /refresh` — refresh token/session when applicable
- `GET /me` — current authenticated user
- `POST /change-password` — validate old password and update hash
- `POST /reset-password-request` — email reset token creation
- `POST /reset-password` — reset using token
- `POST /register` — onboarding signup flow if supported
- `GET /sessions` — current device/session list if multi-session is enabled

Authentication requirement: required for all routes except publicly exposed login/password reset flows.

## School and membership routes

### `/api/v1/schools`
- `GET /` — list schools accessible to platform admin or current user
- `POST /` — create school
- `GET /{school}` — fetch school details
- `PATCH /{school}` — update school info
- `DELETE /{school}` — soft delete if allowed

### `/api/v1/memberships`
- `GET /` — list memberships for current user or school context
- `POST /` — create membership
- `PATCH /{membership}` — update link/role/status
- `DELETE /{membership}` — deactivate or remove

Authorization: platform admin or school admin depending on scope.

## People and role routes

### `/api/v1/users`
- `GET /me`
- `GET /{user}` — if authorized
- `PATCH /{user}` — update profile or security metadata
- `GET /{user}/memberships` — school memberships

### `/api/v1/students`
- `GET /` — list students for active school
- `POST /` — create student
- `GET /{student}` — fetch profile
- `PATCH /{student}` — update student data
- `DELETE /{student}` — soft delete or archive

### `/api/v1/teachers`
- `GET /` — list teachers
- `POST /` — create teacher
- `GET /{teacher}` — fetch details
- `PATCH /{teacher}` — update profile

### `/api/v1/parents`
- `GET /` — list guardians
- `POST /` — create guardian
- `GET /{parent}` — profile
- `PATCH /{parent}` — update
- `GET /{parent}/children` — linked students

## Academic routes

### `/api/v1/classes`
- `GET /` — list classes for school
- `POST /` — create class
- `GET /{class}` — fetch class details
- `PATCH /{class}` — update

### `/api/v1/subjects`
- `GET /` — list subjects
- `POST /` — create subject
- `PATCH /{subject}` — update

### `/api/v1/academics`
- `GET /sessions` — list academic sessions
- `GET /terms`
- `GET /grading-schemes`
- `GET /results`
- `POST /results`
- `PATCH /results/{result}`

### `/api/v1/attendance`
- `GET /` — list attendance records
- `POST /` — mark attendance
- `PATCH /{attendance}` — update record
- `GET /reports` — summary per student/class

### `/api/v1/assignments`
- `GET /` — list assignments in school
- `POST /` — create assignment
- `GET /{assignment}` — fetch assignment details
- `POST /{assignment}/submit` — student submission
- `PATCH /{submission}` — grade submission

## Finance routes

### `/api/v1/finance`
- `GET /fee-categories`
- `GET /fee-structures`
- `GET /student-billing/{student}`
- `GET /student-accounts/{student}`
- `GET /analytics`

### `/api/v1/payments`
- `GET /` — list payment records
- `POST /` — record a payment or initiate gateway flow
- `GET /{payment}` — fetch details
- `POST /{payment}/reverse` — reverse or adjust payment
- `POST /online/initiate` — start gateway-based payment
- `POST /online/verify` — finalize verification callback

### `/api/v1/receipts`
- `GET /{receipt}`
- `POST /generate` if the app creates PDF or downloadable receipt

Authorization: school admin or finance role for payment processing; students/parents view only own records.

## Communication and public routes

### `/api/v1/announcements`
- `GET /` — list announcements visible to user
- `POST /` — create announcement
- `GET /{announcement}` — detail
- `PATCH /{announcement}` — update

### `/api/v1/notifications`
- `GET /` — current user notifications
- `PATCH /{notification}` — mark as read
- `DELETE /{notification}` — clear item

### `/api/v1/admissions`
- `GET /status`
- `POST /apply`
- `GET /applications`
- `PATCH /applications/{id}`
- `POST /applications/{id}/pay-fee`

These are public or applicant-scope endpoints and should remain behind proper validation and privacy rules.

## Reporting and audit routes

### `/api/v1/reports`
- `GET /school-overview`
- `GET /student-performance`
- `GET /teacher-analytics`
- `GET /platform-overview`

### `/api/v1/audit`
- `GET /logs` — admin/audit review
- `GET /logs/{id}` — detail

## File routes

### `/api/v1/files`
- `POST /upload`
- `GET /{document}`
- `DELETE /{document}`
- `GET /students/{student}/documents`
- `GET /applications/{application}/documents`

Requirements:
- validate file type and size
- store metadata in MySQL
- store actual binary content in configured object storage or disk
- restrict access by ownership or school scope

## Response conventions

Recommended success format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Recommended validation failure format:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": ["The field is required."]
  }
}
```

## Query conventions

- Use pagination for list endpoints.
- Support filters for `school_id`, `status`, `date`, user ID, and role if applicable.
- Accept sorting via query parameters such as `sort=created_at&direction=desc`.
- Keep JSON output resource-oriented and consistent with React UI usage.

## Enforcement requirements

- All endpoints require either authenticated session or token-based auth.
- Requests must check active school context before mutating school-owned data.
- Policy gates must enforce role/ownership conditions.
- No API route should perform direct database writes without through a service or domain action.

## Unknowns to verify before implementation

- Whether any routes should be public vs authenticated from a product requirement standpoint.
- Whether there are dedicated finance roles beyond school admin and platform admin.
- Whether direct school admin access is always enough, or whether some finance and reports require additional specialized roles.
