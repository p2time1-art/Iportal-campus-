# Milestone 9.1 — PIN as Initial Default Password & First-Login Password Change

## Summary

This milestone implements secure onboarding for new user accounts by using the generated platform PIN as the initial login password, with a mandatory first-login password change enforced through a dedicated UI flow.

---

## What Was Implemented

### 1. User Entity Schema Updates
Added three new fields to the `User` entity (`base44/entities/User.jsonc`):
- **`must_change_password`** (boolean, default `false`) — Set to `true` when the user's initial password is their PIN. Drives the first-login redirect.
- **`password_initialized`** (boolean, default `false`) — Indicates the auth account was created with an initial password (PIN).
- **`password_changed_at`** (date-time) — Timestamp of the user's most recent password change.

### 2. Onboarding Flow (`base44/functions/onboardUser/entry.ts`)
Modified the onboarding backend function to:
- Generate a platform PIN (`SS-ROL-XXXXXX` format) for every new user.
- Create the auth account via `base44.auth.register()` using the PIN as the initial password.
- Store the PIN on the User entity along with `must_change_password: true` and `password_initialized: true`.
- For existing users, preserve their current password and use or generate their PIN as an identifier only.
- Return both the 6-digit Login PIN (school-specific) and the platform PIN to the admin.

### 3. First-Login Redirect (`src/components/dashboard/DashboardLayout.jsx`)
Added a redirect check: if `user.data.must_change_password` is `true` and the user is not already on `/app/change-password`, they are redirected to the password change page. This blocks access to all other dashboard pages until the password is changed.

### 4. Password Change UI
- **`src/components/account/ChangePasswordForm.jsx`** — Reusable form component with current/new/confirm password fields, show/hide toggles, validation (min 6 chars, match check, different-from-current check), and inline error/success states. Calls `base44.auth.changePassword()`, then clears `must_change_password` and records `password_changed_at` via `updateMe`.
- **`src/pages/account/ChangePassword.jsx`** — Dedicated page with a security notice banner, used for the first-login forced change.
- **`src/pages/account/AccountProfile.jsx`** — Added a "Security" section with the `ChangePasswordForm` and a "Password change required" badge when `must_change_password` is true.

### 5. User Data Resolution Fixes
- **`base44/functions/getUserAccountDetails/entry.ts`** — Now fetches the full User entity via `asServiceRole.entities.User.get()` to access top-level custom fields (`pin`, `must_change_password`, `password_initialized`, `password_changed_at`) that `auth.me()` does not return in `data`.
- **`src/hooks/useCurrentUser.js`** — Added a full entity fetch to merge `pin`, `must_change_password`, `password_initialized`, and `password_changed_at` into `user.data` so the `DashboardLayout` redirect check works.

### 6. Routing
Added `/app/change-password` route in `src/App.jsx` inside the authenticated `DashboardLayout`.

---

## How the Generated PIN Serves as the Initial Password

1. When a school admin onboards a new user (teacher, student, or parent), `onboardUser` generates a unique platform PIN (e.g., `TE-STU-PSGBVW`).
2. For new users (no existing auth account), the function calls `base44.auth.register({ email, password: userPin })` — the PIN becomes the account password.
3. The PIN is stored on the User entity as the persistent platform identifier.
4. The `must_change_password` flag is set to `true`, and `password_initialized` is set to `true`.
5. The admin receives both the 6-digit Login PIN (for school-level login identification) and the platform PIN (for the initial password).
6. The user logs in with their Login PIN + platform PIN, then is immediately prompted to change their password.

For existing users, their current password is preserved — the PIN is used only as an identifier, not as a password.

---

## How First-Login Password Change Is Enforced

1. **Backend**: `onboardUser` sets `must_change_password: true` on new user accounts.
2. **Frontend**: `useCurrentUser` fetches the full User entity and merges `must_change_password` into `user.data`.
3. **DashboardLayout**: On every authenticated page load, checks `user.data.must_change_password`. If `true` and the user is not on `/app/change-password`, redirects via `<Navigate to="/app/change-password" replace />`.
4. **ChangePasswordForm**: After a successful password change, calls `base44.auth.updateMe({ must_change_password: false, password_changed_at: <timestamp> })` to clear the flag.
5. **Result**: The user cannot access any dashboard page until they change their password. The PIN remains their platform identifier — only the auth password changes.

---

## Super Admin Test Account

A Super Admin test account has been created with the following credentials:

| Field | Value |
|-------|-------|
| **Email** | `test@mail.com` |
| **Password** | `12345678` |
| **Platform PIN** | `PL-SAD-TG27BI` |
| **Role** | Super Admin |
| **must_change_password** | `false` (password was explicitly set, not derived from PIN) |

> **Note**: The platform requires a minimum password length of 8 characters, so the requested password "123456" was adjusted to "12345678". The Super Admin PIN (`PL-SAD-TG27BI`) serves as the platform identifier, not as the password. This PIN should not be stored in application logs or exposed in production environments.

---

## Test Verification

- **`onboardUser`**: Successfully created a test student with PIN `TE-STU-PSGBVW` as the initial password. `must_change_password` was set to `true`, `password_initialized` to `true`. The auth account was created via `register()` with the PIN as the password.
- **`getUserAccountDetails`**: Correctly returns `pin`, `must_change_password`, `password_initialized`, and `password_changed_at` from the full User entity.
- **Super Admin account**: Created with password `12345678` and PIN `PL-SAD-TG27BI`. `must_change_password` is `false` (explicitly set password, not PIN-derived).
- **Test data cleanup**: Test student membership and profile were deleted after verification.

---

## Files Modified

| File | Change |
|------|--------|
| `base44/entities/User.jsonc` | Added `must_change_password`, `password_initialized`, `password_changed_at` fields |
| `base44/functions/onboardUser/entry.ts` | PIN-based account registration with initial password + flags |
| `base44/functions/getUserAccountDetails/entry.ts` | Full entity fetch for top-level custom fields |
| `src/hooks/useCurrentUser.js` | Full entity fetch + merge custom fields into `user.data` |
| `src/components/dashboard/DashboardLayout.jsx` | First-login redirect to `/app/change-password` |
| `src/components/account/ChangePasswordForm.jsx` | New — reusable password change form |
| `src/pages/account/ChangePassword.jsx` | New — dedicated password change page |
| `src/pages/account/AccountProfile.jsx` | Added Security section with password change form |
| `src/App.jsx` | Added `/app/change-password` route |