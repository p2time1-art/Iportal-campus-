# MySQL Database Architecture

## Core design principles

- Multi-tenant database design by `school_id` for all school-owned records.
- Platform-level records for `schools`, `subscriptions`, `platform_transactions`, and global admin configuration are not school-scoped.
- `users` stores the auth identity and base profile.
- `school_memberships` stores the relationship between a user and a school and defines the effective role in that tenant.
- Strong indices are required on tenant IDs, foreign keys, and role filters.
- Soft deletes are recommended for user-like and school-owned records, but not for immutable audit tables.

## Primary tables

### `users`
Purpose: canonical user identity for authentication and global profile data.

Key columns:
- `id` (UUID or big integer primary key)
- `email` (unique, nullable for special-case onboarding)
- `password_hash`
- `full_name`
- `phone`
- `status` (`active`, `invited`, `disabled`, `suspended`)
- `email_verified_at`
- `password_changed_at`
- `must_change_password`
- `login_pin` (or generated identifier if stored outside membership)
- `platform_pin`
- `active_school_id` nullable
- `active_role` nullable
- `is_school_admin` boolean
- `is_super_admin` boolean
- `last_login_at`
- `created_at`, `updated_at`, `deleted_at`

Indexes:
- unique index on `email`
- index on `status`
- index on `active_school_id`
- index on `active_role`
- index on `login_pin`

Relationships:
- has many `school_memberships`
- has many `audit_logs`
- may have one active `school_profile` per membership context

### `schools`
Purpose: tenant root for each school.

Key columns:
- `id`
- `name`
- `short_name`
- `code`
- `address`
- `email`
- `phone`
- `website`
- `status`
- `subscription_status`
- `timezone`
- `created_at`, `updated_at`, `deleted_at`

Indexes:
- unique index on `code`
- index on `status`

Relationships:
- has many `school_memberships`
- has many `students`, `teachers`, `subjects`, `classes`, `terms`, `announcements`, `payments`

### `school_memberships`
Purpose: joins users to schools and defines role/permissions within that school.

Key columns:
- `id`
- `user_id`
- `school_id`
- `role` (`super_admin`, `school_admin`, `teacher`, `student`, `parent`)
- `status` (`active`, `inactive`, `invited`, `suspended`)
- `is_primary`
- `login_pin`
- `user_pin`
- `user_email`
- `user_name`
- `permissions` (nullable JSON if custom grant list exists)
- `metadata` JSON
- `created_at`, `updated_at`, `deleted_at`

Indexes:
- composite unique on (`user_id`, `school_id`, `role`)
- index on (`school_id`, `role`, `status`)
- index on `login_pin`
- index on `user_email`

Relationships:
- belongs to `user`
- belongs to `school`
- one-to-many to student/teacher/guardian records as appropriate

### `roles`
Purpose: canonical platform role definitions.

Key columns:
- `id`
- `name`
- `slug`
- `description`
- `is_platform_role` boolean
- `created_at`, `updated_at`

Relationships:
- many-to-many with permissions
- used to normalize access rules for `school_memberships`

### `permissions`
Purpose: authorization model for granular access controls.

Key columns:
- `id`
- `name`
- `slug`
- `group`
- `description`

Relationships:
- many-to-many to roles and users (if custom direct grants are needed)

## Academic and enrollment tables

### `students`
Purpose: student profile within a school.

Key columns:
- `id`
- `school_id`
- `user_id` nullable
- `admission_number`
- `full_name`
- `email`
- `phone`
- `gender`
- `date_of_birth`
- `parent_guardian_id` nullable
- `status`
- `created_at`, `updated_at`, `deleted_at`

Indexes:
- composite unique on (`school_id`, `admission_number`)
- index on (`school_id`, `user_id`)
- index on email

### `teachers`
Purpose: teacher profile within a school.

Key columns:
- `id`
- `school_id`
- `user_id` nullable
- `staff_number`
- `full_name`
- `email`
- `phone`
- `status`
- `created_at`, `updated_at`, `deleted_at`

### `parent_guardians`
Purpose: parent/guardian profile within a school.

Key columns:
- `id`
- `school_id`
- `user_id` nullable
- `full_name`
- `email`
- `phone`
- `status`
- `created_at`, `updated_at`, `deleted_at`

### `guardian_relationships`
Purpose: relationship linking guardian to student.

Key columns:
- `id`
- `school_id`
- `guardian_id`
- `student_id`
- `relationship_type`
- `is_primary` boolean
- `created_at`, `updated_at`

