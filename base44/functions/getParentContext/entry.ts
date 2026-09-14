import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const studentId = body?.student_id || null;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Resolve the caller's guardian record(s)
    const guardians = await base44.asServiceRole.entities.ParentGuardian.filter(
      { user_id: user.id },
      '-created_date',
      10
    );
    if (!guardians || guardians.length === 0) {
      return Response.json({ children: [], results: [], attendance: [] });
    }

    // Gather authorized children across all guardian records
    const allChildren = [];
    for (const g of guardians) {
      const rels = await base44.asServiceRole.entities.GuardianRelationship.filter(
        { guardian_id: g.id },
        '-created_date',
        50
      );
      for (const rel of (rels || [])) {
        let student = null;
        try {
          student = await base44.asServiceRole.entities.Student.get(rel.student_id);
        } catch (_e) { continue; }
        if (student && student.status === 'active') {
          allChildren.push({
            id: student.id,
            full_name: student.full_name,
            admission_number: student.admission_number,
            current_class_name: student.current_class_name,
            school_id: student.school_id,
            relationship_type: rel.relationship_type,
            is_primary: rel.is_primary
          });
        }
      }
    }

    if (!studentId) {
      return Response.json({ children: allChildren });
    }

    // Authorize: the requested student must be linked to this parent
    const authorized = allChildren.some((c) => c.id === studentId);
    if (!authorized) {
      return Response.json({ error: 'Not authorized to view this student' }, { status: 403 });
    }

    const [results, attendance] = await Promise.all([
      base44.asServiceRole.entities.Result.filter({ student_id: studentId, status: 'published' }, '-created_date', 200),
      base44.asServiceRole.entities.Attendance.filter({ student_id: studentId }, '-date', 300)
    ]);

    return Response.json({ children: allChildren, results: results || [], attendance: attendance || [] });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}