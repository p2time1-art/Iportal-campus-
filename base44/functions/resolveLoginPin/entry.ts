import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const loginPin = body?.login_pin;

    if (!loginPin || typeof loginPin !== 'string') {
      return Response.json({ error: 'Login PIN is required.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Look up the membership by login PIN (service role — user is not authenticated yet)
    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter({
      login_pin: loginPin.trim()
    });

    if (!memberships || memberships.length === 0) {
      return Response.json({ error: 'Invalid Login PIN. Please check and try again.' }, { status: 404 });
    }

    // Find the first active or invited membership (skip inactive/suspended)
    const membership = memberships.find((m: any) => m.status === 'active' || m.status === 'invited');
    if (!membership) {
      return Response.json({ error: 'This account has been deactivated or suspended. Please contact your school administrator.' }, { status: 403 });
    }

    // Resolve the school for context
    let school = null;
    if (membership.school_id) {
      try {
        school = await base44.asServiceRole.entities.School.get(membership.school_id);
      } catch (_e) {
        // school may be null for super_admin (platform-level)
      }
    }

    return Response.json({
      email: membership.user_email,
      role: membership.role,
      school_id: membership.school_id,
      school_name: membership.school_name || school?.name,
      display_name: membership.user_name
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to resolve Login PIN.' }, { status: 500 });
  }
}