Indexes:
- composite unique on (`school_id`, `guardian_id`, `student_id`)
- index on `student_id`

### `school_classes`
Purpose: class/section definitions.

Key columns:
- `id`
- `school_id`
- `name`
- `class_code`
- `level`
- `arm`
- `academic_session_id`
- `created_at`, `updated_at`, `deleted_at`

### `student_class_memberships`
Purpose: many-to-many mapping of students to classes.

Key columns:
- `id`
- `school_id`
- `student_id`
- `class_id`
- `academic_session_id`
- `created_at`, `updated_at`

### `subjects`
Purpose: academic subject catalog.

Key columns:
- `id`
- `school_id`
- `name`
- `code`
- `description`
- `created_at`, `updated_at`, `deleted_at`

### `teacher_assignments`
Purpose: teacher subjects/classes assignment records.

Key columns:
- `id`
- `school_id`
- `teacher_id`
- `subject_id`
- `class_id`
- `academic_session_id`
- `created_at`, `updated_at`

### `academic_sessions`
Purpose: academic periods.

Key columns:
- `id`
- `school_id`
- `name`
- `start_date`
- `end_date`
- `status`
- `created_at`, `updated_at`

### `terms`
Purpose: term/semester definitions inside an academic session.

Key columns:
- `id`
- `school_id`
- `academic_session_id`
- `name`
- `start_date`
- `end_date`
- `status`
- `created_at`, `updated_at`

### `grading_schemes`
Purpose: grading scale and grade configuration.

Key columns:
- `id`
- `school_id`
- `name`
- `description`
- `metadata` JSON
- `created_at`, `updated_at`, `deleted_at`

### `results`
Purpose: student assessment result records.

Key columns:
- `id`
- `school_id`
- `student_id`
- `teacher_id`
- `subject_id`
- `class_id`
- `term_id`
- `score`
- `grade`
- `remarks`
- `recorded_by`
- `created_at`, `updated_at`

### `attendance`
Purpose: attendance tracking.

Key columns:
- `id`
- `school_id`
- `student_id`
- `class_id`
- `teacher_id`
- `date`
- `status` (`present`, `absent`, `late`, `excused`)
- `remarks`
- `created_at`, `updated_at`

### `assignments`
Purpose: school assignment definitions.

Key columns:
- `id`
- `school_id`
- `teacher_id`
- `class_id`
- `subject_id`
- `title`
- `description`
- `due_date`
- `status`
- `created_at`, `updated_at`, `deleted_at`

### `assignment_submissions`
Purpose: submitted assignment responses.

Key columns:
- `id`
- `school_id`
- `assignment_id`
- `student_id`
- `file_url`
- `content`
- `score`
- `status`
- `submitted_at`
- `created_at`, `updated_at`

### `term_remarks`
Purpose: term summary remarks by teacher/admin.

Key columns:
- `id`
- `school_id`
- `student_id`
- `term_id`
- `teacher_id`
- `comment`
- `created_at`, `updated_at`

## Finance and billing tables

### `fee_categories`
Purpose: grouping of fee types.

Key columns:
- `id`
- `school_id`
- `name`
- `description`
- `status`
- `created_at`, `updated_at`

### `fee_structures`
Purpose: one-off or recurring charge definitions by class/student.

Key columns:
- `id`
- `school_id`
- `fee_category_id`
- `name`
- `amount`
- `auto_apply`
- `status`
- `created_at`, `updated_at`

### `student_charges`
Purpose: billable charges against a student.

Key columns:
- `id`
- `school_id`
- `student_id`
- `fee_structure_id` nullable
- `amount`
- `currency`
- `status`
- `due_date`
- `paid_at`
- `created_at`, `updated_at`

### `payments`
Purpose: payment records (school-level transactions).

Key columns:
- `id`
- `school_id`
- `student_id` nullable
- `user_id` nullable
- `amount`
- `currency`
- `payment_method`
- `gateway`
- `status`
- `reference_number`
- `paid_at`
- `created_at`, `updated_at`

### `payment_allocations`
Purpose: links payments to invoice/fee charges.

Key columns:
- `id`
- `school_id`
- `payment_id`
- `student_charge_id`
- `amount`
- `created_at`

### `online_payment_transactions`
Purpose: external gateway transaction records.

Key columns:
- `id`
- `school_id`
- `payment_id` nullable
- `gateway`
- `gateway_reference`
- `status`
- `request_payload` JSON
- `response_payload` JSON
- `created_at`, `updated_at`

