# iPortal Campus

A Secondary School Management Portal built with **React** (frontend), **Laravel** (API backend), and **MySQL** (database via XAMPP).

---

## Architecture Overview

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, React Router v6
- **Backend**: Laravel 10 REST API (`laravel-api/`), PHP 8.1+
- **Database**: MySQL / MariaDB (`iportal_campus_dev`) via XAMPP (port 3306)
- **API Proxy**: Vite dev server proxies `/api` directly to `http://127.0.0.1:8000`

---

## Quick Start (One-Click)

Double click `start-all.bat` in the project root:
- Checks & starts MySQL (XAMPP)
- Starts the Laravel API on `http://127.0.0.1:8000`
- Starts the React frontend on `http://localhost:5173`

---

## Manual Start

### 1. Start MySQL
Ensure MySQL is running in XAMPP (Control Panel or `C:\xampp\mysql_start.bat`).

### 2. Start Laravel API
```bash
cd laravel-api
php artisan serve --port=8000
```

### 3. Start React Frontend
In a separate terminal at the project root:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Database Setup & Migrations

The database is `iportal_campus_dev`.

To re-run migrations and seeders:
```bash
cd laravel-api
php artisan migrate
php artisan db:seed
```

---

## Test Accounts & Credentials

All test accounts use the password: `12345678`

| Role | Email | Login PIN / Platform PIN | Password |
|---|---|---|---|
| **Super Admin** | `test@mail.com` | `PL-SAD-TG27BI` | `12345678` |
| **Platform Admin** | `sad@example.test` | `PL-SAD-AA0001` | `12345678` |
| **School Admin** | `admin@example.test` | `DC-ADM-AA0001` | `12345678` |
| **Teacher** | `teacher@example.test` | `DC-TEA-TT0002` | `12345678` |
| **Student** | `student@example.test` | `DC-STU-SS0003` | `12345678` |
| **Parent** | `parent@example.test` | `DC-PAR-PP0004` | `12345678` |

---

## Running Automated Backend Tests

```bash
cd laravel-api
php artisan test
```
All unit and feature tests verify domain models, school access controls, and authentication.
