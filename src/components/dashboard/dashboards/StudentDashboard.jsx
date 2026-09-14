import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TrendingUp, ClipboardList, CalendarCheck, ArrowRight, FileBarChart, BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";
import { computeOverall } from "@/lib/grading";

export default function StudentDashboard() {
  const { user, schoolId } = useCurrentUser();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !schoolId) return;
    (async () => {
      try {
        const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
        const me = (students || [])[0];
        setStudent(me);

        if (me) {
          const [res, att, assigns] = await Promise.all([
            base44.entities.Result.filter({ student_user_id: user.id, status: "published" }, "-created_date", 100).catch(() => []),
            base44.entities.Attendance.filter({ student_user_id: user.id }, "-date", 300).catch(() => []),
            base44.entities.Assignment.filter({ school_id: schoolId, class_id: me.current_class_id, status: "published" }, "-created_date", 50).catch(() => [])
          ]);
          setResults(res || []);
          setAttendance(att || []);
          setAssignments(assigns || []);
        }
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, [user, schoolId]);

  const present = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const overall = computeOverall(results, null);
  const pendingAssignments = assignments.length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(160 65% 38%))" }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">Student Portal</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Hi, {student?.full_name || user?.full_name || "Student"}</h2>
          <p className="text-white/80 max-w-xl">{student?.current_class_name || ""} — {results.length > 0 ? `Your overall average is ${overall.average}%.` : "Your results will appear here once published."}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Overall Average" value={`${overall.average}%`} color="green" />
        <StatCard icon={FileBarChart} label="Published Results" value={String(results.length)} color="indigo" />
        <StatCard icon={ClipboardList} label="Assignments" value={String(pendingAssignments)} color="orange" />
        <StatCard icon={CalendarCheck} label="Attendance" value={`${attRate}%`} color="indigo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Recent Results</h3>
            <Link to="/app/results" className="text-sm font-semibold text-[hsl(var(--brand-green))] flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No published results yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium text-center">Total</th>
                    <th className="pb-3 font-medium text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 font-medium text-foreground">{r.subject_name}</td>
                      <td className="py-3 text-center font-bold text-foreground">{r.total_score}<span className="text-muted-foreground font-normal">/{r.max_total}</span></td>
                      <td className="py-3 text-center">
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">{r.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "View Results", icon: FileBarChart, path: "/app/results" },
                { label: "Report Card", icon: BookOpen, path: "/app/report-card" },
                { label: "Assignments", icon: ClipboardList, path: "/app/assignments" },
                { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" }
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.path} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-green))]/40 hover:bg-[hsl(var(--brand-green))]/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--brand-green))]/10 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-[hsl(var(--brand-green))]" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {assignments.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
              <h3 className="font-heading font-bold text-lg text-foreground mb-4">Upcoming</h3>
              <div className="space-y-3">
                {assignments.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="w-9 h-9 rounded-lg bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subject_name}</p>
                    </div>
                    {a.due_date && <span className="text-xs font-semibold text-[hsl(var(--brand-orange))] shrink-0">{a.due_date}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <RecentAnnouncements maxItems={3} />
    </div>
  );
}