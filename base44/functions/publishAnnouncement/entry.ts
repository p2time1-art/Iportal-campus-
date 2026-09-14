import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createAuditLog } from '../../shared/platformAuth.ts';

/**
 * Publishes an announcement: resolves the audience server-side, creates
 * idempotent notification records for each recipient, and updates the
 * announcement status. Also supports unpublish, archive, and delete actions.
 *
 * Security:
 *  - Only school admins (or platform admins) can invoke.
 *  - The announcement's school_id MUST match the caller's active_school_id.
 *  - Recipient resolution is performed server-side using the service role.
 *  - Duplicate notifications are prevented (idempotent per announcement+recipient).
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isSchoolAdmin = !!(user.data?.is_school_admin || user.role === 'admin');
    if (!isSchoolAdmin) {
      return Response.json({ error: 'School admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'publish': return await publishAnnouncement(base44, user, body);
      case 'unpublish': return await setAnnouncementStatus(base44, user, body, 'draft');
      case 'archive': return await setAnnouncementStatus(base44, user, body, 'archived');
      case 'pin': return await setPinned(base44, user, body, true);
      case 'unpin': return await setPinned(base44, user, body, false);
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function publishAnnouncement(base44: any, user: any, body: any) {
  const { announcement_id } = body;
  if (!announcement_id) {
    return Response.json({ error: 'Announcement ID is required' }, { status: 400 });
  }

  // Fetch the announcement using service role (bypasses RLS for cross-entity reads)
  const announcement = await base44.asServiceRole.entities.Announcement.get(announcement_id);
  if (!announcement) {
    return Response.json({ error: 'Announcement not found' }, { status: 404 });
  }

  // Verify the caller belongs to the same school
  const userSchoolId = user.data?.active_school_id || '';
  if (user.role !== 'admin' && announcement.school_id !== userSchoolId) {
    return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
  }

  // Check if scheduled for the future
  const now = new Date();
  const publishAt = announcement.publish_at ? new Date(announcement.publish_at) : null;
  const isScheduled = publishAt && publishAt > now;

  if (isScheduled) {
    // Set to scheduled — notifications will be created when it actually publishes
    await base44.asServiceRole.entities.Announcement.update(announcement_id, { status: 'scheduled' });
    await createAuditLog(base44, user, {
      action: 'announcement.scheduled',
      entity_type: 'Announcement',
      entity_id: announcement_id,
      school_id: announcement.school_id,
      description: `Scheduled announcement "${announcement.title}" for ${publishAt.toISOString()}`,
    });
    return Response.json({ status: 'scheduled', message: 'Announcement scheduled' });
  }

  // Resolve recipients based on audience type
  const recipientUserIds = await resolveRecipients(base44, announcement);

  if (recipientUserIds.length === 0) {
    // Still mark as published, but note no recipients
    await base44.asServiceRole.entities.Announcement.update(announcement_id, { status: 'published' });
    await createAuditLog(base44, user, {
      action: 'announcement.published',
      entity_type: 'Announcement',
      entity_id: announcement_id,
      school_id: announcement.school_id,
      description: `Published announcement "${announcement.title}" (0 recipients)`,
    });
    return Response.json({ status: 'published', recipientCount: 0, message: 'Published with no recipients' });
  }

  // Idempotency: check for existing notifications for this announcement
  const existing = await base44.asServiceRole.entities.Notification.filter(
    { announcement_id: announcement_id }, '-created_date', 1000
  );
  const existingIds = new Set((existing || []).map((n) => n.recipient_user_id));
  const newUserIds = recipientUserIds.filter((uid) => uid && !existingIds.has(uid));

  // Create notification records (bulk)
  if (newUserIds.length > 0) {
    const notifications = newUserIds.map((uid) => ({
      school_id: announcement.school_id,
      recipient_user_id: uid,
      announcement_id: announcement_id,
      title: announcement.title,
      message: announcement.description || '',
      notification_type: 'announcement',
      is_read: false,
    }));
    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
  }

  // Update announcement status
  await base44.asServiceRole.entities.Announcement.update(announcement_id, { status: 'published' });

  await createAuditLog(base44, user, {
    action: 'announcement.published',
    entity_type: 'Announcement',
    entity_id: announcement_id,
    school_id: announcement.school_id,
    description: `Published announcement "${announcement.title}" to ${newUserIds.length} recipients`,
    metadata: { audience_type: announcement.audience_type, target_role: announcement.target_role, recipient_count: newUserIds.length },
  });

  return Response.json({
    status: 'published',
    recipientCount: newUserIds.length,
    totalRecipients: recipientUserIds.length,
    message: `Published to ${newUserIds.length} recipients`,
  });
}

async function resolveRecipients(base44: any, announcement: any): Promise<string[]> {
  const { school_id, audience_type, target_role, target_class_id } = announcement;
  const userIds = new Set<string>();

  if (audience_type === 'school') {
    // All active members of the school
    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter(
      { school_id: school_id, status: 'active' }, '-created_date', 2000
    );
    (memberships || []).forEach((m) => { if (m.user_id) userIds.add(m.user_id); });
  } else if (audience_type === 'role') {
    // Members with a specific role
    const filter: any = { school_id: school_id, status: 'active' };
    const roleMap = { teacher: 'teacher', student: 'student', parent: 'parent' };
    if (target_role && roleMap[target_role]) {
      filter.role = roleMap[target_role];
    }
    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter(
      filter, '-created_date', 2000
    );
    (memberships || []).forEach((m) => { if (m.user_id) userIds.add(m.user_id); });
  } else if (audience_type === 'class') {
    // Class-targeted: resolve based on target_role
    if (!target_class_id) return [];

    if (!target_role || target_role === 'student') {
      // Students in the class
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: school_id, current_class_id: target_class_id, status: 'active' }, '-created_date', 500
      );
      (students || []).forEach((s) => { if (s.user_id) userIds.add(s.user_id); });
    }

    if (!target_role || target_role === 'teacher') {
      // Teachers assigned to the class
      const assignments = await base44.asServiceRole.entities.TeacherAssignment.filter(
        { school_id: school_id, class_id: target_class_id }, '-created_date', 200
      );
      (assignments || []).forEach((a) => { if (a.teacher_user_id) userIds.add(a.teacher_user_id); });
    }

    if (!target_role || target_role === 'parent') {
      // Parents/guardians of students in the class
      const students = await base44.asServiceRole.entities.Student.filter(
        { school_id: school_id, current_class_id: target_class_id, status: 'active' }, '-created_date', 500
      );
      const studentIds = (students || []).map((s) => s.id).filter(Boolean);
      if (studentIds.length > 0) {
        // Get guardian relationships for these students
        const guardianRels = await base44.asServiceRole.entities.GuardianRelationship.filter(
          { school_id: school_id }, '-created_date', 2000
        );
        const relevantRels = (guardianRels || []).filter((gr) => studentIds.includes(gr.student_id));
        const guardianIds = [...new Set(relevantRels.map((gr) => gr.guardian_id).filter(Boolean))];

        if (guardianIds.length > 0) {
          // Get ParentGuardian records to find user_ids
          const allParents = await base44.asServiceRole.entities.ParentGuardian.filter(
            { school_id: school_id, status: 'active' }, '-created_date', 2000
          );
          (allParents || []).forEach((p) => {
            if (p.user_id && guardianIds.includes(p.id)) userIds.add(p.user_id);
          });
        }
      }
    }
  }

  return Array.from(userIds);
}

async function setAnnouncementStatus(base44: any, user: any, body: any, status: string) {
  const { announcement_id } = body;
  if (!announcement_id) {
    return Response.json({ error: 'Announcement ID is required' }, { status: 400 });
  }

  const announcement = await base44.asServiceRole.entities.Announcement.get(announcement_id);
  if (!announcement) {
    return Response.json({ error: 'Announcement not found' }, { status: 404 });
  }

  const userSchoolId = user.data?.active_school_id || '';
  if (user.role !== 'admin' && announcement.school_id !== userSchoolId) {
    return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
  }

  await base44.asServiceRole.entities.Announcement.update(announcement_id, { status });

  await createAuditLog(base44, user, {
    action: `announcement.${status}`,
    entity_type: 'Announcement',
    entity_id: announcement_id,
    school_id: announcement.school_id,
    description: `Set announcement "${announcement.title}" to ${status}`,
  });

  return Response.json({ status, message: `Announcement ${status}` });
}

async function setPinned(base44: any, user: any, body: any, isPinned: boolean) {
  const { announcement_id } = body;
  if (!announcement_id) {
    return Response.json({ error: 'Announcement ID is required' }, { status: 400 });
  }

  const announcement = await base44.asServiceRole.entities.Announcement.get(announcement_id);
  if (!announcement) {
    return Response.json({ error: 'Announcement not found' }, { status: 404 });
  }

  const userSchoolId = user.data?.active_school_id || '';
  if (user.role !== 'admin' && announcement.school_id !== userSchoolId) {
    return Response.json({ error: 'Cross-school access denied' }, { status: 403 });
  }

  await base44.asServiceRole.entities.Announcement.update(announcement_id, { is_pinned: isPinned });

  await createAuditLog(base44, user, {
    action: isPinned ? 'announcement.pinned' : 'announcement.unpinned',
    entity_type: 'Announcement',
    entity_id: announcement_id,
    school_id: announcement.school_id,
    description: `${isPinned ? 'Pinned' : 'Unpinned'} announcement "${announcement.title}"`,
  });

  return Response.json({ is_pinned: isPinned, message: `Announcement ${isPinned ? 'pinned' : 'unpinned'}` });
}