import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TrendingUp, ClipboardList, CalendarCheck, ArrowRight, FileBarChart, Users, ChevronDown, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";
import { computeOverall } from "@/lib/grading";

export default function ParentDashboard() {
  const { user, schoolId } = useCurrentUser();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChildData, setLoadingChildData] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("getParentContext", {});
        const data = res?.data || res;
        setChildren(data?.children || []);
        if ((data?.children || []).length > 0) setSelectedChild(data.children[0]);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedChild?.id) return;
    setLoadingChildData(true);
    (async () => {
      try {
        const res = await base44.functions.invoke("getParentContext", { student_id: selectedChild.id });
        const data = res?.data || res;
        setResults(data?.results || []);
        setAttendance(data?.attendance || []);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoadingChildData(false);
      }
    })();
  }, [selectedChild]);

  const overall = computeOverall(results, null);
  const present = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, hsl(200 80% 50%), hsl(222 47% 25%))" }}>
          <div className="relative">
            <p className="text-white/70 text-sm mb-1">Parent / Guardian Portal</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Family Dashboard</h2>
            <p className="text-white/80">You do not have any children linked to your account yet.</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-10 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Please contact your school to be linked as a guardian.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, hsl(200 80% 50%), hsl(222 47% 25%))" }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Parent / Guardian Portal</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Family Dashboard</h2>
            <p className="text-white/80">Managing {children.length} child{children.length !== 1 ? "ren" : ""} · Stay on top of their academic progress.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/15 rounded-xl px-4 py-3 text-left hover:bg-white/15 transition-colors min-w-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(selectedChild?.full_name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selectedChild?.full_name}</p>
                <p className="text-xs text-white/50">{selectedChild?.current_class_name}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-border/60 py-2 z-10">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedChild(c); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(200_80%_50%)] to-[hsl(222_47%_25%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {c.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.current_class_name}</p>
                    </div>
                    {selectedChild?.id === c.id && <Check className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Current Average" value={`${overall.average}%`} color="blue" />
        <StatCard icon={FileBarChart} label="Published Results" value={String(results.length)} color="indigo" />
        <StatCard icon={ClipboardList} label="Subjects" value={String(results.length)} color="orange" />
        <StatCard icon={CalendarCheck} label="Attendance" value={`${attRate}%`} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">{selectedChild?.full_name?.split(" ")[0]}'s Recent Results</h3>
            <Link to="/app/report-card" className="text-sm font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1 hover:gap-2 transition-all">
              View report card <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingChildData ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No published results yet.</p>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.subject_name}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-indigo))] to-[hsl(263_70%_50%)]" style={{ width: `${r.percentage || 0}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground w-10 text-right">{r.total_score}</span>
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">{r.grade}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "View Results", icon: FileBarChart, path: "/app/results" },
                { label: "Report Card", icon: FileBarChart, path: "/app/report-card" },
                { label: "Assignments", icon: ClipboardList, path: "/app/assignments" },
                { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" }
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.path} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-[hsl(var(--brand-indigo))]/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--brand-indigo))]/10 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <RecentAnnouncements maxItems={3} />
    </div>
  );
}