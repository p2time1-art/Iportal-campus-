import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { student_id } = body;

    if (!student_id) {
      return Response.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Verify the current user is authorized to view this student's finance data.
    const student = await base44.entities.Student.get(student_id).catch(() => null);
    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    let authorized = false;

    // Check if user is the student
    if (student.user_id && student.user_id === user.id) {
      authorized = true;
    }

    // Check if user is a parent/guardian of the student
    if (!authorized) {
      const guardians = await base44.entities.ParentGuardian.filter({ user_id: user.id }, '-created_date', 50);
      if (guardians && guardians.length > 0) {
        const guardianIds = guardians.map(g => g.id);
        for (const guardianId of guardianIds) {
          const rels = await base44.entities.GuardianRelationship.filter({
            school_id: student.school_id,
            student_id: student_id,
            guardian_id: guardianId
          }, '-created_date', 10);
          if (rels && rels.length > 0) {
            authorized = true;
            break;
          }
        }
      }
    }

    if (!authorized) {
      return Response.json({ error: 'Not authorized to view this student\'s financial information' }, { status: 403 });
    }

    // Fetch financial data using service role (authorization already verified)
    const [charges, payments, receipts, allocations] = await Promise.all([
      base44.asServiceRole.entities.StudentCharge.filter({ student_id }, '-created_date', 2000),
      base44.asServiceRole.entities.Payment.filter({ student_id }, '-payment_date', 2000),
      base44.asServiceRole.entities.Receipt.filter({ student_id }, '-created_date', 2000),
      base44.asServiceRole.entities.PaymentAllocation.filter({ student_id }, '-created_date', 2000)
    ]);

    return Response.json({
      student,
      charges: charges || [],
      payments: payments || [],
      receipts: receipts || [],
      allocations: allocations || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}