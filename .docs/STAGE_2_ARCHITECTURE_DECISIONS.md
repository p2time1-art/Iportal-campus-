# Stage 2 Architecture Decisions

## Executive summary

The existing application is a Base44-backed React project with app data and business logic expressed through Base44 entities and functions. The target architecture is a standard Laravel API with MySQL persistence, while the React frontend remains a JavaScript SPA that communicates with Laravel through JSON endpoints.

## Decisions

### 1. Keep the React SPA as the frontend shell
The frontend should remain a JavaScript React app. This preserves the UI and user experience while moving the backend and persistence layer to Laravel + MySQL.

### 2. Use Laravel as the sole backend authority
All state-changing logic, validation, role checks, file handling, payment logic, and data access should flow through Laravel. MySQL becomes the durable data layer. React never communicates with MySQL directly.

### 3. Model schools as the primary tenant boundary
The school context is the main isolation unit. School-owned records must always include `school_id`, even when a user is also globally identified at the user level.

### 4. Use `school_memberships` as the user-to-school relationship model
This replaces the current Base44 membership concept with a first-class Laravel Eloquent model. It is also the place where role, status, login-specific identifiers, and school context are resolved.

### 5. Preserve the existing role structure
The role model must support:
- `super_admin`
- `school_admin`
- `teacher`
- `student`
- `parent`

The Base44 repo clearly indicates these are the operational roles in the app.

### 6. Keep login PIN as an operational identifier, not the durable auth source of truth
The design maintains the current PIN concept while making the actual authentication credential the hashed password field in the user table. The PIN stays as a school-oriented identifier and routing aid.

### 7. Use policies and middleware for authorization
Authorization should not be scattered across controllers. It should be handled with policies plus middleware that check active school context and access rights.

### 8. Use a resource-based API contract
The React frontend should consume resource-structured API payloads, not raw database objects.

### 9. Store file metadata in MySQL, not binary content
Files are large and should be saved to a configured storage backend, while metadata like file name, path, owner, and relation remain in MySQL.

### 10. Use audit logs as append-only
Audit logs must record who did what, when, and which school/record context was involved. This is essential for account changes, admissions actions, payment events, and admin actions.

## Assumptions

- The platform supports multiple schools with independent data isolation.
- The existing Base44 entity set reflects real product domains, not merely prototype data.
- Role access and ownership are derived from school membership, user links, teacher assignments, and guardian-to-student relationships.
- Admission, finance, and device/session flows will be implemented as Laravel services/actions rather than direct controller logic.

## Unknowns / Requires verification

- Exact business rules for finance reversal and refund handling.
- Whether `SchoolMembership.login_pin` is the single source of truth or whether `users.login_pin` is the canonical field.
- Whether `super_admin` is platform-only or also linked to a school membership object in some cases.
- Whether there are additional hidden roles or custom permissions not visible in the current repo.
- Whether certain modules are actually school-specific or platform-shared at runtime.
- Whether applicant/public endpoints require first-class public access or only a restricted user context.

## Migration sequencing recommended

1. Laravel foundation and environment setup
2. Core database tables, migrations, and base models
3. Authentication and token/session layer
4. School membership and active-school context
5. user, student, teacher, parent, and admin flows
6. academic domain and reporting
7. finance and payment layer
8. public admissions and document handling
9. notifications and announcements
10. audit logging and security hardening
11. Base44 dependency removal and verification

## Risk areas

- Hidden role/permission logic in Base44 entities or functions may not be obvious from the UI alone.
- Some Base44 data is likely denormalized and may need a controlled normalization effort.
- Payment and admissions modules may involve external provider callbacks and therefore must be reviewed carefully in implementation stages.
- File/document handling and audit trails are sensitive and should be planned before implementation begins.

## Stop conditions and constraints

This stage intentionally does not perform:
- Laravel app creation
- database migration writing
- production data changes
- Base44 removal
- frontend behavior changes
- credential exposure

The design is complete as an architecture blueprint and is ready to inform implementation in Stage 3.
