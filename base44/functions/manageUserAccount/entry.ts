import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSchoolAdmin, isPlatformAdmin, resolveSchoolId, generateUniquePin, createAuditLog } from '../../shared/onboardingAuth.ts';
import { assignUserPin } from '../../shared/pinSystem.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'link_account': return await linkAccount(base44, user, body);
      case 'activate': return await setStatus(base44, user, body, 'active', 'ACCOUNT_ACTIVATED');
      case 'deactivate': return await setStatus(base44, user, body, 'inactive', 'ACCOUNT_DEACTIVATED');
      case 'suspend': return await setStatus(base44, user, body, 'suspended', 'ACCOUNT_SUSPENDED');
      case 'reset_pin': return await resetPin(base44, user, body);
      case 'unlink': return await unlinkAccount(base44, user, body);
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Self-service: user links their own account on first login.
 * Called by useCurrentUser when a membership exists by email but has no user_id.
 * Uses asServiceRole because the user's tenancy fields are not synced yet.
 */
async function linkAccount(base44: any, user: any, _body: any) {
  if (!user.email) {
    return Response.json({ error: 'User email not available' }, { status: 400 });
  }

  const memberships = await base44.asServiceRole.entities.SchoolMembership.filter(
    { user_email: user.email.toLowerCase() },
    '-created_date',
    50
  );

  const unlinked = (memberships || []).filter(m => !m.user_id || m.user_id === '');
  if (unlinked.length === 0) {
    return Response.json({ linked: 0, message: 'No unlinked memberships found' });
  }

  let linked = 0;
  for (const m of unlinked) {
    // Skip suspended/inactive memberships — only link active or invited
    if (m.status !== 'active' && m.status !== 'invited') continue;

    await base44.asServiceRole.entities.SchoolMembership.update(m.id, {
      user_id: user.id,
      status: 'active'
    });

    // Update corresponding profile
    if (m.role === 'teacher') {
      const teachers = await base44.asServiceRole.entities.Teacher.filter(
        { school_id: m.school_id, email: user.email.toLowerCase() }, '-created_date', 10
      );
      for (const t of (teachers || [])) {
        if (!t.user_id) await base44.asServiceRole.entities.Teacher.update(t.id, { user_id: user.id });
      }
    } else if (m.role === 'student') {
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: m.school_id, email: user.email.toLowerCase() }, '-created_date', 10
      );
      for (const s of (students || [])) {
        if (!s.user_id) await base44.asServiceRole.entities.Student.update(s.id, { user_id: user.id });
      }
    } else if (m.role === 'parent') {
      const parents = await base44.asServiceRole.entities.ParentGuardian.filter(
        { school_id: m.school_id, email: user.email.toLowerCase() }, '-created_date', 10
      );
      for (const p of (parents || [])) {
        if (!p.user_id) await base44.asServiceRole.entities.ParentGuardian.update(p.id, { user_id: user.id });
      }
    }

    linked++;

    await createAuditLog(base44, user, {
      action: 'ACCOUNT_LINKED',
      entity_type: 'SchoolMembership',
      entity_id: m.id,
      school_id: m.school_id,
      school_name: m.school_name,
      description: `Self-linked portal account for ${user.email} as ${m.role}`,
      metadata: { role: m.role }
    });
  }

  // Generate platform User PIN if the user doesn't have one yet
  if (linked > 0) {
    try {
      const existingUser = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
      if (existingUser && !existingUser.data?.pin) {
        const firstM = unlinked.find(m => m.status === 'active' || m.status === 'invited');
        if (firstM) {
          await assignUserPin(base44, user.id, user.full_name || firstM.user_name || '', firstM.role, firstM.school_name || '', firstM.id);
        }
      }
    } catch (_e) { /* non-fatal */ }
  }

  return Response.json({ linked, message: `Successfully linked ${linked} membership(s)` });
}

/**
 * Admin: set membership status (activate / deactivate / suspend).
 */
