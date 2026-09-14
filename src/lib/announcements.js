/**
 * Announcement feed filtering utilities.
 * Given a list of announcements and the user's context (role, class IDs,
 * children's class IDs, teacher class IDs), returns only the announcements
 * relevant to that user.
 *
 * This is a RELEVANCE filter, not a security boundary — school-level isolation
 * is already enforced by RLS on the Announcement entity.
 */

export function filterAnnouncementsForUser(announcements, userContext) {
  if (!announcements || !userContext) return [];
  const { role, classIds = [], childrenClassIds = [], teacherClassIds = [] } = userContext;

  // Admins see everything in their school
  if (role === 'school_admin' || role === 'super_admin') return announcements;

  return announcements.filter((a) => {
    if (a.status !== 'published') return false;

    if (a.audience_type === 'school') return true;

    if (a.audience_type === 'role') {
      return a.target_role === role;
    }

    if (a.audience_type === 'class') {
      if (!a.target_class_id) return false;
      const userClassIds = [
        ...classIds,
        ...childrenClassIds,
        ...teacherClassIds,
      ];
      if (a.target_role === 'student') return classIds.includes(a.target_class_id);
      if (a.target_role === 'parent') return childrenClassIds.includes(a.target_class_id);
      if (a.target_role === 'teacher') return teacherClassIds.includes(a.target_class_id);
      // No target_role — anyone associated with the class
      return userClassIds.includes(a.target_class_id);
    }

    return false;
  });
}

export function getAudienceLabel(announcement) {
  if (!announcement) return '';
  const { audience_type, target_role, target_class_name } = announcement;
  if (audience_type === 'school') return 'School-wide';
  if (audience_type === 'role') {
    const roleLabel = target_role ? target_role.charAt(0).toUpperCase() + target_role.slice(1) + 's' : 'Role';
    return roleLabel;
  }
  if (audience_type === 'class') {
    const rolePrefix = target_role ? `${target_role.charAt(0).toUpperCase() + target_role.slice(1)}s — ` : '';
    return `${rolePrefix}${target_class_name || 'Class'}`;
  }
  return '';
}

export function formatAnnouncementDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatAnnouncementDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function isExpired(announcement) {
  if (!announcement?.expires_at) return false;
  return new Date(announcement.expires_at) < new Date();
}

export function isScheduled(announcement) {
  if (!announcement?.publish_at) return false;
  return new Date(announcement.publish_at) > new Date();
}