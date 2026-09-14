import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BookOpen, Users, ClipboardList, CalendarCheck, ArrowRight, Plus, FileBarChart, NotebookPen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";

export default function TeacherDashboard() {
  const { user, schoolId } = useCurrentUser();
  const [assignments, setAssignments] = useState([]);
  const [pendingResults, setPendingResults] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !schoolId) return;
    (async () => {
      try {
        const teachers = await base44.entities.Teacher.filter({ user_id: user.id }, "-created_date", 5);
        const myTeacher = (teachers || [])[0];
        let myAssignments = [];
        if (myTeacher) {
          myAssignments = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_id: myTeacher.id }, "-created_date", 200);
        }
        setAssignments(myAssignments || []);

        const drafts = await base44.entities.Result.filter({ school_id: schoolId, teacher_user_id: user.id, status: "draft" }, "-created_date", 200).catch(() => []);
        setPendingResults((drafts || []).length);

        // Count students across assigned classes
        const classIds = [...new Set((myAssignments || []).map((a) => a.class_id))];
        let total = 0;
        for (const cid of classIds) {
          const students = await base44.entities.ClassAssignment.filter({ school_id: schoolId, class_id: cid }, "-created_date", 200).catch(() => []);
          total += (students || []).length;
        }
        setStudentCount(total);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, [user, schoolId]);

  const byClass = {};
  assignments.forEach((a) => {
    if (!byClass[a.class_id]) byClass[a.class_id] = { name: a.class_name, subjects: [] };
    byClass[a.class_id].subjects.push(a.subject_name);
  });
  const classList = Object.entries(byClass);

  const quickActions = [
    { label: "Enter Results", icon: FileBarChart, path: "/app/results" },
    { label: "Post Assignment", icon: Plus, path: "/app/assignments" },
    { label: "Take Attendance", icon: CalendarCheck, path: "/app/attendance" },
    { label: "Add Remark", icon: NotebookPen, path: "/app/remarks" }
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(15 85% 48%))" }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">Teacher Portal</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Welcome back, {user?.full_name || "Teacher"}</h2>
          <p className="text-white/80 max-w-xl">You have {pendingResults} pending result{pendingResults !== 1 ? "s" : ""} to enter across {classList.length} class{classList.length !== 1 ? "es" : ""}.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Assigned Classes" value={String(classList.length)} color="orange" />
        <StatCard icon={Users} label="Total Students" value={String(studentCount)} color="indigo" />
        <StatCard icon={ClipboardList} label="Pending Results" value={String(pendingResults)} color="red" />
        <StatCard icon={CalendarCheck} label="Subjects" value={String(assignments.length)} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">My Classes & Subjects</h3>
            <Link to="/app/teacher/classes" className="text-sm font-semibold text-[hsl(var(--brand-orange))] flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {classList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No class assignments yet. Contact your school administrator.</p>
          ) : (
            <div className="space-y-2">
              {classList.map(([id, info]) => (
                <div key={id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-orange))]/30 hover:bg-[hsl(var(--brand-orange))]/5 transition-all">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{info.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.subjects.join(", ")}</p>
                  </div>
                  <Link to="/app/results" className="text-xs font-semibold text-[hsl(var(--brand-orange))] hover:underline">Enter results</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} to={a.path} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-orange))]/40 hover:bg-[hsl(var(--brand-orange))]/5 transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--brand-orange))]/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <RecentAnnouncements maxItems={3} />
    </div>
  );
}