import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isSchoolAdmin, resolveSchoolId, generateUniquePin, createAuditLog } from '../../shared/onboardingAuth.ts';
import { assignUserPin, generateUniqueUserPin } from '../../shared/pinSystem.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isSchoolAdmin(user)) {
      return Response.json({ error: 'School admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { role, email, profile_data, profile_id, guardian_links } = body;

    const schoolId = resolveSchoolId(user);
    if (!schoolId) {
      return Response.json({ error: 'No active school context. Please switch to a school.' }, { status: 400 });
    }

    const school = await base44.entities.School.get(schoolId).catch(() => null);
    if (!school) {
      return Response.json({ error: 'School not found' }, { status: 404 });
    }

    if (!email || !role) {
      return Response.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // School admins can only onboard teacher/student/parent — not school_admin (privilege escalation)
    const validRoles = ['teacher', 'student', 'parent'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role for onboarding' }, { status: 400 });
    }

    if (role === 'super_admin') {
      return Response.json({ error: 'Cannot onboard super admin accounts' }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate profile_id belongs to this school (prevents cross-school profile hijacking)
    if (profile_id) {
      let profileEntity: any = null;
      if (role === 'teacher') profileEntity = await base44.entities.Teacher.get(profile_id).catch(() => null);
      else if (role === 'student') profileEntity = await base44.entities.Student.get(profile_id).catch(() => null);
      else if (role === 'parent') profileEntity = await base44.entities.ParentGuardian.get(profile_id).catch(() => null);

      if (!profileEntity || profileEntity.school_id !== schoolId) {
        return Response.json({ error: 'Profile not found in this school.' }, { status: 403 });
      }
    }

    // Check for existing membership with same email + school
    const existingMemberships = await base44.asServiceRole.entities.SchoolMembership.filter(
      { user_email: normalizedEmail, school_id: schoolId },
      '-created_date',
      10
    );

    if (existingMemberships && existingMemberships.length > 0) {
      // Return membership WITHOUT the PIN — prevent PIN discovery via duplicate onboarding
      const existing = existingMemberships[0];
      return Response.json({
        membership: { ...existing, login_pin: undefined },
        message: 'User already has a portal account for this school. Use "Reset PIN" if a new PIN is needed.',
        already_exists: true
      });
    }

    // Generate unique PIN
    const loginPin = await generateUniquePin(base44);

    // Try to find existing user by email
    let existingUser = null;
    try {
      const users = await base44.asServiceRole.entities.User.filter(
        { email: normalizedEmail }, '-created_date', 5
      );
      existingUser = users && users.length > 0 ? users[0] : null;
    } catch (_e) {
      // User lookup may fail — user simply hasn't registered yet
    }

    // Generate platform PIN and create auth account for new users.
    // The PIN serves as the initial login password (changeable after first login).
    let userPin = '';
    const pinFullName = (profile_data?.full_name || '').trim() || normalizedEmail;
    const pinSchoolName = school.name;

    let isNewUser = false;
    if (existingUser) {
      // Existing user — preserve their password; use existing PIN or generate one
      if (existingUser.data?.pin) {
        userPin = existingUser.data.pin;
      } else {
        userPin = await generateUniqueUserPin(base44, pinFullName, role, pinSchoolName);
        const pinNow = new Date().toISOString();
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          pin: userPin,
          pin_generated_at: pinNow,
          pin_last_updated_at: pinNow
        });
      }
    } else {
      // New user — generate PIN and create auth account with PIN as initial password
      isNewUser = true;
      userPin = await generateUniqueUserPin(base44, pinFullName, role, pinSchoolName);
      try {
        const regResult = await base44.auth.register({ email: normalizedEmail, password: userPin });
        if (regResult?.id) {
          const pinNow = new Date().toISOString();
          await base44.asServiceRole.entities.User.update(regResult.id, {
            pin: userPin,
            pin_generated_at: pinNow,
            pin_last_updated_at: pinNow,
            must_change_password: true,
            password_initialized: true
          });
          existingUser = { id: regResult.id, email: normalizedEmail, data: { pin: userPin } };
        } else {
          return Response.json({ error: 'Unable to create authentication account. Please try again.' }, { status: 500 });
        }
      } catch (regErr) {
        // Registration failed — do not create a membership; return error immediately
        return Response.json({ error: 'Unable to create authentication account: ' + (regErr.message || 'Registration failed') }, { status: 500 });
      }
    }

    // Create or link profile based on role
    let profileId = profile_id || '';
    let profileType = '';

    if (role === 'teacher') {
      profileType = 'Teacher';
      if (!profileId && profile_data) {
        // Check staff_id uniqueness
        if (profile_data.staff_id) {
          const dup = await base44.entities.Teacher.filter(
            { school_id: schoolId, staff_id: profile_data.staff_id.trim() },
            '-created_date', 10
          );
          if (dup && dup.length > 0) {
            return Response.json({ error: 'A teacher with this Staff ID already exists.' }, { status: 409 });
          }
        }
        const teacher = await base44.entities.Teacher.create({
          school_id: schoolId,
          full_name: (profile_data.full_name || '').trim(),
          staff_id: (profile_data.staff_id || '').trim(),
          email: normalizedEmail,
          phone: profile_data.phone || '',
          gender: profile_data.gender || '',
          qualification: profile_data.qualification || '',
          status: 'active',
          user_id: existingUser?.id || ''
        });
        profileId = teacher.id;
      } else if (profileId && existingUser) {
        await base44.entities.Teacher.update(profileId, {
          user_id: existingUser.id,
          email: normalizedEmail
        });
      }
    } else if (role === 'student') {
      profileType = 'Student';
      if (!profileId && profile_data) {
        // Check admission number uniqueness
        if (profile_data.admission_number) {
          const dup = await base44.entities.Student.filter(
            { school_id: schoolId, admission_number: profile_data.admission_number.trim() },
            '-created_date', 10
          );
          if (dup && dup.length > 0) {
            return Response.json({ error: 'A student with this Admission Number already exists.' }, { status: 409 });
          }
        }
        const cls = profile_data.current_class_id
          ? await base44.entities.SchoolClass.get(profile_data.current_class_id).catch(() => null)
          : null;
        const student = await base44.entities.Student.create({
          school_id: schoolId,
          full_name: (profile_data.full_name || '').trim(),
          admission_number: (profile_data.admission_number || '').trim(),
          email: normalizedEmail,
          phone: profile_data.phone || '',
          gender: profile_data.gender || '',
          current_class_id: profile_data.current_class_id || '',
          current_class_name: cls?.name || '',
          current_session_id: profile_data.current_session_id || '',
          admission_date: new Date().toISOString().slice(0, 10),
          status: 'active',
          user_id: existingUser?.id || ''
        });
        profileId = student.id;

        // Record class assignment history
        if (profile_data.current_class_id && profile_data.current_session_id) {
          try {
            await base44.entities.ClassAssignment.create({
              school_id: schoolId,
              student_id: student.id,
              student_name: student.full_name,
              class_id: profile_data.current_class_id,
              class_name: cls?.name || '',
              session_id: profile_data.current_session_id,
              session_name: profile_data.session_name || ''
            });
          } catch (_e) { /* non-fatal */ }
        }
      } else if (profileId && existingUser) {
        await base44.entities.Student.update(profileId, {
          user_id: existingUser.id,
          email: normalizedEmail
        });
      }
    } else if (role === 'parent') {
      profileType = 'ParentGuardian';
      // Validate all guardian_links BEFORE creating profile (prevents orphaned parent records)
      if (guardian_links && guardian_links.length > 0) {
        for (const link of guardian_links) {
          if (!link.student_id) continue;
          const stu = await base44.entities.Student.get(link.student_id).catch(() => null);
          if (!stu || stu.school_id !== schoolId) {
            return Response.json({ error: 'Cross-school student linking is not allowed.' }, { status: 403 });
          }
        }
      }
      if (!profileId && profile_data) {
        const parent = await base44.entities.ParentGuardian.create({
          school_id: schoolId,
          full_name: (profile_data.full_name || '').trim(),
          email: normalizedEmail,
          phone: profile_data.phone || '',
          relationship: profile_data.relationship || 'guardian',
          occupation: profile_data.occupation || '',
          status: 'active',
          user_id: existingUser?.id || ''
        });
        profileId = parent.id;
      } else if (profileId && existingUser) {
        await base44.entities.ParentGuardian.update(profileId, {
          user_id: existingUser.id,
          email: normalizedEmail
        });
      }

      // Create guardian relationships (all links already validated above)
      if (profileId && guardian_links && guardian_links.length > 0) {
        for (const link of guardian_links) {
          if (!link.student_id) continue;
          const student = await base44.entities.Student.get(link.student_id).catch(() => null);
          if (!student) continue;
          const existingRel = await base44.entities.GuardianRelationship.filter(
            { school_id: schoolId, guardian_id: profileId, student_id: link.student_id },
            '-created_date', 5
          );
          if (!existingRel || existingRel.length === 0) {
            await base44.entities.GuardianRelationship.create({
              school_id: schoolId,
              student_id: link.student_id,
              student_name: student.full_name,
              guardian_id: profileId,
              guardian_name: (profile_data?.full_name || '').trim(),
              relationship_type: link.relationship_type || 'guardian',
              is_primary: link.is_primary || false
            });
          }
        }
      }
    }

    // Create SchoolMembership (use asServiceRole — school admins lack direct RLS update on memberships)
    const membershipData: any = {
      user_id: existingUser?.id || '',
      user_email: normalizedEmail,
      user_name: (profile_data?.full_name || '').trim(),
      school_id: schoolId,
      school_name: school.name,
      role,
      login_pin: loginPin,
      user_pin: userPin,
      status: 'active',
      is_primary: false
    };

    const membership = await base44.asServiceRole.entities.SchoolMembership.create(membershipData);

    // PIN was already generated and stored above — no additional action needed

    // Create audit log (do NOT store the PIN)
    await createAuditLog(base44, user, {
      action: 'ACCOUNT_CREATED',
      entity_type: 'SchoolMembership',
      entity_id: membership.id,
      school_id: schoolId,
      school_name: school.name,
      description: `Onboarded ${profile_data?.full_name || normalizedEmail} as ${role} at ${school.name}`,
      metadata: { role, email: normalizedEmail, profile_id: profileId, user_exists: !!existingUser }
    });

    return Response.json({
      membership,
      login_pin: loginPin,
      user_pin: userPin,
      profile_id: profileId,
      profile_type: profileType,
      needs_invite: false,
      user_exists: !!existingUser,
      message: isNewUser
        ? 'Account created successfully. The user can log in immediately using their Login PIN and platform PIN (as password). They will be prompted to change their password on first login.'
        : 'Portal account linked successfully. The user can log in with their Login PIN and existing password.'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Onboarding failed' }, { status: 500 });
  }
}