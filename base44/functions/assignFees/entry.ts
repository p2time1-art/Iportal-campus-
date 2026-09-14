import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school_id, academic_session_id, term_id, class_id, student_ids } = body;

    if (!school_id || !academic_session_id) {
      return Response.json({ error: 'School and session are required' }, { status: 400 });
    }

    // Authorization: verify user belongs to this school
    const userSchoolId = user.data?.active_school_id || '';
    const isSuperAdmin = user.data?.is_super_admin || user.role === 'admin';
    if (!isSuperAdmin && userSchoolId !== school_id) {
      return Response.json({ error: 'Not authorized for this school' }, { status: 403 });
    }

    // Get active fee structures matching criteria
    const feeFilter = { school_id, academic_session_id, status: 'active' };
    if (term_id) feeFilter.term_id = term_id;
    if (class_id) feeFilter.class_id = class_id;
    const structures = await base44.entities.FeeStructure.filter(feeFilter, '-created_date', 500);

    if (!structures || structures.length === 0) {
      return Response.json({ error: 'No active fee structures found for the selected criteria' }, { status: 400 });
    }

    // Get students — either specific IDs, all in a class, or all in school
    let students = [];
    if (student_ids && student_ids.length > 0) {
      for (const sid of student_ids) {
        const s = await base44.entities.Student.get(sid).catch(() => null);
        if (s && s.school_id === school_id) students.push(s);
      }
    } else if (class_id) {
      students = await base44.entities.Student.filter({ school_id, current_class_id: class_id, status: 'active' }, 'full_name', 500);
    } else {
      students = await base44.entities.Student.filter({ school_id, status: 'active' }, 'full_name', 500);
    }

    if (!students || students.length === 0) {
      return Response.json({ error: 'No active students found' }, { status: 400 });
    }

    // Get existing charges to prevent duplicates (idempotent)
    const existingCharges = await base44.entities.StudentCharge.filter({ school_id, academic_session_id }, '-created_date', 5000);
    const existingKeys = new Set();
    (existingCharges || []).forEach(c => {
      existingKeys.add(`${c.student_id}|${c.fee_structure_id}`);
    });

    // Build charges to create
    const chargesToCreate = [];
    for (const student of students) {
      for (const fs of structures) {
        // Skip class-specific structures that don't match student's class
        if (fs.class_id && fs.class_id !== student.current_class_id) continue;

        const key = `${student.id}|${fs.id}`;
        if (existingKeys.has(key)) continue;

        chargesToCreate.push({
          school_id,
          student_id: student.id,
          student_name: student.full_name,
          student_user_id: student.user_id || '',
          admission_number: student.admission_number || '',
          fee_structure_id: fs.id,
          academic_session_id: fs.academic_session_id,
          session_name: fs.session_name || '',
          term_id: fs.term_id || '',
          term_name: fs.term_name || '',
          class_id: student.current_class_id || fs.class_id || '',
          class_name: student.current_class_name || fs.class_name || '',
          fee_category_id: fs.fee_category_id,
          category_name: fs.category_name || '',
          amount: fs.amount,
          discount_amount: 0,
          net_amount: fs.amount,
          amount_paid: 0,
          due_date: fs.due_date || '',
          status: 'pending'
        });
        existingKeys.add(key); // prevent dup within this batch
      }
    }

    if (chargesToCreate.length > 0) {
      await base44.entities.StudentCharge.bulkCreate(chargesToCreate);
    }

    return Response.json({
      created: chargesToCreate.length,
      skipped: (students.length * structures.length) - chargesToCreate.length,
      total_students: students.length,
      total_structures: structures.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}