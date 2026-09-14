import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Megaphone, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatAnnouncementDateTime } from "@/lib/announcements";

export default function NotificationCenter() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const notifs = await base44.entities.Notification.filter(
          { recipient_user_id: user.id }, "-created_date", 30
        );
        if (!mounted) return;
        setNotifications(notifs || []);
        setUnreadCount((notifs || []).filter((n) => !n.is_read).length);
      } catch (_e) {
        // non-fatal
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAsRead = async (notifId) => {
    try {
      const now = new Date().toISOString();
      await base44.entities.Notification.update(notifId, { is_read: true, read_at: now });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true, read_at: now } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_e) {
      // non-fatal
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const now = new Date().toISOString();
      await base44.entities.Notification.updateMany(
        { recipient_user_id: user.id, is_read: false },
        { $set: { is_read: true, read_at: now } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: now })));
      setUnreadCount(0);
    } catch (_e) {
      // non-fatal
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.announcement_id) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-lg hover:bg-secondary text-foreground/70 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full bg-[hsl(var(--brand-orange))] px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-border/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline disabled:opacity-50"
                >
                  {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.announcement_id ? `/app/announcements/${n.announcement_id}` : "#"}
                    onClick={() => handleNotifClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer ${!n.is_read ? "bg-[hsl(var(--brand-indigo))]/5" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.is_read ? "bg-secondary" : "bg-[hsl(var(--brand-indigo))]/10"}`}>
                      <Megaphone className={`w-4 h-4 ${n.is_read ? "text-muted-foreground" : "text-[hsl(var(--brand-indigo))]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.is_read ? "font-medium text-foreground/80" : "font-semibold text-foreground"}`}>
                        {n.title}
                      </p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatAnnouncementDateTime(n.created_date)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={(e) => { e.preventDefault(); markAsRead(n.id); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                        aria-label="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}