import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSchoolAdmin, isPlatformAdmin, resolveSchoolId, createAuditLog } from '../../shared/onboardingAuth.ts';
import { generateUniqueUserPin, getSchoolPrefix, getRoleCode, getInitials } from '../../shared/pinSystem.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'generate': return await generatePin(base44, user, body);
      case 'regenerate': return await regeneratePin(base44, user, body);
      case 'backfill': return await backfillPins(base44, user, body);
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Generate a PIN for a user identified by membership_id.
 * School admins can only generate for their own school's members.
 * Super admins can generate for any member.
 */
async function generatePin(base44: any, user: any, body: any) {
  if (!isSchoolAdmin(user)) {
    return Response.json({ error: 'School admin access required' }, { status: 403 });
  }

  const { membership_id } = body;
  if (!membership_id) {
    return Response.json({ error: 'membership_id is required' }, { status: 400 });
  }

  const membership = await base44.asServiceRole.entities.SchoolMembership.get(membership_id).catch(() => null);
  if (!membership) {
    return Response.json({ error: 'Membership not found' }, { status: 404 });
  }

  // Cross-school check for non-super-admins
  if (!isPlatformAdmin(user)) {
    const adminSchoolId = resolveSchoolId(user);
    if (membership.school_id !== adminSchoolId) {
      return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
    }
  }

  if (!membership.user_id) {
    return Response.json({ error: 'User has not registered yet. PIN can be generated after account activation.' }, { status: 400 });
  }

  // Check if user already has a PIN
  const existingUser = await base44.asServiceRole.entities.User.get(membership.user_id).catch(() => null);
  if (existingUser?.data?.pin) {
    return Response.json({
      error: 'User already has a PIN. Use "Regenerate PIN" to create a new one.',
      existing_pin: existingUser.data.pin
    }, { status: 409 });
  }

  // Resolve school name for prefix
  let schoolName = membership.school_name || '';
  if (membership.role === 'super_admin') schoolName = '';

  const pin = await generateUniqueUserPin(base44, membership.user_name || membership.user_email || '', membership.role, schoolName);
  const now = new Date().toISOString();

  await base44.asServiceRole.entities.User.update(membership.user_id, {
    pin,
    pin_generated_at: now,
    pin_last_updated_at: now
  });

  // Denormalize to membership
  await base44.asServiceRole.entities.SchoolMembership.update(membership_id, { user_pin: pin });

  await createAuditLog(base44, user, {
    action: 'USER_PIN_GENERATED',
    entity_type: 'User',
    entity_id: membership.user_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Generated platform PIN for ${membership.user_name || membership.user_email}`,
    metadata: { membership_id, role: membership.role }
  });

  return Response.json({ pin, membership_id });
}

/**
 * Regenerate (replace) a PIN for a user identified by membership_id.
 * The old PIN is invalidated immediately.
 */
async function regeneratePin(base44: any, user: any, body: any) {
  if (!isSchoolAdmin(user)) {
    return Response.json({ error: 'School admin access required' }, { status: 403 });
  }

  const { membership_id } = body;
  if (!membership_id) {
    return Response.json({ error: 'membership_id is required' }, { status: 400 });
  }

  const membership = await base44.asServiceRole.entities.SchoolMembership.get(membership_id).catch(() => null);
  if (!membership) {
    return Response.json({ error: 'Membership not found' }, { status: 404 });
  }

  if (!isPlatformAdmin(user)) {
    const adminSchoolId = resolveSchoolId(user);
    if (membership.school_id !== adminSchoolId) {
      return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
    }
  }

  if (!membership.user_id) {
    return Response.json({ error: 'User has not registered yet.' }, { status: 400 });
  }

  let schoolName = membership.school_name || '';
  if (membership.role === 'super_admin') schoolName = '';

  const pin = await generateUniqueUserPin(base44, membership.user_name || membership.user_email || '', membership.role, schoolName);
  const now = new Date().toISOString();

  await base44.asServiceRole.entities.User.update(membership.user_id, {
    pin,
    pin_last_updated_at: now
  });

  await base44.asServiceRole.entities.SchoolMembership.update(membership_id, { user_pin: pin });

  await createAuditLog(base44, user, {
    action: 'USER_PIN_REGENERATED',
    entity_type: 'User',
    entity_id: membership.user_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Regenerated platform PIN for ${membership.user_name || membership.user_email}`,
    metadata: { membership_id, role: membership.role }
  });

  return Response.json({ pin, membership_id });
}

/**
 * Backfill: generate PINs for all users who don't have one yet.
 * Super admin only. Processes all schools.
 */
async function backfillPins(base44: any, user: any, _body: any) {
  if (!isPlatformAdmin(user)) {
    return Response.json({ error: 'Super admin access required' }, { status: 403 });
  }

  // Get all memberships that have a user_id but no user_pin
  const memberships = await base44.asServiceRole.entities.SchoolMembership.list('-created_date', 500);

  const toBackfill = (memberships || []).filter(m => m.user_id && !m.user_pin);
  if (toBackfill.length === 0) {
    return Response.json({ backfilled: 0, message: 'All users already have PINs.' });
  }

  let backfilled = 0;
  const errors: string[] = [];

  for (const m of toBackfill) {
    try {
      // Check if user already has a PIN on the User entity
      const existingUser = await base44.asServiceRole.entities.User.get(m.user_id).catch(() => null);
      if (existingUser?.data?.pin) {
        // User has a PIN but it's not denormalized — just update the membership
        await base44.asServiceRole.entities.SchoolMembership.update(m.id, { user_pin: existingUser.data.pin });
        backfilled++;
        continue;
      }

      let schoolName = m.school_name || '';
      if (m.role === 'super_admin') schoolName = '';

      const pin = await generateUniqueUserPin(base44, m.user_name || m.user_email || '', m.role, schoolName);
      const now = new Date().toISOString();

      await base44.asServiceRole.entities.User.update(m.user_id, {
        pin,
        pin_generated_at: now,
        pin_last_updated_at: now
      });
      await base44.asServiceRole.entities.SchoolMembership.update(m.id, { user_pin: pin });
      backfilled++;
    } catch (e) {
      errors.push(`${m.user_email || m.id}: ${e.message}`);
    }
  }

  await createAuditLog(base44, user, {
    action: 'USER_PIN_BACKFILL',
    entity_type: 'User',
    description: `Backfilled PINs for ${backfilled} user(s)`,
    metadata: { total_processed: toBackfill.length, backfilled, errors: errors.length }
  });

  return Response.json({ backfilled, total: toBackfill.length, errors });
}