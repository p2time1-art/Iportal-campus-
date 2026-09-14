/**
 * Shared User PIN System — Platform-wide user identifier.
 * Format: SS-ROL-XXXXXX
 *   SS    = First 2 letters of school name (uppercase), or "PL" for Super Admin
 *   ROL   = Role code (STU, TEA, PAR, ADM, SAD)
 *   XXXXXX = First initial + Last initial + 4 random alphanumeric characters
 *
 * PINs are generated server-side only, with collision detection.
 * PINs are NOT authentication credentials — they are platform identifiers.
 * PIN values are never logged in audit entries.
 */

export const ROLE_CODES: Record<string, string> = {
  student: 'STU',
  teacher: 'TEA',
  parent: 'PAR',
  school_admin: 'ADM',
  super_admin: 'SAD'
};

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a cryptographically secure random alphanumeric string.
 * Uses crypto.getRandomValues (available in Deno runtime).
 */
function secureRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}

/**
 * Extracts initials from a full name.
 * "John Doe" → "JD", "Mary James" → "MJ"
 * Falls back to 'X' for missing names.
 */
export function getInitials(fullName: string): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return 'XX';
  const first = parts[0][0]?.toUpperCase() || 'X';
  const last = parts.length > 1
    ? parts[parts.length - 1][0]?.toUpperCase() || 'X'
    : 'X';
  return first + last;
}

/**
 * Generates the school prefix (first 2 letters of school name, uppercase).
 * "Gracefield College" → "GR"
 * Falls back to 'XX' for missing names.
 */
export function getSchoolPrefix(schoolName: string): string {
  const name = (schoolName || '').trim();
  if (name.length === 0) return 'XX';
  return name.substring(0, 2).toUpperCase();
}

/**
 * Gets the role code for a given role.
 */
export function getRoleCode(role: string): string {
  return ROLE_CODES[role] || 'USR';
}

/**
 * Generates a single PIN candidate (no collision check).
 * Format: SS-ROL-XXXXXX
 */
export function generatePinCandidate(fullName: string, role: string, schoolName: string): string {
  const schoolPrefix = role === 'super_admin' ? 'PL' : getSchoolPrefix(schoolName);
  const roleCode = getRoleCode(role);
  const initials = getInitials(fullName);
  const random = secureRandomString(4);
  return `${schoolPrefix}-${roleCode}-${initials}${random}`;
}

/**
 * Generates a unique PIN with collision detection.
 * Checks against existing User entities to prevent duplicates.
 * Retries up to 100 times before throwing.
 *
 * @param base44 - The base44 client (must be asServiceRole for cross-user lookup)
 * @param fullName - User's full name
 * @param role - User's platform role (student, teacher, parent, school_admin, super_admin)
 * @param schoolName - School name (ignored for super_admin, uses "PL" prefix)
 * @returns A unique PIN string
 */
export async function generateUniqueUserPin(
  base44: any,
  fullName: string,
  role: string,
  schoolName: string
): Promise<string> {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const pin = generatePinCandidate(fullName, role, schoolName);
    // Check for collision against all users
    const existing = await base44.asServiceRole.entities.User.filter(
      { pin },
      '-created_date',
      5
    );
    if (!existing || existing.length === 0) {
      return pin;
    }
  }
  throw new Error('Unable to generate a unique User PIN. Please try again.');
}

/**
 * Persists a PIN onto a User entity and optionally denormalizes to SchoolMembership.
 * Returns the generated PIN.
 *
 * @param base44 - The base44 client (must be asServiceRole)
 * @param userId - The User entity ID
 * @param fullName - User's full name (for PIN generation)
 * @param role - User's platform role
 * @param schoolName - School name (for prefix)
 * @param membershipId - Optional SchoolMembership ID to denormalize the PIN onto
 * @returns The generated PIN string
 */
export async function assignUserPin(
  base44: any,
  userId: string,
  fullName: string,
  role: string,
  schoolName: string,
  membershipId?: string
): Promise<string> {
  const pin = await generateUniqueUserPin(base44, fullName, role, schoolName);
  const now = new Date().toISOString();

  // Update the User entity with the PIN
  await base44.asServiceRole.entities.User.update(userId, {
    pin,
    pin_generated_at: now,
    pin_last_updated_at: now
  });

  // Denormalize to SchoolMembership if provided
  if (membershipId) {
    await base44.asServiceRole.entities.SchoolMembership.update(membershipId, {
      user_pin: pin
    });
  }

  return pin;
}