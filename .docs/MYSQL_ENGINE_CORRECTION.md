# Database Engine Target Update

## Objective

The current development target is the existing XAMPP MariaDB instance, accessed by Laravel through its `mysql` driver.

## Current local environment

- Local database engine: XAMPP MariaDB 10.4.32
- Database name in use: `iportal_campus_dev`
- Host and port: `127.0.0.1:3306`
- Character set and collation: `utf8mb4` / `utf8mb4_unicode_ci`

## Result

The previous Oracle MySQL 8.x target on port `3307` is superseded and is not an active project target.

## Safe action taken

- Verified access to the existing MariaDB target and confirmed `iportal_campus_dev` has 44 base tables.
- No database was created, dropped, reset, or truncated.

## Required next action

The five Laravel migrations still need non-destructive compatibility verification against this MariaDB target. Base44-backed application features remain a separate migration task. Continue using [docs/MYSQL_SCHEMA.sql](./MYSQL_SCHEMA.sql) as the canonical schema reference.
