import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateUniqueUserPin } from '../../shared/pinSystem.ts';
import { generateUniquePin } from '../../shared/onboardingAuth.ts';

function generateAdmissionNumber(): string {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `ADM/${year}/${stamp}${rand}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_number, email } = body;

    if (!application_number || !email) {
      return Response.json({ error: 'Application number and email are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const appNumber = application_number.trim().toUpperCase();

    // Find the application by application number
    const applications = await base44.asServiceRole.entities.AdmissionApplication.filter(
      { application_number: appNumber },
      '-created_date',
      5
    );

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'No application found with this application number.' }, { status: 404 });
    }

    const application = applications[0];

    // Verify the application is admitted or accepted
    if (!['accepted', 'admitted'].includes(application.status)) {
      return Response.json({
        error: 'Your application has not been accepted for admission yet. Please check your application status.'
      }, { status: 403 });
    }

    // Verify the email matches the application email
    if (application.email.toLowerCase() !== normalizedEmail) {
      return Response.json({
        error: 'The email address does not match the application on file.'
      }, { status: 403 });
    }

    // Check if a student profile already exists for this application
    const existingStudents = await base44.asServiceRole.entities.Student.filter(
      { school_id: application.school_id, email: normalizedEmail },
      '-created_date',
      5
    );

    if (existingStudents && existingStudents.length > 0) {
      // Student profile already exists — check if they have a membership
      const existingMemberships = await base44.asServiceRole.entities.SchoolMembership.filter(
        { user_email: normalizedEmail, school_id: application.school_id, role: 'student' },
        '-created_date',
        5
      );
      if (existingMemberships && existingMemberships.length > 0) {
        return Response.json({
          already_registered: true,
          message: 'You already have a student account for this school. Please log in using your Login PIN and password.'
        });
      }
    }

    // Check for existing user by email
    let existingUser = null;
    try {
      const users = await base44.asServiceRole.entities.User.filter(
        { email: normalizedEmail }, '-created_date', 5
      );
      existingUser = users && users.length > 0 ? users[0] : null;
    } catch (_e) { /* user may not exist yet */ }

    const school = await base44.asServiceRole.entities.School.get(application.school_id).catch(() => null);
    const schoolName = school?.name || '';

    let userId = '';
    let userPin = '';
    let isNewUser = false;

    if (existingUser) {
      // Existing user — preserve their password, use or generate PIN
      userId = existingUser.id;
      if (existingUser.data?.pin) {
        userPin = existingUser.data.pin;
      } else {
        userPin = await generateUniqueUserPin(base44, application.full_name, 'student', schoolName);
        const pinNow = new Date().toISOString();
        await base44.asServiceRole.entities.User.update(userId, {
          pin: userPin,
          pin_generated_at: pinNow,
          pin_last_updated_at: pinNow
        });
      }
    } else {
      // New user — register with PIN as initial password
      isNewUser = true;
      userPin = await generateUniqueUserPin(base44, application.full_name, 'student', schoolName);
      try {
        const regResult = await base44.auth.register({ email: normalizedEmail, password: userPin });
        if (regResult?.id) {
          userId = regResult.id;
          const pinNow = new Date().toISOString();
          await base44.asServiceRole.entities.User.update(userId, {
            pin: userPin,
            pin_generated_at: pinNow,
            pin_last_updated_at: pinNow,
            must_change_password: true,
            password_initialized: true
          });
        } else {
          return Response.json({ error: 'Unable to create authentication account.' }, { status: 500 });
        }
      } catch (regErr: any) {
        return Response.json({ error: 'Unable to create account: ' + (regErr.message || 'Registration failed') }, { status: 500 });
      }
    }

    // Generate 6-digit Login PIN
    const loginPin = await generateUniquePin(base44);

    // Create or update Student profile
    let studentId = '';
    let admissionNumber = '';
    if (existingStudents && existingStudents.length > 0) {
      studentId = existingStudents[0].id;
      admissionNumber = existingStudents[0].admission_number || generateAdmissionNumber();
      // Link user_id if not already linked
      if (!existingStudents[0].user_id) {
        await base44.asServiceRole.entities.Student.update(studentId, { user_id: userId });
      }
    } else {
      admissionNumber = generateAdmissionNumber();
      // Check admission number uniqueness
      const dupCheck = await base44.asServiceRole.entities.Student.filter(
        { school_id: application.school_id, admission_number: admissionNumber },
        '-created_date', 5
      );
      if (dupCheck && dupCheck.length > 0) {
        admissionNumber = generateAdmissionNumber();
      }

      const student = await base44.asServiceRole.entities.Student.create({
        school_id: application.school_id,
        full_name: application.full_name,
        admission_number: admissionNumber,
        date_of_birth: application.date_of_birth || '',
        gender: application.gender || '',
        email: normalizedEmail,
        phone: application.phone || '',
        address: application.address || '',
        admission_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        user_id: userId
      });
      studentId = student.id;
    }

    // Create SchoolMembership
    const membership = await base44.asServiceRole.entities.SchoolMembership.create({
      user_id: userId,
      user_email: normalizedEmail,
      user_name: application.full_name,
      school_id: application.school_id,
      school_name: schoolName,
      role: 'student',
      login_pin: loginPin,
      user_pin: userPin,
      status: 'active',
      is_primary: false
    });

    // Update application status to "enrolled"
    await base44.asServiceRole.entities.AdmissionApplication.update(application.id, {
      status: 'enrolled'
    });

    // Audit log (do NOT store PIN)
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: userId,
        actor_name: application.full_name,
        actor_role: 'student',
        school_id: application.school_id,
        school_name: schoolName,
        action: 'ADMITTED_STUDENT_SIGNUP',
        entity_type: 'AdmissionApplication',
        entity_id: application.id,
        description: `Admitted student self-signup: ${application.full_name} enrolled at ${schoolName}`,
        metadata: { application_number: appNumber, admission_number: admissionNumber, student_id: studentId }
      });
    } catch (_e) { /* non-fatal */ }

    return Response.json({
      success: true,
      login_pin: loginPin,
      admission_number: admissionNumber,
      student_id: studentId,
      membership_id: membership.id,
      is_new_user: isNewUser,
      message: isNewUser
        ? 'Account created successfully! Your Login PIN is ' + loginPin + ' and your initial password is your Platform PIN: ' + userPin + '. You will be prompted to change your password on first login.'
        : 'Account linked successfully! Your Login PIN is ' + loginPin + '. Please log in with your existing password.'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}