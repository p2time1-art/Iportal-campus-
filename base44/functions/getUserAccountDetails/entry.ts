import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSchoolAdmin, isPlatformAdmin, resolveSchoolId } from '../../shared/onboardingAuth.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch full user entity — auth.me() only returns fields set via updateMe,
    // not custom fields set via entities.User.update (pin, must_change_password, etc.)
    let userEntity = null;
    try {
      userEntity = await base44.asServiceRole.entities.User.get(user.id);
    } catch (_e) {}

    const body = await req.json();
    const { membership_id } = body;

    // Admin mode: get a specific membership's details
    if (membership_id) {
      if (!isSchoolAdmin(user)) {
        return Response.json({ error: 'School admin access required' }, { status: 403 });
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

      const profile = await resolveProfile(base44, membership);
      return Response.json({ membership, profile });
    }

    // Self-service mode: get current user's account details
    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter(
      { user_email: user.email?.toLowerCase() },
      '-created_date',
      50
    );

    const myMemberships = (memberships || []).filter(m =>
      m.user_id === user.id || (!m.user_id && m.user_email === user.email?.toLowerCase())
    );

    const profiles: any[] = [];
    for (const m of myMemberships) {
      const profile = await resolveProfile(base44, m);
      if (profile) profiles.push({ membership: m, profile });
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        active_role: user.data?.active_role,
        is_school_admin: user.data?.is_school_admin,
        is_super_admin: user.data?.is_super_admin,
        pin: userEntity?.pin || user.data?.pin || '',
        must_change_password: userEntity?.must_change_password ?? (user.data?.must_change_password || false),
        password_initialized: userEntity?.password_initialized ?? (user.data?.password_initialized || false),
        password_changed_at: userEntity?.password_changed_at || user.data?.password_changed_at || null
      },
      memberships: myMemberships,
      profiles
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function resolveProfile(base44: any, membership: any) {
  if (!membership) return null;

  try {
    if (membership.role === 'teacher') {
      const teachers = await base44.asServiceRole.entities.Teacher.filter(
        { school_id: membership.school_id, email: membership.user_email },
        '-created_date', 5
      );
      if (teachers && teachers.length > 0) return { type: 'teacher', data: teachers[0] };

      // Fallback: search by user_id
      if (membership.user_id) {
        const byId = await base44.asServiceRole.entities.Teacher.filter(
          { school_id: membership.school_id, user_id: membership.user_id },
          '-created_date', 5
        );
        if (byId && byId.length > 0) return { type: 'teacher', data: byId[0] };
      }
    } else if (membership.role === 'student') {
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: membership.school_id, email: membership.user_email },
        '-created_date', 5
      );
      if (students && students.length > 0) return { type: 'student', data: students[0] };

      if (membership.user_id) {
        const byId = await base44.asServiceRole.entities.Student.filter(
          { school_id: membership.school_id, user_id: membership.user_id },
          '-created_date', 5
        );
        if (byId && byId.length > 0) return { type: 'student', data: byId[0] };
      }
    } else if (membership.role === 'parent') {
      const parents = await base44.asServiceRole.entities.ParentGuardian.filter(
        { school_id: membership.school_id, email: membership.user_email },
        '-created_date', 5
      );
      if (parents && parents.length > 0) {
        const parent = parents[0];
        // Get linked children via GuardianRelationship
        const rels = await base44.asServiceRole.entities.GuardianRelationship.filter(
          { school_id: membership.school_id, guardian_id: parent.id },
          '-created_date', 50
        );
        return { type: 'parent', data: parent, children: rels || [] };
      }

      if (membership.user_id) {
        const byId = await base44.asServiceRole.entities.ParentGuardian.filter(
          { school_id: membership.school_id, user_id: membership.user_id },
          '-created_date', 5
        );
        if (byId && byId.length > 0) {
          const parent = byId[0];
          const rels = await base44.asServiceRole.entities.GuardianRelationship.filter(
            { school_id: membership.school_id, guardian_id: parent.id },
            '-created_date', 50
          );
          return { type: 'parent', data: parent, children: rels || [] };
        }
      }
    } else if (membership.role === 'school_admin' || membership.role === 'super_admin') {
      return { type: 'admin', data: { name: membership.user_name, email: membership.user_email } };
    }
  } catch (_e) {
    // Profile lookup may fail
  }

  return null;
}