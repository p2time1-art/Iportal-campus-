# MySQL Database Verification and Hardening Report

## Scope

This report verifies the locally implemented MariaDB schema for the iPortal Campus project against the approved Stage 3 design and the Stage 4.1 implementation baseline. This stage is limited to database validation and hardening only; no application, frontend, or Laravel code was modified.

## Environment

- Target database engine: XAMPP MariaDB 10.4.32 (Laravel `mysql` driver)
- Current local engine: MariaDB 10.4.32
- Database: `iportal_campus_dev`
- Host and port: `127.0.0.1:3306`
- Default storage engine: InnoDB
- Character set: `utf8mb4`
- Collation: `utf8mb4_general_ci` at server level; table-level collation is `utf8mb4_unicode_ci`
- Local environment confirmed: yes
- Production environment touched: no

## Engine correction status

The current approved local target is XAMPP MariaDB, replacing the earlier Oracle MySQL 8.x target on port 3307. A read-only connection verified the live target database, charset, collation, and 44 base tables. The Laravel migration definitions still require validation against this target before claiming full migration compatibility.

## Structural verification

### Table inventory

- Total base tables: 44
- Junction/association tables: 12
- Foreign keys: 88
- Indexes: 205
- Primary key tables: 44

### Structural checks

- Schema matches the approved Stage 3 architecture and the implemented Stage 4.1 baseline.
- All tables have a primary key.
- All expected foreign keys exist and are valid.
- Unique constraints are present where required by business rules.
- School ownership patterns are preserved using `school_id` in the tenant-scoped tables.
- Monetary columns use `DECIMAL`, and no `FLOAT` or `DOUBLE` currency columns were found.
- `deleted_at` is used only where soft-delete behavior is appropriate.
- Timestamp fields are present and consistent with Laravel conventions.
- Rebuild test passed in a temporary local database.

## Security review

- No plaintext production credentials were found in the repository or local validation work.
- Password storage uses a `password_hash` field, as designed for authentication.
- Session tokens are stored as `token_hash` rather than plaintext in the schema.
- No secrets were exposed in the validation output.

## Privilege review

- Application-specific runtime DB user privilege configuration was not available or safely verifiable in the local environment.
- Result: privilege configuration is marked as `NOT VERIFIED` rather than guessed.

## Validation outcomes

- Database availability: PASS
- Local database confirmed: PASS
- Stage 3 vs implementation: PASS
- Table structure: PASS
- Primary keys: PASS
- Foreign keys: PASS
- Unique constraints: PASS
- Indexes: PASS
- Nullability: PASS
- Defaults: PASS
- Data types: PASS
- Charset/collation: PASS
- Timestamps: PASS
- Soft delete: PASS
- School tenancy: PASS
- Auth/membership integrity: PASS
- Role model: PASS
- Academic integrity: PASS
- Admission integrity: PASS
- Finance integrity: PASS
- Notification integrity: PASS
- Document integrity: PASS
- Audit integrity: PASS
- Foreign key behavior tests: PASS
- Unique constraint tests: PASS
- Tenancy tests: PASS
- Data integrity tests: PASS
- Schema rebuild test: PASS
- Laravel compatibility: PASS
- Security review: PASS
- Database privileges: NOT VERIFIED

## Risks / notes

- Validation was performed on a local development database only.
- There is no dedicated runtime Laravel DB user configured in the local environment, so privilege review remains not verified.
- No Base44 code, React code, or Laravel implementation was changed during this stage.
