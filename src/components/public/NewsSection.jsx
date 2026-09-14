import React, { useState, useEffect } from "react";
import { Calendar, ArrowRight, BellRing, ClipboardList, Users, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
    category: "resumption",
    date: "2026-08-26"
  },
  {
    id: "f2",
    title: "First Term Examination Timetable Released",
    description: "The examination timetable for the First Term has been published. Students are advised to check the academic portal for their respective schedules.",
    category: "examination",
    date: "2026-08-24"
  },
  {
    id: "f3",
    title: "PTA General Meeting — Term 1",
    description: "The Parents-Teachers Association general meeting is scheduled for Saturday, 12th September 2026 at 10:00am in the school auditorium.",
    category: "pta",
    date: "2026-08-22"
  },
  {
    id: "f4",
    title: "Inter-House Sports Festival 2026",
    description: "The annual Inter-House Sports competition will hold from 15th–17th October 2026. Parents are cordially invited to support the four houses.",
    category: "sports",
    date: "2026-08-20"
  }
];

export default function NewsSection() {
  const [news, setNews] = useState(fallbackNews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await base44.entities.Announcement.filter(
          { is_public: true, status: "published" },
          "-date",
          4
        );
        if (mounted && items && items.length > 0) {
          setNews(items);
        }
      } catch (_e) {
        // keep fallback
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading with orange underline */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0a0b4d] mb-3">
            School News & Updates
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
                  <h3 className="font-heading font-bold text-base text-[#0a0b4d] mb-2 leading-snug group-hover:text-[#f97316] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  <button className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0a0b4d] hover:text-[#f97316] hover:gap-2 transition-all self-start">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}