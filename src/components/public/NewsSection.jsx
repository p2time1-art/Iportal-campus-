import React, { useState, useEffect } from "react";
import { Calendar, ArrowRight, BellRing, ClipboardList, Users, Trophy, X, User, Paperclip, ExternalLink } from "lucide-react";
import { apiRequest } from "@/api/client";

const categoryConfig = {
  resumption: { label: "Resumption", icon: BellRing, color: "text-white", bg: "bg-[#10b981]" },
  examination: { label: "Examination", icon: ClipboardList, color: "text-white", bg: "bg-[#f97316]" },
  pta: { label: "PTA Meeting", icon: Users, color: "text-white", bg: "bg-[#8b5cf6]" },
  sports: { label: "Sports", icon: Trophy, color: "text-white", bg: "bg-[#0a0b4d]" },
  events: { label: "Events", icon: Calendar, color: "text-white", bg: "bg-[#3b82f6]" },
  general: { label: "Announcement", icon: BellRing, color: "text-white", bg: "bg-[#0a0b4d]" },
  urgent: { label: "Urgent", icon: BellRing, color: "text-white", bg: "bg-[#ef4444]" }
};

const fallbackNews = [
  {
    id: "f1",
    title: "Resumption Notice — 2026/2027 Academic Session",
    description: "All students are expected to resume for the First Term on Monday, 8th September 2026. Boarding house students should arrive by 4pm on Sunday.",
    body: "All students are expected to resume for the First Term of the 2026/2027 Academic Session on Monday, 8th September 2026 at 7:45am prompt.\n\nBoarding house students should arrive between 1:00pm and 4:00pm on Sunday, 7th September 2026 for hostel check-in and medical clearance. Please ensure all tuition fees and school supplies are settled prior to resumption.",
    category: "resumption",
    author_name: "School Administration",
    date: "2026-08-26"
  },
  {
    id: "f2",
    title: "First Term Examination Timetable Released",
    description: "The examination timetable for the First Term has been published. Students are advised to check the academic portal for their respective schedules.",
    body: "The First Term Examination Timetable has been officially released by the Examinations Office.\n\nStudents and parents are advised to log in to the academic portal to review subject dates, times, and examination hall guidelines. All Continuous Assessment (CA) scores must be verified with subject teachers before examinations begin.",
    category: "examination",
    author_name: "Examinations Office",
    date: "2026-08-24"
  },
  {
    id: "f3",
    title: "PTA General Meeting — Term 1",
    description: "The Parents-Teachers Association general meeting is scheduled for Saturday, 12th September 2026 at 10:00am in the school auditorium.",
    body: "The Parents-Teachers Association (PTA) General Meeting for First Term is scheduled for Saturday, 12th September 2026 at 10:00am in the Main School Auditorium.\n\nAgenda items include the 2026/2027 academic calendar, student welfare, digital learning upgrades, and parent portal onboarding. All parents and guardians are warmly encouraged to attend.",
    category: "pta",
    author_name: "PTA Secretariat",
    date: "2026-08-22"
  },
  {
    id: "f4",
    title: "Inter-House Sports Festival 2026",
    description: "The annual Inter-House Sports competition will hold from 15th–17th October 2026. Parents are cordially invited to support the four houses.",
    body: "Our annual Inter-House Sports Festival will take place from Thursday, 15th October to Saturday, 17th October 2026 at the School Sports Complex.\n\nEvents include track and field, relay races, march-past parade, and invitational relays. Parents, alumni, and guests are cordially invited to cheer on our student athletes.",
    category: "sports",
    author_name: "Sports & Athletics Department",
    date: "2026-08-20"
  }
];

export default function NewsSection() {
  const [news, setNews] = useState(fallbackNews);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await apiRequest("/public/announcements?limit=4");
        if (mounted && Array.isArray(items) && items.length > 0) {
          setNews(
            items.map((item) => ({
              id: item.id,
              title: item.title || "",
              description: item.description || "",
              body: item.body || item.description || "",
              category: item.category || "general",
              author_name: item.author_name || "School Administration",
              date: item.published_at || item.date || item.publish_at || item.created_date || "",
              attachment_url: item.attachment_url || null,
              attachment_name: item.attachment_name || null,
            }))
          );
        }
      } catch (_e) {
        // keep fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

  const formatFullDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading with orange underline */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0a0b4d] mb-3">
            School News &amp; Updates
          </h2>
          <div className="w-16 h-1 bg-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-slate-500">
            Stay updated with the latest news and announcements.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.map((item) => {
            const cat = categoryConfig[item.category] || categoryConfig.general;
            const Icon = cat.icon;
            return (
              <article
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex flex-col flex-1">
                  {/* Square colored icon */}
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <span className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.date)}
                  </span>
                  <h3
                    onClick={() => setSelected(item)}
                    className="font-heading font-bold text-base text-[#0a0b4d] mb-2 leading-snug group-hover:text-[#f97316] transition-colors cursor-pointer"
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0a0b4d] hover:text-[#f97316] hover:gap-2 transition-all self-start"
                  >
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Full Announcement Details Modal (no login required) */}
      {selected && (() => {
        const cat = categoryConfig[selected.category] || categoryConfig.general;
        const Icon = cat.icon;
        const fullText = selected.body || selected.description || "";
        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelected(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200/70 text-[#0a0b4d] mb-1.5">
                      {cat.label}
                    </span>
                    <h3 className="font-heading font-extrabold text-xl text-[#0a0b4d] leading-snug">
                      {selected.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                  aria-label="Close announcement details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Meta bar */}
              <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                  {formatFullDate(selected.date) || "Recently published"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#f97316]" />
                  {selected.author_name || "School Administration"}
                </span>
              </div>

              {/* Full Body */}
              <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-4">
                {selected.description && selected.body && selected.body.trim() !== selected.description.trim() && (
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {selected.description}
                  </p>
                )}
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {fullText}
                </div>

                {selected.attachment_url && (
                  <a
                    href={selected.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-4 h-4 text-[#f97316] shrink-0" />
                      <span className="text-sm font-semibold text-[#0a0b4d] truncate">
                        {selected.attachment_name || "Download Attachment"}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                  </a>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="h-9 px-5 rounded-lg bg-[#0a0b4d] hover:bg-[#0a0b4d]/90 text-white text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
