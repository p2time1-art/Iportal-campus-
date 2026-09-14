import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { school_id } = body || {};

    // Fetch accepted and admitted applications — public, privacy-safe
    const filter: any = {
      status: { $in: ['accepted', 'admitted'] }
    };
    if (school_id) {
      filter.school_id = school_id;
    }

    const applications = await base44.asServiceRole.entities.AdmissionApplication.filter(
      filter,
      '-submitted_at',
      200
    );

    // Return ONLY privacy-safe identifiers — no email, phone, documents, or PII
    const safe = (applications || []).map((a: any) => ({
      application_number: a.application_number,
      programme: a.programme || '',
      status: a.status,
      school_name: a.school_name || ''
    }));

    return Response.json({ applicants: safe });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to fetch accepted applicants' }, { status: 500 });
  }
}