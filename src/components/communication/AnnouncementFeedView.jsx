import React, { useState, useEffect } from "react";
import { Megaphone, Pin, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AnnouncementCard from "@/components/communication/AnnouncementCard";
import EmptyState from "@/components/admin/EmptyState";
import SearchInput from "@/components/admin/SearchInput";
import { filterAnnouncementsForUser, isExpired, isScheduled } from "@/lib/announcements";

export default function AnnouncementFeedView() {
  const { user, schoolId, role } = useCurrentUser();
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!schoolId || !user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const [annList, notifList] = await Promise.all([
          base44.entities.Announcement.filter({ school_id: schoolId }, "-is_pinned,-created_date", 500),
          base44.entities.Notification.filter({ recipient_user_id: user.id }, "-created_date", 100),
        ]);

        // Resolve user's class context for filtering
        let classIds = [];
        let childrenClassIds = [];
        let teacherClassIds = [];

        if (role === "student") {
          const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5).catch(() => []);
          const me = (students || [])[0];
          if (me?.current_class_id) classIds = [me.current_class_id];
        } else if (role === "parent") {
          // Get children via GuardianRelationship
          const guardianRecs = await base44.entities.ParentGuardian.filter({ user_id: user.id, status: "active" }, "-created_date", 20).catch(() => []);
          const guardianIds = (guardianRecs || []).map((g) => g.id);
          if (guardianIds.length > 0) {
            const allRels = await base44.entities.GuardianRelationship.filter({ school_id: schoolId }, "-created_date", 2000).catch(() => []);
            const myRels = (allRels || []).filter((r) => guardianIds.includes(r.guardian_id));
            const studentIds = [...new Set(myRels.map((r) => r.student_id))];
            if (studentIds.length > 0) {
              const allStudents = await base44.entities.Student.filter({ school_id: schoolId, status: "active" }, "-created_date", 2000).catch(() => []);
              childrenClassIds = [...new Set(
                (allStudents || [])
                  .filter((s) => studentIds.includes(s.id) && s.current_class_id)
                  .map((s) => s.current_class_id)
              )];
            }
          }
        } else if (role === "teacher") {
          const assignments = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_user_id: user.id }, "-created_date", 200).catch(() => []);
          teacherClassIds = [...new Set((assignments || []).map((a) => a.class_id))];
        }

        const filtered = filterAnnouncementsForUser(annList || [], {
          role,
          classIds,
          childrenClassIds,
          teacherClassIds,
        });

        // Filter out expired and scheduled (not yet visible)
        const visible = filtered.filter((a) => !isExpired(a) && !isScheduled(a));

        if (!mounted) return;
        setAnnouncements(visible);
        setNotifications(notifList || []);
      } catch (_e) {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId, user, role]);

  // Build a map of announcement_id → is_read from notifications
  const readMap = {};
  notifications.forEach((n) => {
    if (n.announcement_id) readMap[n.announcement_id] = n.is_read;
  });

  const pinned = announcements.filter((a) => a.is_pinned);
  const unpinned = announcements.filter((a) => !a.is_pinned);

  const filteredPinned = pinned.filter((a) => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredUnpinned = unpinned.filter((a) => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const unreadCount = announcements.filter((a) => readMap[a.id] === false).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread announcement${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
        >
          <option value="all">All categories</option>
          <option value="general">General</option>
          <option value="resumption">Resumption</option>
          <option value="examination">Examination</option>
          <option value="pta">PTA</option>
          <option value="sports">Sports</option>
          <option value="events">Events</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Pinned */}
      {filteredPinned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-[hsl(var(--brand-orange))]" />
            <h2 className="font-heading font-bold text-sm text-foreground">Pinned</h2>
          </div>
          <div className="space-y-3">
            {filteredPinned.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} isRead={readMap[a.id] !== false} />
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div>
        <h2 className="font-heading font-bold text-sm text-foreground mb-3">Recent</h2>
        {filteredUnpinned.length === 0 && filteredPinned.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="There are no announcements for you right now. Check back later."
          />
        ) : filteredUnpinned.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent announcements</p>
        ) : (
          <div className="space-y-3">
            {filteredUnpinned.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} isRead={readMap[a.id] !== false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}