import React from "react";
import { Pin, Megaphone, Paperclip, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getAudienceLabel, formatAnnouncementDateTime, isExpired, isScheduled } from "@/lib/announcements";

export default function AnnouncementCard({ announcement, isRead = true, onClick = undefined }) {
  const expired = isExpired(announcement);
  const scheduled = isScheduled(announcement);
  const CardTag = /** @type {any} */ (onClick ? "button" : Link);
  const cardProps = onClick
    ? { onClick }
    : { to: `/app/announcements/${announcement.id}` };

  return (
    <CardTag
      {...cardProps}
      className={`block w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
        !isRead
          ? "border-[hsl(var(--brand-indigo))]/30 bg-[hsl(var(--brand-indigo))]/5"
          : "border-border/60 bg-card hover:border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {announcement.is_pinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]">
              <Megaphone className="w-2.5 h-2.5" /> {getAudienceLabel(announcement)}
            </span>
            {expired && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]">
                Expired
              </span>
            )}
            {scheduled && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
                Scheduled
              </span>
            )}
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-indigo))] shrink-0" />
            )}
          </div>
          <h3 className={`text-sm leading-snug ${!isRead ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
            {announcement.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/70">
            <span>{announcement.author_name || "Admin"}</span>
            <span>·</span>
            <span>{formatAnnouncementDateTime(announcement.publish_at || announcement.date || announcement.created_date)}</span>
            {announcement.attachment_url && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Paperclip className="w-2.5 h-2.5" /> Attachment
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </CardTag>
  );
}