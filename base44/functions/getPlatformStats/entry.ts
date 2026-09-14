import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isPlatformAdmin, createAuditLog } from '../../shared/platformAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPlatformAdmin(user)) {
      return Response.json({ error: 'Platform admin access required' }, { status: 403 });
    }

    // Parallel fetch of all platform-wide data using service role (bypasses RLS)
    const [
      schools, students, teachers, parents, memberships,
      subscriptions, transactions, auditLogs, announcements,
      onlinePayments
    ] = await Promise.all([
      base44.asServiceRole.entities.School.list('-created_date', 500),
      base44.asServiceRole.entities.Student.list('-created_date', 10000),
      base44.asServiceRole.entities.Teacher.list('-created_date', 10000),
      base44.asServiceRole.entities.ParentGuardian.list('-created_date', 10000),
      base44.asServiceRole.entities.SchoolMembership.filter({ role: 'school_admin' }, '-created_date', 500),
      base44.asServiceRole.entities.Subscription.list('-created_date', 500),
      base44.asServiceRole.entities.PlatformTransaction.list('-created_date', 500),
      base44.asServiceRole.entities.AuditLog.list('-created_date', 20),
      base44.asServiceRole.entities.Announcement.list('-created_date', 500),
      base44.asServiceRole.entities.OnlinePaymentTransaction.list('-created_date', 5000)
    ]);

    const schoolList = schools || [];
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeSchools = schoolList.filter(s => s.status === 'active').length;
    const suspendedSchools = schoolList.filter(s => s.status === 'suspended').length;

    const subList = subscriptions || [];
    const activeSubscriptions = subList.filter(s => s.status === 'active').length;
    const expiringSubscriptions = subList.filter(s =>
      s.status === 'active' && s.expiry_date &&
      new Date(s.expiry_date) <= thirtyDays && new Date(s.expiry_date) >= now
    ).length;

    const txnList = transactions || [];
    const platformRevenue = txnList
      .filter(t => t.status === 'successful')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Per-school student/teacher counts for recent schools
    const recentSchools = schoolList.slice(0, 6).map(s => {
      const studentCount = (students || []).filter(st => st.school_id === s.id).length;
      const teacherCount = (teachers || []).filter(t => t.school_id === s.id).length;
      return {
        id: s.id,
        name: s.name,
        school_code: s.school_code || s.short_name || '',
        status: s.status,
        plan: s.plan,
        studentCount,
        teacherCount,
        created_date: s.created_date
      };
    });

    // Online payment stats
    const onlinePaymentList = onlinePayments || [];
    const onlinePaymentVolume = onlinePaymentList
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const onlinePaymentSuccessCount = onlinePaymentList.filter(t => t.status === 'success').length;
    const onlinePaymentFailedCount = onlinePaymentList.filter(t => t.status === 'failed').length;
    const onlinePaymentPendingCount = onlinePaymentList.filter(t => ['pending', 'initiated'].includes(t.status)).length;

    return Response.json({
      stats: {
        totalSchools: schoolList.length,
        activeSchools,
        suspendedSchools,
        totalStudents: (students || []).length,
        totalTeachers: (teachers || []).length,
        totalParents: (parents || []).length,
        totalSchoolAdmins: (memberships || []).length,
        activeSubscriptions,
        expiringSubscriptions,
        platformRevenue,
        totalAnnouncements: (announcements || []).length,
        publishedAnnouncements: (announcements || []).filter(a => a.status === 'published').length,
        scheduledAnnouncements: (announcements || []).filter(a => a.status === 'scheduled').length,
        onlinePaymentVolume,
        onlinePaymentSuccessCount,
        onlinePaymentFailedCount,
        onlinePaymentPendingCount
      },
      recentSchools,
      recentActivity: (auditLogs || []).map(log => ({
        id: log.id,
        action: log.action,
        description: log.description,
        actor_name: log.actor_name,
        actor_role: log.actor_role,
        school_name: log.school_name,
        created_date: log.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}