### `receipts`
Purpose: generated payment documents.

Key columns:
- `id`
- `school_id`
- `payment_id`
- `receipt_number`
- `file_path`
- `issued_at`
- `created_at`, `updated_at`

### `subscriptions`
Purpose: platform or school subscription state.

Key columns:
- `id`
- `school_id` nullable
- `plan_name`
- `status`
- `start_date`
- `end_date`
- `amount`
- `created_at`, `updated_at`

### `platform_transactions`
Purpose: global platform-level transactions or billing events.

Key columns:
- `id`
- `school_id` nullable
- `reference`
- `type`
- `amount`
- `currency`
- `status`
- `metadata` JSON
- `created_at`, `updated_at`

### `payment_gateway_configs`
Purpose: gateway settings per school or platform.

Key columns:
- `id`
- `school_id` nullable
- `gateway_name`
- `public_key`
- `secret_key` (encrypted)
- `is_active`
- `metadata` JSON
- `created_at`, `updated_at`

## Communication and public portal tables

### `announcements`
Purpose: school communication posts.

Key columns:
- `id`
- `school_id`
- `author_id`
- `title`
- `body`
- `audience` (`all`, `students`, `teachers`, `parents`, `school_admin`)
- `published_at`
- `status`
- `created_at`, `updated_at`, `deleted_at`

### `notifications`
Purpose: user-facing in-app or push notification records.

Key columns:
- `id`
- `school_id`
- `user_id`
- `type`
- `title`
- `message`
- `read_at`
- `metadata` JSON
- `created_at`, `updated_at`

### `job_vacancies`
Purpose: recruitment / job openings.

Key columns:
- `id`
- `school_id` nullable
- `title`
- `description`
- `status`
- `closing_date`
- `created_at`, `updated_at`

### `job_applications`
Purpose: applications for positions.

Key columns:
- `id`
- `job_vacancy_id`
- `applicant_name`
- `email`
- `phone`
- `resume_path`
- `status`
- `created_at`, `updated_at`

### `admission_applications`
Purpose: student admission requests.

Key columns:
- `id`
- `school_id`
- `student_name`
- `email`
- `phone`
- `status`
- `application_data` JSON
- `submitted_at`
- `created_at`, `updated_at`

## Files and documents

### `documents`
Purpose: application and user document metadata.

Key columns:
- `id`
- `school_id` nullable
- `owner_model`
- `owner_id`
- `document_type`
- `file_name`
- `storage_disk`
- `storage_path`
- `mime_type`
- `size_bytes`
- `uploaded_by`
- `status`
- `created_at`, `updated_at`

Indexes:
- index on `owner_model`, `owner_id`
- index on `document_type`
- index on `school_id`

## Audit and system tables

### `audit_logs`
Purpose: immutable record of important administrative and security events.

Key columns:
- `id`
- `school_id` nullable
- `user_id` nullable
- `actor_user_id` nullable
- `event_type`
- `entity_type`
- `entity_id` nullable
- `old_values` JSON
- `new_values` JSON
- `ip_address`
- `user_agent`
- `created_at`

Indexes:
- index on `school_id`, `user_id`, `event_type`
- index on `entity_type`, `entity_id`

**Note**: This is a write-heavy append-only table and should not be soft-deleted.

### `system_logs`
Purpose: application and operational diagnostics.

Key columns:
- `id`
- `level`
- `source`
- `message`
- `context` JSON
- `created_at`

## Key design rules

1. All school-owned tables include `school_id` and enforce tenant scope through queries, middleware, and policies.
2. Only `users`, `roles`, `permissions`, and platform-level billing tables are not universally school-scoped.
3. Audit logs should be append-only and not edited in normal application flows.
4. File metadata belongs in MySQL; large files should live in a storage system such as local disk, S3, or a managed object store.
5. `school_memberships` is the central join table between identities and school contexts.
6. `login_pin` and `platform_pin` should be treated as operational identifiers, while actual auth uses secure password hashing through Laravel authentication.

## Known unknowns to verify during Stage 3

- Whether `SchoolMembership.login_pin` is the source of truth or `User.login_pin` is the canonical value.
- Whether a single `users` table is sufficient for platform and school-level records without a separate `admins` table.
- Whether `ParentGuardian` is modeled as a dedicated profile or simply a membership role with related child links.
- Whether admissions and job vacancies are truly school-scoped or can be platform-scoped for some institutions.
- Whether `role` is stored only in membership tables or also in a separate `roles` table with fine-grained permissions.
