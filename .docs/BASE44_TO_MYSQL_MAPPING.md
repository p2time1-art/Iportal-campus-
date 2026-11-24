# Base44 → MySQL Mapping

This document maps the main Base44 entities found in the repo to the proposed MySQL schema and Laravel model structure. This is architecture-only guidance and should be validated in implementation stages.

| Base44 Entity | MySQL Table | Laravel Model | Laravel API Resource | Notes |
|---|---|---|---|---|
| User | `users` | `User` | `UserResource` | Direct mapping for auth identity and profile. Includes `active_school_id`, `active_role`, password metadata, and PIN metadata. |
| School | `schools` | `School` | `SchoolResource` | Tenant root object. |
| SchoolMembership | `school_memberships` | `SchoolMembership` | `SchoolMembershipResource` | Critical join model for multi-school membership and role scope. |
| Student | `students` | `Student` | `StudentResource` | School-scoped student profiles. |
| Teacher | `teachers` | `Teacher` | `TeacherResource` | School-scoped staff profile. |
| ParentGuardian | `parent_guardians` | `ParentGuardian` | `ParentGuardianResource` | Guardian identity per school context. |
| GuardianRelationship | `guardian_relationships` | `GuardianRelationship` | `GuardianRelationshipResource` | Links guardian and student. |
| SchoolClass | `school_classes` | `SchoolClass` | `SchoolClassResource` | Classroom/section catalog. |
| Subject | `subjects` | `Subject` | `SubjectResource` | Academic subject definitions. |
| AcademicSession | `academic_sessions` | `AcademicSession` | `AcademicSessionResource` | Academic year or term frame. |
| Term | `terms` | `Term` | `TermResource` | Term/semester-level definitions. |
| GradingScheme | `grading_schemes` | `GradingScheme` | `GradingSchemeResource` | Grading rules and metadata. |
| Result | `results` | `Result` | `ResultResource` | Student academic results. |
| Attendance | `attendance` | `Attendance` | `AttendanceResource` | Daily attendance marks. |
| Assignment | `assignments` | `Assignment` | `AssignmentResource` | Assignment definitions and metadata. |
| AssignmentSubmission | `assignment_submissions` | `AssignmentSubmission` | `AssignmentSubmissionResource` | Student assignment outputs. |
| TermRemark | `term_remarks` | `TermRemark` | `TermRemarkResource` | Teacher/admin remarks per student/term. |
| FeeCategory | `fee_categories` | `FeeCategory` | `FeeCategoryResource` | Billing category list. |
| FeeStructure | `fee_structures` | `FeeStructure` | `FeeStructureResource` | Base charges/structures. |
| StudentCharge | `student_charges` | `StudentCharge` | `StudentChargeResource` | Charge ledger for a student. |
| Payment | `payments` | `Payment` | `PaymentResource` | Payment records and status. |
| PaymentAllocation | `payment_allocations` | `PaymentAllocation` | `PaymentAllocationResource` | Allocation of payment to charges. |
| OnlinePaymentTransaction | `online_payment_transactions` | `OnlinePaymentTransaction` | `OnlinePaymentTransactionResource` | Gateway transaction state. |
| Receipt | `receipts` | `Receipt` | `ReceiptResource` | Payment proof or generated document. |
| Subscription | `subscriptions` | `Subscription` | `SubscriptionResource` | School platform plan status. |
| PlatformTransaction | `platform_transactions` | `PlatformTransaction` | `PlatformTransactionResource` | Platform billing ledger. |
| Notification | `notifications` | `Notification` | `NotificationResource` | User-facing system alerts. |
| Announcement | `announcements` | `Announcement` | `AnnouncementResource` | Communication item. |
| AuditLog | `audit_logs` | `AuditLog` | `AuditLogResource` | Security and admin event trail. |
| JobVacancy | `job_vacancies` | `JobVacancy` | `JobVacancyResource` | Recruitment listing. |
| JobApplication | `job_applications` | `JobApplication` | `JobApplicationResource` | Candidate applications. |
| AdmissionApplication | `admission_applications` | `AdmissionApplication` | `AdmissionApplicationResource` | Public school admission workflow. |
| Document | `documents` | `Document` | `DocumentResource` | Uploaded file metadata. |
| ClassAssignment | `teacher_assignments` or `class_assignments` | `TeacherAssignment` | `TeacherAssignmentResource` | May be normalized into teacher assignments + class membership depending on use. |
| Subscription | `subscriptions` | `Subscription` | `SubscriptionResource` | Platform billing state. |
| PaymentGatewayConfig | `payment_gateway_configs` | `PaymentGatewayConfig` | `PaymentGatewayConfigResource` | External payment gateway configuration. |

