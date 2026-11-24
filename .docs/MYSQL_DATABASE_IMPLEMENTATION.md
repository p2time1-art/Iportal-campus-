# MySQL Database Implementation

## Environment

- Current target engine: XAMPP MariaDB 10.4.32 through Laravel's `mysql` driver
- Current endpoint: `127.0.0.1:3306`
- Operating system: Windows 11 / XAMPP development environment
- Database name: `iportal_campus_dev`
- Character set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Storage engine: `InnoDB`

## Current status

Stage 4.1 is complete. The approved MySQL schema for the iPortal Campus platform was implemented and validated in the local development environment, and the database layer is ready for the Laravel model and migration stage.

The earlier Oracle MySQL 8.x target on port 3307 has been superseded. The active target is the existing XAMPP MariaDB instance on port 3306; no replacement database was created.

## Implementation summary

The Stage 3 architecture was applied to the local `iportal_campus_dev` database. The current MariaDB target is verified to contain 44 base tables and uses `utf8mb4` / `utf8mb4_unicode_ci`. Base44-backed frontend behavior remains for a separate migration stage.

## Schema verification

- Table count: 44
- Junction table count: 12
- Foreign key count: 88
- Index count: 205

## Validation results

The following checks were performed against `information_schema`:

- all expected tables exist
- all expected primary keys exist
- all expected foreign keys exist
- all expected indexes exist
- uniqueness constraints exist for required business keys and relationships
- school tenancy relationships are present on school-scoped tables
- currency fields use DECIMAL
- authentication and membership structures are present
- academic, finance, admission, notification, document, and audit tables are present

## Safe local integrity tests

Temporary test records were inserted in a local-only transaction to verify:

- valid school, user, and membership creation
- valid student and teacher profile creation
- valid guardian/student relationship
- valid fee payment and allocation flow
- valid notification recipient mapping
- rejection of invalid foreign key references
- rejection of duplicate unique records

All temporary rows were removed after validation.

## Deviations from Stage 3

No material deviations were required. The Stage 3 architecture was implemented as designed.

## Notes

- This is a local development database only.
- No Base44 frontend or backend logic was modified.
- No production database or data was touched.
- This stage is complete and is now followed by the Laravel model, migration, and seeder implementation stage.
