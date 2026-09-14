import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_number } = body;

    if (!application_number || typeof application_number !== 'string') {
      return Response.json({ error: 'Application number is required.' }, { status: 400 });
    }

    // Basic length/format check to prevent abuse
    const cleaned = application_number.trim().toUpperCase();
    if (cleaned.length < 5 || cleaned.length > 50) {
      return Response.json({ error: 'Invalid application number format.' }, { status: 400 });
    }

    const applications = await base44.asServiceRole.entities.AdmissionApplication.filter(
      { application_number: cleaned },
      '-created_date',
      5
    );

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'No application found with this application number. Please check and try again.' }, { status: 404 });
    }

    const app = applications[0];

    // Return only the minimum public information — NO email, NO document URLs, NO phone
    return Response.json({
      application_number: app.application_number,
      school_name: app.school_name,
      programme: app.programme,
      status: app.status,
      submitted_at: app.submitted_at,
      review_notes: app.review_notes || ''
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to check application status' }, { status: 500 });
  }
}