## Direct mapping notes

### Direct field mappings
These fields are likely to map with minimal transformation:
- `id` → primary key `id`
- timestamps → `created_at`, `updated_at`
- `status` → `status`
- `school_id` → `school_id`
- `user_id` → `user_id`
- `email` / `phone` / `name` / `full_name` → canonical user profile columns
- `amount`, `currency`, `fee_category_id`, `student_id` map directly to finance tables

### Fields requiring transformation
- PIN fields should be normalized into `users` and `school_memberships` without exposing them as primary auth secrets.
- `must_change_password`, `password_initialized`, and `password_changed_at` should be mapped into user security metadata.
- `metadata` or `properties` JSON fields should be stored in JSON columns for flexible schema extensions.
- `login_pin` and `user_pin` should be treated differently from the password; they are operational identifiers, not auth secrets.

### Fields requiring lookup normalization
- Some Base44 entities may require normalized lookup tables if they are heavily enumerated (e.g., `attendance.status`, `announcement.audience`, `payment.status`).
- Role codes `SAD`, `ADM`, `TEA`, `STU`, `PAR` should be represented in canonical roles and membership metadata.

### Fields not to migrate as-is
- Any runtime-only Base44 app configuration values that are not part of durable business data should not be migrated to MySQL.
- Base44 Vite plugin configuration and environment-specific client settings remain frontend/runtime concerns and should not be stored as MySQL data.

### Unknown or assumption-heavy mappings
- `ClassAssignment` is not fully clear from the repo alone; it may map to `teacher_assignments` or a more explicit `class_assignments` table depending on whether assignments are teacher-centric or class-centric.
- `ParentGuardian` needs confirmation of whether guardian records are modeled as user identities or school-profile records.
- `Payment` and `OnlinePaymentTransaction` may require a stricter ledger model if a single transaction is split across multiple charges.
- `PlatformTransaction` may hold both billing and gateway-transaction data and may need a dedicated normalization layer.

## Proposed Laravel model conventions

- `User` => `users`
- `School` => `schools`
- `SchoolMembership` => `school_memberships`
- `Student` => `students`
- `Teacher` => `teachers`
- `ParentGuardian` => `parent_guardians`
- `GuardianRelationship` => `guardian_relationships`
- `SchoolClass` => `school_classes`
- `Subject` => `subjects`
- `AcademicSession` => `academic_sessions`
- `Term` => `terms`
- `Result` => `results`
- `Attendance` => `attendance`
- `Assignment` => `assignments`
- `AssignmentSubmission` => `assignment_submissions`
- `FeeCategory` => `fee_categories`
- `FeeStructure` => `fee_structures`
- `StudentCharge` => `student_charges`
- `Payment` => `payments`
- `PaymentAllocation` => `payment_allocations`
- `Notification` => `notifications`
- `Announcement` => `announcements`
- `AuditLog` => `audit_logs`
- `Document` => `documents`

## Recommended validation during implementation

Before writing migrations, each mapping should be confirmed against:
- actual UI usage
- form submissions
- report generation
- finance reconciliation
- notification audience rules
- onboarding output and PIN usage
- role assignment rules

This is a design-level mapping, not a guarantee that all fields will remain unmodified once the data model is normalized for production use.
