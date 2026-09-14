import React, { useState, useEffect } from "react";
import { Megaphone, Pin, Archive, Send, EyeOff, Trash2, Edit3, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AnnouncementFormDrawer from "@/components/communication/AnnouncementFormDrawer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { getAudienceLabel, formatAnnouncementDate, isExpired, isScheduled } from "@/lib/announcements";

export default function AnnouncementAdminView() {
  const { user, membership, schoolId } = useCurrentUser();
  const { classes } = useAcademicContext(schoolId);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    fetchAnnouncements();
  }, [schoolId]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Announcement.filter(
        { school_id: schoolId }, "-is_pinned,-created_date", 500
      );
      setAnnouncements(list || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  const filtered = announcements.filter((a) => {
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchAudience = audienceFilter === "all" || a.audience_type === audienceFilter;
    return matchSearch && matchStatus && matchAudience;
  });

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (a) => {
    setEditing(a);
    setDrawerOpen(true);
  };

  const handleSave = async (payload) => {
    if (editing) {
      await base44.entities.Announcement.update(editing.id, payload);
    } else {
      const created = await base44.entities.Announcement.create(payload);
      // If published immediately, invoke the publish function to create notifications
      if (payload.status === "published" && created?.id) {
        try {
          await base44.functions.invoke("publishAnnouncement", {
            action: "publish",
            announcement_id: created.id,
          });
        } catch (_e) {
          // non-fatal — announcement is still created
        }
      }
    }
    setDrawerOpen(false);
    setEditing(null);
    fetchAnnouncements();
  };

  const handleAction = async (a, action) => {
    setActionLoading(a.id);
    try {
      await base44.functions.invoke("publishAnnouncement", {
        action: action,
        announcement_id: a.id,
      });
      fetchAnnouncements();
    } catch (_e) {
      // non-fatal
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (a) => {
    setActionLoading(a.id);
    try {
      await base44.functions.invoke("publishAnnouncement", {
        action: a.is_pinned ? "unpin" : "pin",
        announcement_id: a.id,
      });
      fetchAnnouncements();
    } catch (_e) {
      // non-fatal
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Announcement.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (_e) {
      // non-fatal
    } finally {
      setDeleting(false);
    }
  };

  const statusColors = {
    draft: "bg-secondary text-muted-foreground",
    scheduled: "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]",
    published: "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]",
    expired: "bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]",
    archived: "bg-secondary text-muted-foreground",
  };

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        subtitle="Create and manage school-wide communications"
        actionLabel="Create Announcement"
        onAction={handleCreate}
        icon={Megaphone}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
        >
          <option value="all">All audiences</option>
          <option value="school">School-wide</option>
          <option value="role">Role-targeted</option>
          <option value="class">Class-targeted</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create your first announcement to communicate with your school."
          actionLabel="Create Announcement"
          onAction={handleCreate}
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/60 bg-secondary/30">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Audience</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const expired = isExpired(a);
                  const scheduled = isScheduled(a);
                  const displayStatus = expired && a.status === "published" ? "expired" : (scheduled && a.status === "published" ? "scheduled" : a.status);
                  return (
                    <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {a.is_pinned && <Pin className="w-3.5 h-3.5 text-[hsl(var(--brand-orange))] shrink-0" />}
                          <div>
                            <p className="font-semibold text-foreground">{a.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-muted-foreground">{getAudienceLabel(a)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[displayStatus] || statusColors.draft}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.author_name || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatAnnouncementDate(a.publish_at || a.date || a.created_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="Edit">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {a.status === "draft" && (
                                <button onClick={() => handleAction(a, "publish")} className="p-1.5 rounded-lg hover:bg-[hsl(var(--brand-green))]/10 text-muted-foreground hover:text-[hsl(var(--brand-green))]" title="Publish">
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              {a.status === "published" && !expired && (
                                <button onClick={() => handleAction(a, "unpublish")} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="Unpublish">
                                  <EyeOff className="w-4 h-4" />
                                </button>
                              )}
                              {a.status !== "archived" && (
                                <button onClick={() => handleAction(a, "archive")} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="Archive">
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleTogglePin(a)} className={`p-1.5 rounded-lg hover:bg-secondary ${a.is_pinned ? "text-[hsl(var(--brand-orange))]" : "text-muted-foreground hover:text-foreground"}`} title={a.is_pinned ? "Unpin" : "Pin"}>
                                <Pin className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--brand-red))]/10 text-muted-foreground hover:text-[hsl(var(--brand-red))]" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnnouncementFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        onSave={handleSave}
        announcement={editing}
        classes={classes}
        schoolId={schoolId}
        userId={user?.id}
        userName={user?.full_name || membership?.user_name}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}