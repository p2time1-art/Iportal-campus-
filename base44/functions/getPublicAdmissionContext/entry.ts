import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch active schools (public — no auth required)
    const schools = await base44.asServiceRole.entities.School.filter(
      { status: 'active' },
      'name',
      100
    );

    const schoolList = (schools || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      short_name: s.short_name || s.name,
      application_fee_enabled: !!(s.application_fee_enabled && Number(s.application_fee_amount) > 0),
      application_fee_amount: Number(s.application_fee_amount) || 0
    }));

    // Fetch active classes for all active schools
    const schoolIds = schoolList.map((s: any) => s.id);
    let classes: any[] = [];
    if (schoolIds.length > 0) {
      const allClasses = await base44.asServiceRole.entities.SchoolClass.filter(
        { status: 'active' },
        'name',
        500
      );
      classes = (allClasses || [])
        .filter((c: any) => schoolIds.includes(c.school_id))
        .map((c: any) => ({
          id: c.id,
          school_id: c.school_id,
          name: c.name
        }));
    }

    return Response.json({
      schools: schoolList,
      classes
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load admission context' }, { status: 500 });
  }
}