/**
 * Shared onboarding authorization utilities.
 * Used by onboardUser, manageUserAccount, and getUserAccountDetails.
 */

export function isSchoolAdmin(user: any): boolean {
  return !!(user?.data?.is_school_admin || user?.data?.is_super_admin || user?.role === 'admin');
}

// Re-exported from platformAuth to avoid duplicate implementation
export { isPlatformAdmin, createAuditLog } from './platformAuth.ts';

export function resolveSchoolId(user: any): string {
  return user?.data?.active_school_id || '';
}

export function resolveRole(user: any): string {
  return user?.data?.active_role || user?.role || '';
}

/**
 * Generates a globally-unique 6-digit numeric Login PIN.
 * Checks against all active/invited/suspended memberships to prevent collisions.
 */
export async function generateUniquePin(base44: any): Promise<string> {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await base44.asServiceRole.entities.SchoolMembership.filter(
      { login_pin: pin },
      '-created_date',
      10
    );
    if (!existing || existing.length === 0) {
      return pin;
    }
  }
  throw new Error('Unable to generate a unique Login PIN. Please try again.');
}