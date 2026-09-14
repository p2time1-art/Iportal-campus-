import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { isPlatformAdmin, createAuditLog } from '../../shared/platformAuth.ts';
import {
  computeGradeDistribution, computeSubjectPerformance, computeClassPerformance,
  computePassRate, computeOverallAverage, computeAttendanceStats, computeAttendanceTrend,
  computeAttendanceByClass, computeFinancialSummary, computeChargeBreakdown,
  computePaymentMethodBreakdown, computePaymentTrend, computeOnlinePaymentStats,
  computeStudentDistribution, computeStaffStats, computeAssignmentStats, getPassThreshold
} from '../../shared/analytics.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { report_type = 'overview', school_id, session_id, term_id, class_id, subject_id } = body;

    const isSuperAdmin = isPlatformAdmin(user);
    const userRole = user.data?.active_role || 'user';
    const activeSchoolId = user.data?.active_school_id || '';

    // Determine effective school
    const effectiveSchoolId = school_id || activeSchoolId;
    if (!effectiveSchoolId) return Response.json({ error: 'No school context' }, { status: 400 });

    // Authorization: non-super-admins can only access their own school
    if (!isSuperAdmin && school_id && school_id !== activeSchoolId) {
      return Response.json({ error: 'Not authorized for this school' }, { status: 403 });
    }

    // Role-based access control for report types
    const isSchoolAdmin = user.data?.is_school_admin || isSuperAdmin;
    if (!isSchoolAdmin && !['teacher', 'student', 'parent'].includes(userRole)) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Build base filter
    const sf: any = { school_id: effectiveSchoolId };
    if (session_id) sf.session_id = session_id;
    if (term_id) sf.term_id = term_id;

    // Role-specific filters
    let roleFilter: any = {};
    if (userRole === 'teacher' && !isSchoolAdmin) {
      const teachers = await base44.asServiceRole.entities.Teacher.filter({ user_id: user.id }, '-created_date', 5);
      const myTeacher = (teachers || [])[0];
      if (myTeacher) {
        const ta = await base44.asServiceRole.entities.TeacherAssignment.filter({ school_id: effectiveSchoolId, teacher_id: myTeacher.id }, '-created_date', 200);
        roleFilter.teacher_user_id = user.id;
        roleFilter.class_ids = [...new Set((ta || []).map(a => a.class_id))];
        roleFilter.subject_ids = [...new Set((ta || []).map(a => a.subject_id))];
      }
    } else if (userRole === 'student' && !isSchoolAdmin) {
      const students = await base44.asServiceRole.entities.Student.filter({ user_id: user.id, school_id: effectiveSchoolId }, '-created_date', 5);
      const myStudent = (students || [])[0];
      if (myStudent) {
        roleFilter.student_id = myStudent.id;
        roleFilter.student_user_id = user.id;
      }
    } else if (userRole === 'parent' && !isSchoolAdmin) {
      const guardians = await base44.asServiceRole.entities.ParentGuardian.filter({ user_id: user.id, school_id: effectiveSchoolId }, '-created_date', 10);
      const guardianIds = (guardians || []).map(g => g.id);
      let linkedStudentIds: string[] = [];
      for (const gid of guardianIds) {
        const rels = await base44.asServiceRole.entities.GuardianRelationship.filter({ school_id: effectiveSchoolId, guardian_id: gid }, '-created_date', 50);
        linkedStudentIds.push(...(rels || []).map(r => r.student_id));
      }
      roleFilter.student_ids = [...new Set(linkedStudentIds)];
    }

    // Helper: apply role filter to results/attendance/etc
    const applyRoleFilter = (records: any[]) => {
      if (roleFilter.teacher_user_id) return records.filter(r => r.teacher_user_id === user.id || (roleFilter.class_ids?.includes(r.class_id)));
      if (roleFilter.student_user_id) return records.filter(r => r.student_user_id === user.id);
      if (roleFilter.student_ids) return records.filter(r => roleFilter.student_ids.includes(r.student_id));
      return records;
    };

    const sr = base44.asServiceRole;

    // Audit log the report access (async, non-blocking)
    waitUntil(createAuditLog(base44, user, {
      action: 'SCHOOL_ANALYTICS_ACCESSED',
      entity_type: 'analytics',
      school_id: effectiveSchoolId,
      description: `${report_type} analytics report accessed`,
      metadata: { report_type, session_id: session_id || '', term_id: term_id || '', class_id: class_id || '' }
    }));

    switch (report_type) {
      case 'overview': {
        const [students, teachers, results, attendance, charges, payments, onlineTxns, assignments, subs] = await Promise.all([
          sr.entities.Student.filter({ school_id: effectiveSchoolId }, '-created_date', 2000),
          sr.entities.Teacher.filter({ school_id: effectiveSchoolId }, '-created_date', 2000),
          sr.entities.Result.filter({ ...sf, status: 'published' }, '-created_date', 5000),
          sr.entities.Attendance.filter(sf, '-date', 5000),
          sr.entities.StudentCharge.filter(sf, '-created_date', 5000),
          sr.entities.Payment.filter(sf, '-payment_date', 5000),
          sr.entities.OnlinePaymentTransaction.filter({ school_id: effectiveSchoolId }, '-created_date', 5000),
          sr.entities.Assignment.filter({ school_id: effectiveSchoolId, status: 'published' }, '-created_date', 2000),
          sr.entities.AssignmentSubmission.filter({ school_id: effectiveSchoolId }, '-created_date', 5000)
        ]);

        const filteredResults = applyRoleFilter(results || []);
        const filteredAtt = applyRoleFilter(attendance || []);
        const filteredCharges = isSchoolAdmin ? (charges || []) : (roleFilter.student_id ? (charges || []).filter(c => c.student_id === roleFilter.student_id) : roleFilter.student_ids ? (charges || []).filter(c => roleFilter.student_ids.includes(c.student_id)) : []);
        const filteredPayments = isSchoolAdmin ? (payments || []) : (roleFilter.student_id ? (payments || []).filter(p => p.student_id === roleFilter.student_id) : roleFilter.student_ids ? (payments || []).filter(p => roleFilter.student_ids.includes(p.student_id)) : []);
        const filteredAssignments = roleFilter.teacher_user_id ? (assignments || []).filter(a => a.teacher_user_id === user.id) : (assignments || []);
        const filteredSubs = applyRoleFilter(subs || []);

        const fin = computeFinancialSummary(filteredCharges, filteredPayments);
        const att = computeAttendanceStats(filteredAtt);
        const online = computeOnlinePaymentStats(onlineTxns || []);

        return Response.json({
          students: { total: (students || []).length, active: (students || []).filter(s => s.status === 'active').length },
          staff: { total: (teachers || []).length, active: (teachers || []).filter(t => t.status === 'active').length },
          academic: {
            totalResults: filteredResults.length,
            average: computeOverallAverage(filteredResults),
            passRate: computePassRate(filteredResults).pass_rate
          },
          attendance: att,
          finance: fin,
          onlinePayments: online,
          assignments: { total: filteredAssignments.length, submissions: filteredSubs.length }
        });
      }

      case 'academic': {
        let results = await sr.entities.Result.filter({ ...sf, ...(class_id ? { class_id } : {}), ...(subject_id ? { subject_id } : {}) }, '-created_date', 10000);
        results = applyRoleFilter(results || []);

        // Get grading scheme for pass threshold
        let passThreshold = 40;
        if (session_id) {
          const schemes = await sr.entities.GradingScheme.filter({ school_id: effectiveSchoolId }, '-created_date', 10);
          const activeScheme = (schemes || []).find(s => s.is_active) || (schemes || [])[0];
          if (activeScheme) passThreshold = getPassThreshold(activeScheme);
        }

        const gradeDist = computeGradeDistribution(results);
        const subjectPerf = computeSubjectPerformance(results);
        const classPerf = computeClassPerformance(results);
        const passRate = computePassRate(results, passThreshold);
        const overallAvg = computeOverallAverage(results);

        // Term performance: group by term
        const byTerm: Record<string, { term_name: string; percentages: number[] }> = {};
        results.forEach(r => {
          const key = r.term_id;
          if (!byTerm[key]) byTerm[key] = { term_name: r.term_name || 'Unknown', percentages: [] };
          byTerm[key].percentages.push(Number(r.percentage) || 0);
        });
        const termPerf = Object.entries(byTerm).map(([term_id, d]) => ({
          term_id, term_name: d.term_name,
          average: d.percentages.length > 0 ? Math.round(d.percentages.reduce((a, b) => a + b, 0) / d.percentages.length * 10) / 10 : 0,
          count: d.percentages.length
        })).sort((a, b) => b.average - a.average);

        // Best/worst subjects
        const bestSubjects = subjectPerf.slice(0, 5);
        const worstSubjects = [...subjectPerf].sort((a, b) => a.average_percentage - b.average_percentage).slice(0, 5);

        return Response.json({
          totalResults: results.length,
          overallAverage: overallAvg,
          passRate,
          gradeDistribution: gradeDist,
          subjectPerformance: subjectPerf,
          classPerformance: classPerf,
          termPerformance: termPerf,
          bestSubjects,
          worstSubjects
        });
      }

      case 'attendance': {
        let attendance = await sr.entities.Attendance.filter({ ...sf, ...(class_id ? { class_id } : {}) }, '-date', 10000);
        attendance = applyRoleFilter(attendance || []);

        const stats = computeAttendanceStats(attendance);
        const trend = computeAttendanceTrend(attendance, 'month');
        const byClass = computeAttendanceByClass(attendance);

        // By student
        const byStudent: Record<string, { student_name: string; records: any[] }> = {};
        attendance.forEach(a => {
          const key = a.student_id;
          if (!byStudent[key]) byStudent[key] = { student_name: a.student_name || 'Unknown', records: [] };
          byStudent[key].records.push(a);
        });
        const studentAtt = Object.entries(byStudent).map(([student_id, d]) => ({
          student_id, student_name: d.student_name, ...computeAttendanceStats(d.records)
        })).sort((a, b) => b.attendance_rate - a.attendance_rate).slice(0, 50);

        return Response.json({ stats, trend, byClass, byStudent: studentAtt });
      }

      case 'financial': {
        let charges = await sr.entities.StudentCharge.filter({ ...sf, ...(class_id ? { class_id } : {}) }, '-created_date', 10000);
        let payments = await sr.entities.Payment.filter(sf, '-payment_date', 10000);
        const onlineTxns = await sr.entities.OnlinePaymentTransaction.filter({ school_id: effectiveSchoolId }, '-created_date', 10000);

        if (!isSchoolAdmin) {
          if (roleFilter.student_id) {
            charges = (charges || []).filter(c => c.student_id === roleFilter.student_id);
            payments = (payments || []).filter(p => p.student_id === roleFilter.student_id);
          } else if (roleFilter.student_ids) {
            charges = (charges || []).filter(c => roleFilter.student_ids.includes(c.student_id));
            payments = (payments || []).filter(p => roleFilter.student_ids.includes(p.student_id));
          }
        }

        const summary = computeFinancialSummary(charges, payments);
        const byCategory = computeChargeBreakdown(charges, 'category_name');
        const byClass = computeChargeBreakdown(charges, 'class_name');
        const bySession = computeChargeBreakdown(charges, 'session_name');
        const byTerm = computeChargeBreakdown(charges, 'term_name');
        const methodBreakdown = computePaymentMethodBreakdown(payments);
        const paymentTrend = computePaymentTrend(payments);
        const onlineStats = computeOnlinePaymentStats(onlineTxns);

        // Payment status breakdown
        const statusBreakdown: Record<string, number> = {};
        (payments || []).forEach(p => { statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1; });

        return Response.json({
          summary,
          byCategory, byClass, bySession, byTerm,
          methodBreakdown, paymentTrend, onlineStats,
          paymentStatusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count }))
        });
      }

      case 'students': {
        if (!isSchoolAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });
        const students = await sr.entities.Student.filter({ school_id: effectiveSchoolId }, '-created_date', 5000);
        return Response.json(computeStudentDistribution(students));
      }

      case 'staff': {
        if (!isSchoolAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });
        const [teachers, ta] = await Promise.all([
          sr.entities.Teacher.filter({ school_id: effectiveSchoolId }, '-created_date', 2000),
          sr.entities.TeacherAssignment.filter({ school_id: effectiveSchoolId }, '-created_date', 2000)
        ]);
        return Response.json(computeStaffStats(teachers, ta));
      }

      case 'assignments': {
        let assignments = await sr.entities.Assignment.filter({ school_id: effectiveSchoolId, ...(session_id ? { session_id } : {}), ...(term_id ? { term_id } : {}), ...(class_id ? { class_id } : {}), ...(subject_id ? { subject_id } : {}) }, '-created_date', 5000);
        let subs = await sr.entities.AssignmentSubmission.filter({ school_id: effectiveSchoolId, ...(session_id ? {} : {}), ...(class_id ? { class_id } : {}), ...(subject_id ? { subject_id } : {}) }, '-created_date', 10000);

        if (roleFilter.teacher_user_id) {
          assignments = (assignments || []).filter(a => a.teacher_user_id === user.id);
          subs = (subs || []).filter(s => s.teacher_user_id === user.id);
        } else if (roleFilter.student_user_id) {
          subs = (subs || []).filter(s => s.student_user_id === user.id);
        } else if (roleFilter.student_ids) {
          subs = (subs || []).filter(s => roleFilter.student_ids.includes(s.student_id));
        }

        return Response.json(computeAssignmentStats(assignments, subs));
      }

      default:
        return Response.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}