import React, { useState, useEffect } from "react";
import { Megaphone, Pin, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterAnnouncementsForUser, getAudienceLabel, formatAnnouncementDate, isExpired, isScheduled } from "@/lib/announcements";

/**
 * Reusable recent-announcements widget for role dashboards.
 * Fetches relevant announcements and shows the latest few with unread indicators.
 */
export default function RecentAnnouncements({ maxItems = 3, showUnreadCount = true }) {
  const { user, schoolId, role } = useCurrentUser();
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const [annList, notifList] = await Promise.all([
          base44.entities.Announcement.filter({ school_id: schoolId }, "-is_pinned,-created_date", 100),
          base44.entities.Notification.filter({ recipient_user_id: user.id }, "-created_date", 100),
        ]);

        let classIds = [];
        let childrenClassIds = [];
        let teacherClassIds = [];

        if (role === "student") {
          const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5).catch(() => []);
          const me = (students || [])[0];
          if (me?.current_class_id) classIds = [me.current_class_id];
        } else if (role === "parent") {
          const guardianRecs = await base44.entities.ParentGuardian.filter({ user_id: user.id, status: "active" }, "-created_date", 20).catch(() => []);
          const guardianIds = (guardianRecs || []).map((g) => g.id);
          if (guardianIds.length > 0) {
            const allRels = await base44.entities.GuardianRelationship.filter({ school_id: schoolId }, "-created_date", 2000).catch(() => []);
            const myRels = (allRels || []).filter((r) => guardianIds.includes(r.guardian_id));
            const studentIds = [...new Set(myRels.map((r) => r.student_id))];
            if (studentIds.length > 0) {
              const allStudents = await base44.entities.Student.filter({ school_id: schoolId, status: "active" }, "-created_date", 2000).catch(() => []);
              childrenClassIds = [...new Set(
                (allStudents || []).filter((s) => studentIds.includes(s.id) && s.current_class_id).map((s) => s.current_class_id)
              )];
            }
          }
        } else if (role === "teacher") {
          const assignments = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_user_id: user.id }, "-created_date", 200).catch(() => []);
          teacherClassIds = [...new Set((assignments || []).map((a) => a.class_id))];
        }

        let relevant = annList || [];
        if (role !== "school_admin" && role !== "super_admin") {
          relevant = filterAnnouncementsForUser(annList || [], { role, classIds, childrenClassIds, teacherClassIds });
        }
        relevant = relevant.filter((a) => !isExpired(a) && !isScheduled(a));

        if (!mounted) return;
        setAnnouncements(relevant.slice(0, maxItems));
        setNotifications(notifList || []);
      } catch (_e) {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId, user, role, maxItems]);

  const readMap = {};
  notifications.forEach((n) => { if (n.announcement_id) readMap[n.announcement_id] = n.is_read; });
  const unreadCount = announcements.filter((a) => readMap[a.id] === false).length;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
          <h3 className="font-heading font-bold text-lg text-foreground">Announcements</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
          <h3 className="font-heading font-bold text-lg text-foreground">Announcements</h3>
          {showUnreadCount && unreadCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link to="/app/announcements" className="text-sm font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1 hover:gap-2 transition-all">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No announcements right now.</p>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Link
              key={a.id}
              to={`/app/announcements/${a.id}`}
              className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:border-[hsl(var(--brand-indigo))]/30 hover:bg-[hsl(var(--brand-indigo))]/5 transition-all"
            >
              {a.is_pinned && <Pin className="w-3.5 h-3.5 text-[hsl(var(--brand-orange))] shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${readMap[a.id] === false ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                  {a.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-muted-foreground/70">{formatAnnouncementDate(a.publish_at || a.date || a.created_date)}</span>
                  <span className="text-[11px] text-muted-foreground/70">·</span>
                  <span className="text-[11px] text-muted-foreground/70">{getAudienceLabel(a)}</span>
                </div>
              </div>
              {readMap[a.id] === false && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-indigo))] shrink-0 mt-1.5" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}