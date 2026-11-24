import React, { useState, useEffect } from "react";
import { Megaphone, Pin, Paperclip, Clock, Calendar, User, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAudienceLabel, formatAnnouncementDateTime, isExpired } from "@/lib/announcements";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useCurrentUser();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const a = await base44.entities.Announcement.get(id);
        if (!mounted) return;
        setAnnouncement(a);

        // Mark corresponding notification as read
        if (user?.id) {
          try {
            const notifs = await base44.entities.Notification.filter(
              { recipient_user_id: user.id, announcement_id: id, is_read: false },
              "-created_date", 10
            );
            if (notifs && notifs.length > 0) {
              const now = new Date().toISOString();
              await Promise.all(
                notifs.map((n) =>
                  base44.entities.Notification.update(n.id, { is_read: true, read_at: now })
                )
              );
            }
          } catch (_e) {
            // non-fatal
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load announcement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Megaphone className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">{error || "Announcement not found"}</p>
        <Link to="/app/announcements" className="mt-4 text-sm font-semibold text-[hsl(var(--brand-indigo))] hover:underline">
          Back to announcements
        </Link>
      </div>
    );
  }

  const expired = isExpired(announcement);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {announcement.is_pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]">
                <Megaphone className="w-3 h-3" /> {getAudienceLabel(announcement)}
              </span>
              {announcement.category && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">
                  {announcement.category}
                </span>
              )}
              {expired && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]">
                  Expired
                </span>
              )}
            </div>
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground leading-tight">
            {announcement.title}
          </h1>
          {announcement.description && (
            <p className="text-sm text-muted-foreground mt-2">{announcement.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-secondary/30">
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {announcement.author_name || "School Admin"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {formatAnnouncementDateTime(announcement.publish_at || announcement.date || announcement.created_date)}
          </span>
          {announcement.expires_at && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Expires {formatAnnouncementDateTime(announcement.expires_at)}
            </span>
          )}
        </div>

        {/* Body */}
        {announcement.body && (
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {announcement.body}
            </div>
          </div>
        )}

        {/* Attachment */}
        {announcement.attachment_url && (
          <div className="px-6 pb-6">
            <a
              href={announcement.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium text-foreground"
            >
              <Paperclip className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
              {announcement.attachment_name || "Download attachment"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}