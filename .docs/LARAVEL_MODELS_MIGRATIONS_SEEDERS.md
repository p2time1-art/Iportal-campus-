# Stage 4 — Laravel Models, Migrations & Seeders

## Status

**COMPLETE — canonical Laravel domain models, migrations, seeders, and local MySQL verification are complete.**

The confirmed local Oracle MySQL target `iportal_campus_dev` was created empty, then populated with all 44 canonical domain tables by the five iPortal migrations. Live metadata matches all 422 canonical columns, including their types and nullability, and contains 88 foreign keys and 26 unique indexes. Role and permission reference data was seeded and database-backed Eloquent relations were verified in a rolled-back transaction.

No existing data was reset, dropped, or truncated. A Sanctum package migration ran automatically during the first migration attempt and created an additional empty `personal_access_tokens` table. Sanctum auto-migration is now disabled for future environments. The existing table and its migration-history record are intentionally preserved because cleanup was not authorized.

## Runtime and environment

- Laravel: `10.50.3`
- PHP: `8.1.25`
- Composer: `2.8.2`
- PHP PDO MySQL driver: available
- Composer dependencies: `composer install` completed from the lock file; `vendor/autoload.php` is present and Artisan runs
- Current database server: XAMPP MariaDB `10.4.32`, reachable at `127.0.0.1:3306`
- Laravel database target: `mysql` driver, `iportal_campus_dev`, `127.0.0.1:3306`
- Current authentication and database identity were verified with a read-only connection; the target reports `utf8mb4` / `utf8mb4_unicode_ci` and 44 base tables.
- Historical Stage 4 verification used Oracle MySQL 8.0.46 on port 3307; that target is superseded and is no longer the active project configuration.
- Imagick and Redis PHP extensions: missing but optional for the checked Laravel configuration. Artisan, unit tests, and the frontend build run without them.
- The Laravel local `.env` is ignored by Git; keep database credentials private in that file and never commit or share them.

## Canonical schema review

`docs/MYSQL_SCHEMA.sql` remains the source of truth. Static comparison of that schema with the Laravel migration definitions found:

- 44 canonical tables and 44 Laravel `Schema::create` definitions
- 422 columns represented
- 88 foreign-key declarations, with matching referenced columns and delete actions
- 26 unique-key column sets
- 26 explicit secondary-index column sets
- Matching base data types, lengths, enum members, and nullability

The live schema was also checked against the canonical SQL: all 44 tables and 422 columns were present, with matching column types and nullability. The live database reports 88 foreign keys and 26 unique indexes, matching the canonical declarations. MySQL additionally reports 78 non-unique indexes because InnoDB creates supporting indexes for foreign keys beyond the 26 explicitly declared secondary indexes.

## Migrations

The five domain migration files are retained:

1. `laravel-api/database/migrations/2026_10_09_000001_create_iportal_core_tables.php`
2. `laravel-api/database/migrations/2026_10_09_000002_create_iportal_academic_tables.php`
3. `laravel-api/database/migrations/2026_10_09_000003_create_iportal_finance_tables.php`
4. `laravel-api/database/migrations/2026_10_09_000004_create_iportal_communication_tables.php`
5. `laravel-api/database/migrations/2026_10_09_000005_create_iportal_audit_tables.php`

The default Laravel scaffold migrations for its separate `users`, `password_reset_tokens`, `failed_jobs`, and `personal_access_tokens` tables were removed because those tables are not in the canonical 44-table schema. The canonical `users` table is created by the iPortal core migration. The Sanctum dependency remains available, but token-table/auth integration and database-backed password-reset or queue tables are deferred until they are reconciled with the canonical schema.

All five iPortal migrations completed, and `php artisan migrate:status` reports them as ran. The academic migration now uses short explicit names for its composite unique indexes and can resume its known partial-application state by preserving existing tables and repairing missing constraints. This recovery path was needed after MySQL rejected the original overlong generated constraint name.

Sanctum normally auto-loads a migration for `personal_access_tokens`, even when that migration is not published under the application migration directory. `AppServiceProvider` now calls `Sanctum::ignoreMigrations()` because token storage is not part of the canonical schema. The table created on this database during the initial attempt remains untouched as requested.

## Eloquent models

There is one Eloquent model for each canonical table. `IportalModel` provides the shared auto-incrementing `BIGINT id` mapping and guards the primary key from mass assignment.

