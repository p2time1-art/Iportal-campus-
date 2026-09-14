import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { isPlatformAdmin, createAuditLog } from '../../shared/platformAuth.ts';
import {
  computeOnlinePaymentStats, computeGrowthTrend, computePaymentTrend,
  computeStudentDistribution
} from '../../shared/analytics.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isPlatformAdmin(user)) return Response.json({ error: 'Platform admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { report_type = 'overview' } = body;

    const sr = base44.asServiceRole;

    // Audit log the platform analytics access
    waitUntil(createAuditLog(base44, user, {
      action: 'PLATFORM_ANALYTICS_ACCESSED',
      entity_type: 'analytics',
      description: `${report_type} platform analytics accessed`,
      metadata: { report_type, school_id: body.school_id || '' }
    }));

    const [
      schools, students, teachers, parents, memberships,
      subscriptions, transactions, auditLogs, onlinePayments
    ] = await Promise.all([
      sr.entities.School.list('-created_date', 500),
      sr.entities.Student.list('-created_date', 20000),
      sr.entities.Teacher.list('-created_date', 20000),
      sr.entities.ParentGuardian.list('-created_date', 20000),
      sr.entities.SchoolMembership.list('-created_date', 20000),
      sr.entities.Subscription.list('-created_date', 500),
      sr.entities.PlatformTransaction.list('-created_date', 5000),
      sr.entities.AuditLog.list('-created_date', 50),
      sr.entities.OnlinePaymentTransaction.list('-created_date', 10000)
    ]);

    const schoolList = schools || [];
    const studentList = students || [];
    const teacherList = teachers || [];
    const parentList = parents || [];
    const memberList = memberships || [];
    const subList = subscriptions || [];
    const txnList = transactions || [];
    const onlineList = onlinePayments || [];

    if (report_type === 'overview') {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 86400000);

      const activeSchools = schoolList.filter(s => s.status === 'active').length;
      const suspendedSchools = schoolList.filter(s => s.status === 'suspended').length;
      const activeSubs = subList.filter(s => s.status === 'active').length;
      const expiringSubs = subList.filter(s => s.status === 'active' && s.expiry_date && new Date(s.expiry_date) <= thirtyDays && new Date(s.expiry_date) >= now).length;
      const platformRevenue = txnList.filter(t => t.status === 'successful').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const online = computeOnlinePaymentStats(onlineList);

      // School comparison
      const schoolComparison = schoolList.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        plan: s.plan,
        studentCount: studentList.filter(st => st.school_id === s.id).length,
        teacherCount: teacherList.filter(t => t.school_id === s.id).length,
        parentCount: parentList.filter(p => p.school_id === s.id).length,
        created_date: s.created_date
      })).sort((a, b) => b.studentCount - a.studentCount);

      // Growth trends
      const schoolGrowth = computeGrowthTrend(schoolList, 'created_date');
      const studentGrowth = computeGrowthTrend(studentList, 'created_date');
      const userGrowth = computeGrowthTrend(memberList, 'created_date');

      // Revenue trend
      const revenueTrend = computePaymentTrend(txnList.filter(t => t.status === 'successful').map(t => ({
        ...t,
        amount: t.amount,
        payment_date: t.transaction_date || t.created_date
      })));

      // Users by role
      const byRole: Record<string, number> = {};
      memberList.forEach(m => { byRole[m.role] = (byRole[m.role] || 0) + 1; });

      return Response.json({
        stats: {
          totalSchools: schoolList.length,
          activeSchools, suspendedSchools,
          totalStudents: studentList.length,
          totalTeachers: teacherList.length,
          totalParents: parentList.length,
          totalUsers: memberList.length,
          usersByRole: Object.entries(byRole).map(([role, count]) => ({ role, count })),
          activeSubscriptions: activeSubs,
          expiringSubscriptions: expiringSubs,
          platformRevenue,
          onlinePaymentVolume: online.volume,
          onlinePaymentSuccess: online.successful,
          onlinePaymentFailed: online.failed,
          onlinePaymentPending: online.pending,
          onlinePaymentSuccessRate: online.successRate
        },
        schoolComparison,
        trends: {
          schoolGrowth, studentGrowth, userGrowth, revenueTrend
        },
        recentActivity: (auditLogs || []).slice(0, 20).map(log => ({
          id: log.id, action: log.action, description: log.description,
          actor_name: log.actor_name, actor_role: log.actor_role,
          school_name: log.school_name, created_date: log.created_date
        }))
      });
    }

    if (report_type === 'school_detail') {
      const { school_id } = body;
      if (!school_id) return Response.json({ error: 'School ID required' }, { status: 400 });
      const school = schoolList.find(s => s.id === school_id);
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

      const schoolStudents = studentList.filter(s => s.school_id === school_id);
      const schoolTeachers = teacherList.filter(t => t.school_id === school_id);
      const schoolParents = parentList.filter(p => p.school_id === school_id);
      const schoolMembers = memberList.filter(m => m.school_id === school_id);
      const schoolSubs = subList.filter(s => s.school_id === school_id);
      const schoolTxns = txnList.filter(t => t.school_id === school_id);
      const schoolOnline = onlineList.filter(t => t.school_id === school_id);

      return Response.json({
        school,
        students: computeStudentDistribution(schoolStudents),
        teachers: { total: schoolTeachers.length, active: schoolTeachers.filter(t => t.status === 'active').length },
        parents: { total: schoolParents.length },
        memberships: { total: schoolMembers.length, byRole: Object.entries(schoolMembers.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {})).map(([role, count]) => ({ role, count })) },
        subscriptions: schoolSubs,
        transactions: { total: schoolTxns.length, revenue: schoolTxns.filter(t => t.status === 'successful').reduce((s, t) => s + (Number(t.amount) || 0), 0) },
        onlinePayments: computeOnlinePaymentStats(schoolOnline)
      });
    }

    return Response.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}