async function setStatus(base44: any, user: any, body: any, status: string, auditAction: string) {
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

  // Verify membership belongs to admin's school (unless super admin)
  if (!isPlatformAdmin(user)) {
    const adminSchoolId = resolveSchoolId(user);
    if (membership.school_id !== adminSchoolId) {
      return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
    }
  }

  // Prevent self-deactivation (admin can't deactivate their own account)
  if (membership.user_id === user.id && status !== 'active') {
    return Response.json({ error: 'You cannot deactivate or suspend your own account.' }, { status: 403 });
  }

  // Idempotency: skip if already in target status (avoids misleading audit logs)
  if (membership.status === status) {
    return Response.json({ membership, message: `Account is already ${status}.` });
  }

  const updated = await base44.asServiceRole.entities.SchoolMembership.update(membership_id, { status });

  // If deactivating/suspending, also update the profile status to preserve data
  if (status === 'inactive' || status === 'suspended') {
    if (membership.role === 'teacher' && membership.user_id) {
      const teachers = await base44.asServiceRole.entities.Teacher.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const t of (teachers || [])) {
        await base44.asServiceRole.entities.Teacher.update(t.id, { status: 'inactive' });
      }
    } else if (membership.role === 'student' && membership.user_id) {
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const s of (students || [])) {
        // Use 'inactive' — never delete or change to graduated/transferred automatically
        await base44.asServiceRole.entities.Student.update(s.id, { status: 'inactive' });
      }
    } else if (membership.role === 'parent' && membership.user_id) {
      const parents = await base44.asServiceRole.entities.ParentGuardian.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const p of (parents || [])) {
        await base44.asServiceRole.entities.ParentGuardian.update(p.id, { status: 'inactive' });
      }
    }
  } else if (status === 'active') {
    // Reactivating — also reactivate the profile
    if (membership.role === 'teacher' && membership.user_id) {
      const teachers = await base44.asServiceRole.entities.Teacher.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const t of (teachers || [])) {
        await base44.asServiceRole.entities.Teacher.update(t.id, { status: 'active' });
      }
    } else if (membership.role === 'student' && membership.user_id) {
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const s of (students || [])) {
        await base44.asServiceRole.entities.Student.update(s.id, { status: 'active' });
      }
    } else if (membership.role === 'parent' && membership.user_id) {
      const parents = await base44.asServiceRole.entities.ParentGuardian.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const p of (parents || [])) {
        await base44.asServiceRole.entities.ParentGuardian.update(p.id, { status: 'active' });
      }
    }
  }

  await createAuditLog(base44, user, {
    action: auditAction,
    entity_type: 'SchoolMembership',
    entity_id: membership_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Changed ${membership.user_name || membership.user_email} status to ${status}`,
    metadata: { previous_status: membership.status, new_status: status }
  });

  return Response.json({ membership: updated });
}

/**
 * Admin: reset Login PIN for a membership.
 */
async function resetPin(base44: any, user: any, body: any) {
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

  const newPin = await generateUniquePin(base44);
  const updated = await base44.asServiceRole.entities.SchoolMembership.update(membership_id, { login_pin: newPin });

  await createAuditLog(base44, user, {
    action: 'CREDENTIAL_RESET',
    entity_type: 'SchoolMembership',
    entity_id: membership_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Reset Login PIN for ${membership.user_name || membership.user_email}`,
    metadata: { previous_pin_exists: !!membership.login_pin }
  });

  return Response.json({ membership: updated, login_pin: newPin });
}

/**
 * Admin: unlink a portal account from a school profile.
 * Deactivates the membership and clears user_id from the profile.
 * All historical records (results, attendance, payments) are preserved.
 */
async function unlinkAccount(base44: any, user: any, body: any) {
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

  if (membership.user_id === user.id) {
    return Response.json({ error: 'You cannot unlink your own account.' }, { status: 403 });
  }

  // Deactivate membership (preserve, don't delete)
  const updated = await base44.asServiceRole.entities.SchoolMembership.update(membership_id, {
    status: 'inactive'
  });

  // Remove user_id from profile (preserve the profile record and all history)
  if (membership.user_id) {
    if (membership.role === 'teacher') {
      const teachers = await base44.asServiceRole.entities.Teacher.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const t of (teachers || [])) {
        await base44.asServiceRole.entities.Teacher.update(t.id, { user_id: '', status: 'inactive' });
      }
    } else if (membership.role === 'student') {
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const s of (students || [])) {
        await base44.asServiceRole.entities.Student.update(s.id, { user_id: '', status: 'inactive' });
      }
    } else if (membership.role === 'parent') {
      const parents = await base44.asServiceRole.entities.ParentGuardian.filter(
        { school_id: membership.school_id, user_id: membership.user_id }, '-created_date', 5
      );
      for (const p of (parents || [])) {
        await base44.asServiceRole.entities.ParentGuardian.update(p.id, { user_id: '', status: 'inactive' });
      }
    }
  }

  await createAuditLog(base44, user, {
    action: 'ACCOUNT_UNLINKED',
    entity_type: 'SchoolMembership',
    entity_id: membership_id,
    school_id: membership.school_id,
    school_name: membership.school_name,
    description: `Unlinked portal account for ${membership.user_name || membership.user_email}`,
    metadata: { role: membership.role }
  });

  return Response.json({ membership: updated });
}