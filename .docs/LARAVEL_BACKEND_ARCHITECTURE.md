# Laravel Backend Architecture

## Objective

Design the Laravel API layer that replaces the current Base44 backend while preserving the existing school-management domain behavior. This architecture is intentionally design-only and does not create the app yet.

## Target runtime architecture

```text
React SPA
   │ HTTPS / JSON API
   ▼
Laravel API
   │
   ├── Auth + session management
   ├── Role + school authorization
   ├── Request validation
   ├── Service layer business logic
   ├── Job / queue processing
   ├── Notification delivery
   ├── File/document handling
   ├── Audit logging
   └── MySQL access
            │
            ▼
          MySQL
```

## Laravel app structure

```text
app/
├── Console/
├── Exceptions/
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   │   ├── AuthController.php
│   │   │   ├── SchoolController.php
│   │   │   ├── UserController.php
│   │   │   ├── StudentController.php
│   │   │   ├── TeacherController.php
│   │   │   ├── ParentController.php
│   │   │   ├── AcademicController.php
│   │   │   ├── FinanceController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── ReportController.php
│   │   │   └── AuditController.php
│   ├── Middleware/
│   │   ├── EnsureSchoolContext.php
│   │   ├── EnsureTenantAccess.php
│   │   ├── RequireActiveSchoolMembership.php
│   │   └── ThrottleAuthAttempts.php
│   ├── Requests/
│   │   ├── Auth/
│   │   ├── School/
│   │   ├── User/
│   │   └── Finance/
│   ├── Resources/
│   │   ├── SchoolResource.php
│   │   ├── UserResource.php
│   │   ├── StudentResource.php
│   │   └── PaymentResource.php
│   └── Routes/
│       └── api.php
├── Models/
│   ├── User.php
│   ├── School.php
│   ├── SchoolMembership.php
│   ├── Student.php
│   ├── Teacher.php
│   ├── ParentGuardian.php
│   ├── ClassRoom.php
│   ├── Subject.php
│   ├── Attendance.php
│   ├── Result.php
│   ├── FeeCategory.php
│   ├── Payment.php
│   ├── Announcement.php
│   └── AuditLog.php
├── Services/
│   ├── AuthService.php
│   ├── SchoolContextService.php
│   ├── UserMembershipService.php
│   ├── StudentService.php
│   ├── FinanceService.php
│   ├── PaymentGatewayService.php
│   ├── NotificationService.php
│   ├── DocumentService.php
│   └── ReportingService.php
├── Policies/
│   ├── SchoolPolicy.php
│   ├── UserPolicy.php
│   ├── StudentPolicy.php
│   ├── TeacherPolicy.php
│   ├── ParentPolicy.php
│   ├── PaymentPolicy.php
│   └── AnnouncementPolicy.php
├── Actions/
│   ├── OnboardUserAction.php
│   ├── CreateSchoolMembershipAction.php
│   ├── RecordPaymentAction.php
│   └── PublishAnnouncementAction.php
├── Jobs/
│   ├── SendNotificationJob.php
│   ├── GenerateReportJob.php
│   └── SyncFinanceExportJob.php
├── Notifications/
│   ├── PasswordResetNotification.php
│   ├── PaymentReceivedNotification.php
│   └── AnnouncementNotification.php
├── Events/
│   ├── UserLoggedIn.php
│   ├── PaymentRecorded.php
│   └── SchoolMembershipChanged.php
├── Listeners/
│   ├── AuditUserLogin.php
│   └── CreatePaymentAuditTrail.php
├── Support/
│   ├── SchoolScope.php
│   ├── PinGenerator.php
│   ├── ResponseFormatter.php
│   └── FileStoragePathResolver.php
└── Providers/
    ├── AppServiceProvider.php
    ├── AuthServiceProvider.php
    ├── RouteServiceProvider.php
    └── PolicyServiceProvider.php
```

## Responsibilities by layer

### Controllers
Controllers should remain thin and delegate to services. They validate route-level requirements and return API resources or formatted responses.

### Requests
Requests enforce repeated validation rules for login, onboarding, membership updates, payment operations, school setup, profile updates, and file upload workflows.

### Resources
Resources shape outbound JSON for the React frontend. They should hide internal storage details and normalize data across modules.

### Models
Models represent domain entities and their relationships. They should be responsible for Eloquent relations, scopes, and localized query methods, not bespoke business logic.

### Services
Services encapsulate business logic such as:
- user onboarding and login PIN assignment
- school membership creation and activation
- student or parent record retrieval under active school scope
- payment processing
- fee allocation logic
- statement generation
- reporting
- notification dispatch
- document upload metadata handling

### Policies
Policies enforce school scope, ownership, and role-based access for each domain entity. These are the key enforcement point for multi-tenant isolation.

### Actions
Actions are useful for durable workflows that include validation, audit record creation, and domain-side orchestration. This is useful for admissions, user onboarding, finance posting, and announcement publishing.

### Jobs / Queue
Long-running or asynchronous tasks should run through queues for email, reports, notifications, or generated documents.

### Notifications
Laravel notifications can drive email, in-app notification, or SMS flows for password reset, payment events, announcements, and account state changes.

### Events / Listeners
Events should represent important domain changes so audit records, notifications, and downstream state updates can be triggered without tightly coupling controllers/services.

## Domain modules to preserve from current app

### Authentication and identity
- login and password model
- PIN-based identifier flow
- current user resolution
- school membership context
- active role selection
- first-login password change enforcement

### School administration
- platform users
- schools
- admin accounts
- membership management
- user onboarding
- audit logs

### Academic operations
- students
- teachers
- parents/guardians
- classes and sections
- subjects
- sessions / terms
- results
- attendance
- assignments
- remarks

### Finance and billing
- fee structures
- fee categories
- student billing
- payment channels
- payment records
- online payment status
- refunds / reversals
- payment allocation

### Public admissions and applicant flow
- application forms
- checks for application status
- required documents
- admissions
- fee payment for applications

### Communication
- announcements
- notifications
- public information pages

### Reporting and analytics
- school dashboards
- platform dashboards
- performance reports

## Recommended architectural principles

1. Controllers never directly mutate business data.
2. All access is scoped to school or platform context.
3. Authorization is enforced by policies and middleware, not by UI assumptions.
4. The service layer owns business rules and validation workflows.
5. Audit logging is centralized and attached to key domain actions.
6. Every upload gets metadata in MySQL and storage in a configured disk.
7. MySQL stores durable state; React only consumes API responses.
8. Base44 remains a migration dependency only until Laravel replaces it; no runtime Base44 dependency should remain in the future architecture.

## Assumed implementation style

This design assumes a standard Laravel 10/11 style application using:
- Eloquent ORM
- policy-based authorization
- middleware for active school/context enforcement
- API route groups under /api/v1
- resource-based JSON responses
- queue workers for async jobs
- storage disks for uploads and generated files

## Known non-goals for this design stage

- No Laravel app scaffolding is created here.
- No database migrations are written here.
- No Base44 code removal occurs here.
- No production secrets are introduced.
- No UI behavior is changed.
