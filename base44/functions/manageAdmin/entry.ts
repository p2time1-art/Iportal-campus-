import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isPlatformAdmin, createAuditLog } from '../../shared/platformAuth.ts';
import { assignUserPin } from '../../shared/pinSystem.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPlatformAdmin(user)) {
      return Response.json({ error: 'Platform admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'assign': return await assignAdmin(base44, user, body);
      case 'update_status': return await updateMembershipStatus(base44, user, body);
      case 'remove': return await removeAdmin(base44, user, body);
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function assignAdmin(base44: any, user: any, body: any) {
  const { user_id, user_email, user_name, school_id, role, login_pin } = body;
  if (!user_id || !school_id || !role) {
    return Response.json({ error: 'user_id, school_id, and role are required' }, { status: 400 });
  }

  // Only allow school-level roles via this function — never super_admin
  if (role === 'super_admin') {
    return Response.json({ error: 'Cannot assign super_admin role via this interface' }, { status: 403 });
  }

  const validRoles = ['school_admin', 'teacher', 'student', 'parent'];
  if (!validRoles.includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  const school = await base44.entities.School.get(school_id).catch(() => null);
  if (!school) {
    return Response.json({ error: 'School not found' }, { status: 404 });
  }

  // Check for existing membership for this user+school
  const existing = await base44.asServiceRole.entities.SchoolMembership.filter(
    { user_id, school_id }, '-created_date', 10
  );
  if (existing && existing.length > 0) {
    // Update existing
    const membership = existing[0];
    const updated = await base44.entities.SchoolMembership.update(membership.id, {
      role,
      user_email: user_email || membership.user_email || '',
      user_name: user_name || membership.user_name || '',
      school_name: school.name,
      status: 'active',
      login_pin: login_pin || membership.login_pin || ''
    });

    await createAuditLog(base44, user, {
      action: 'ASSIGN_ADMIN',
      entity_type: 'SchoolMembership',
      entity_id: membership.id,
      school_id: school_id,
      school_name: school.name,
      description: `Assigned ${user_name || user_email || user_id} as ${role} at ${school.name}`,
      metadata: { user_id, role, previous_role: membership.role }
    });

    // Generate User PIN if the user doesn't have one
    try {
      const existingUser = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
      if (existingUser && !existingUser.data?.pin) {
        await assignUserPin(base44, user_id, user_name || user_email || '', role, school.name, membership.id);
      }
    } catch (_e) { /* non-fatal */ }

    return Response.json({ membership: updated });
  }

  const membership = await base44.entities.SchoolMembership.create({
    user_id,
    user_email: user_email || '',
    user_name: user_name || '',
    school_id,
    school_name: school.name,
    role,
    login_pin: login_pin || '',
    status: 'active',
    is_primary: false
  });

  await createAuditLog(base44, user, {
    action: 'ASSIGN_ADMIN',
    entity_type: 'SchoolMembership',
    entity_id: membership.id,
    school_id: school_id,
    school_name: school.name,
    description: `Assigned ${user_name || user_email || user_id} as ${role} at ${school.name}`,
    metadata: { user_id, role }
  });

  // Generate User PIN if the user doesn't have one
  try {
    const existingUser = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (existingUser && !existingUser.data?.pin) {
      await assignUserPin(base44, user_id, user_name || user_email || '', role, school.name, membership.id);
    }
  } catch (_e) { /* non-fatal */ }

  return Response.json({ membership });
}

async function updateMembershipStatus(base44: any, user: any, body: any) {
  const { membership_id, status } = body;
  if (!membership_id || !status) {
    return Response.json({ error: 'membership_id and status are required' }, { status: 400 });
  }
  if (!['active', 'inactive', 'invited'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const membership = await base44.entities.SchoolMembership.get(membership_id).catch(() => null);
  if (!membership) {
    return Response.json({ error: 'Membership not found' }, { status: 404 });
  }

  const updated = await base44.entities.SchoolMembership.update(membership_id, { status });

  await createAuditLog(base44, user, {
    action: 'UPDATE_MEMBERSHIP_STATUS',
    entity_type: 'SchoolMembership',
    entity_id: membership_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Changed ${membership.user_name || membership.user_email} status to ${status}`,
    metadata: { previous_status: membership.status, new_status: status }
  });

  return Response.json({ membership: updated });
}

async function removeAdmin(base44: any, user: any, body: any) {
  const { membership_id, reason } = body;
  if (!membership_id) {
    return Response.json({ error: 'membership_id is required' }, { status: 400 });
  }

  const membership = await base44.entities.SchoolMembership.get(membership_id).catch(() => null);
  if (!membership) {
    return Response.json({ error: 'Membership not found' }, { status: 404 });
  }

  // Deactivate rather than delete — preserve historical data
  const updated = await base44.entities.SchoolMembership.update(membership_id, { status: 'inactive' });

  await createAuditLog(base44, user, {
    action: 'REMOVE_ADMIN',
    entity_type: 'SchoolMembership',
    entity_id: membership_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Removed ${membership.user_name || membership.user_email} from ${membership.school_name}`,
    metadata: { reason: reason || '', previous_role: membership.role }
  });

  return Response.json({ membership: updated });
}