| Domain | Models |
|---|---|
| Core and identity | `School`, `Role`, `Permission`, `RolePermission`, `User`, `UserSession`, `SchoolMembership` |
| Academic | `Student`, `Teacher`, `ParentGuardian`, `GuardianRelationship`, `AcademicSession`, `Term`, `SchoolClass`, `Subject`, `TeacherAssignment`, `StudentClassMembership`, `GradingScheme`, `GradingSchemeComponent`, `Result`, `Attendance`, `Assignment`, `AssignmentSubmission`, `TermRemark` |
| Finance | `FeeCategory`, `FeeStructure`, `StudentCharge`, `Payment`, `PaymentAllocation`, `OnlinePaymentTransaction`, `Receipt`, `Subscription`, `PlatformTransaction`, `PaymentGatewayConfig` |
| Communication and admissions | `Announcement`, `Notification`, `NotificationRecipient`, `JobVacancy`, `JobApplication`, `AdmissionApplication`, `Document`, `AdmissionDocument` |
| Audit | `AuditLog`, `SystemLog` |

Relationships cover school memberships, role permissions, teacher assignments, student class enrollments, guardian/child links, academic records, payments/allocations/receipts, notifications/recipients, admission documents, and audit actors. Natural-key role membership is mapped through `school_memberships.role` to `roles.slug`. No separate grading-boundary model was added because the canonical schema represents score boundaries in `grading_scheme_components`.

Models include schema-aligned date, datetime, boolean, JSON/array, integer, and decimal casts. Soft deletes are enabled only for tables that have `deleted_at`. Models with only `created_at` disable automatic `updated_at` writes. Password hashes, PIN fields, session token hashes, and encrypted payment-gateway secrets are hidden as appropriate.

## Seeders and development fixtures

- `RoleAndPermissionSeeder` defines role identifiers `SAD`, `ADM`, `TEA`, `STU`, and `PAR`, baseline domain permissions, and role-permission assignments. It is restricted to `APP_ENV=local`.
- `DevelopmentDataSeeder` is opt-in only with `APP_ENV=local` and `IPORTAL_SEED_DEVELOPMENT_DATA=true`. It creates example.test users, one development school, memberships for ADM/TEA/STU/PAR, an academic session, term, class, subject, teacher assignment, student enrollment, and parent-child link. SAD is platform-scoped and has no school membership.
- Seeded passwords are random and hashed with Laravel's hasher. They are not emitted or embedded as plaintext. No real user or production credentials are seeded.
- `DatabaseSeeder` will not run outside local. It was run successfully against this local database; it seeded 5 roles, 34 permissions, and 78 role-permission assignments.
- The optional `DevelopmentDataSeeder` was not run; `IPORTAL_SEED_DEVELOPMENT_DATA` remains `false`. The relationship smoke test used temporary records inside a transaction and rolled it back; no demo users or schools remain.

Factories are provided for `User`, `School`, `Student`, `Teacher`, `ParentGuardian`, and `Payment`.

## Verification performed

Passed:

- `composer validate --no-check-publish --no-interaction`
- `composer check-platform-reqs` — all declared platform requirements passed
- `php artisan --version`
- `php artisan about`
- `php artisan test` — 6 tests passed, 198 assertions
- `php -l` syntax checks across 82 Laravel application, database, and test files
- `php artisan migrate --no-interaction` — all five iPortal migrations completed
- `php artisan migrate:status --no-interaction` — all five iPortal migrations show `Ran`
- Live metadata comparison — 44 canonical tables, 422 columns, zero column type/nullability mismatches, 88 foreign keys, and 26 unique indexes
- Database-backed relation smoke test — school membership to role, user role-definition pivot, school members pivot, and seeded role permissions all passed; test records were rolled back
- `php artisan db:seed --no-interaction` — local role/permission seed completed
- Static migration coverage and schema comparison described above
- `npm run build` — React build completed; Vite reported the existing missing Base44 app-id/proxy environment and a large-chunk warning
- Git ignore check confirmed `laravel-api/.env` is not tracked

Optional follow-up: explicitly opt into local demo fixtures by setting `IPORTAL_SEED_DEVELOPMENT_DATA=true` in the ignored `.env` and running `php artisan db:seed`. Keep the flag disabled when demo records are not wanted.
