import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_number } = body;

    if (!application_number || typeof application_number !== 'string') {
      return Response.json({ error: 'Application number is required.' }, { status: 400 });
    }

    const applications = await base44.asServiceRole.entities.JobApplication.filter(
      { application_number: application_number.trim().toUpperCase() },
      '-created_date',
      5
    );

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'No application found with this application number. Please check and try again.' }, { status: 404 });
    }

    const app = applications[0];

    return Response.json({
      application_number: app.application_number,
      vacancy_title: app.vacancy_title,
      school_name: app.school_name,
      full_name: app.full_name,
      email: app.email,
      status: app.status,
      submitted_at: app.submitted_at,
      notes: app.notes || ''
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to check application status' }, { status: 500 });
  }
}