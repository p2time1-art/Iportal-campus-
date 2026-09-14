import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Users, BookOpen, BookUser, CalendarDays, Calendar, Plus, Megaphone, ClipboardList, ArrowRight, Loader2, CheckCircle2, FileBarChart, Award, CalendarCheck, ScrollText, KeyRound } from "lucide-react";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { base44 } from "@/api/base44Client";

const colorClasses = {
  indigo: { bg: "bg-[hsl(var(--brand-indigo))]/10", text: "text-[hsl(var(--brand-indigo))]" },
  orange: { bg: "bg-[hsl(var(--brand-orange))]/10", text: "text-[hsl(var(--brand-orange))]" },
  green: { bg: "bg-[hsl(var(--brand-green))]/10", text: "text-[hsl(var(--brand-green))]" },
  navy: { bg: "bg-[hsl(var(--brand-navy))]/10", text: "text-[hsl(var(--brand-navy))]" }
};

const quickActions = [
  { label: "Add Student", icon: Plus, color: "indigo", path: "/app/students" },
  { label: "Add Teacher", icon: Users, color: "orange", path: "/app/teachers" },
  { label: "Manage Classes", icon: BookOpen, color: "green", path: "/app/classes" },
  { label: "Post Announcement", icon: Megaphone, color: "navy", path: "/app/announcements" }
];

export default function AdminDashboard() {
  const { school, schoolId } = useCurrentUser();
  const schoolName = school?.name || "Your School";
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, subjects: 0, accounts: 0, activeAccounts: 0 });
  const [activeSession, setActiveSession] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    let mounted = true;
    (async () => {
      try {
        const [students, teachers, classes, subjects, sessions, terms, memberships] = await Promise.all([
          base44.entities.Student.filter({ school_id: schoolId }, "-created_date", 500),
          base44.entities.Teacher.filter({ school_id: schoolId }, "-created_date", 200),
          base44.entities.SchoolClass.filter({ school_id: schoolId }, "-created_date", 200),
          base44.entities.Subject.filter({ school_id: schoolId }, "-created_date", 200),
          base44.entities.AcademicSession.filter({ school_id: schoolId }, "-created_date", 50),
          base44.entities.Term.filter({ school_id: schoolId }, "-created_date", 100),
          base44.entities.SchoolMembership.filter({ school_id: schoolId }, "-created_date", 200)
        ]);
        if (!mounted) return;
        setStats({
          students: (students || []).filter((s) => s.status === "active").length,
          teachers: (teachers || []).filter((t) => t.status === "active").length,
          classes: (classes || []).filter((c) => c.status === "active").length,
          subjects: (subjects || []).filter((s) => s.status === "active").length,
          accounts: (memberships || []).length,
          activeAccounts: (memberships || []).filter((m) => m.status === "active").length
        });
        const actSess = (sessions || []).find((s) => s.is_active);
        setActiveSession(actSess || null);
        if (actSess) {
          const curTerm = (terms || []).find((t) => t.session_id === actSess.id && t.is_current);
          setCurrentTerm(curTerm || null);
        }
      } catch (_e) {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl brand-gradient p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-[hsl(25_95%_53%)]/20 blur-2xl" />
        <div className="relative">
          <p className="text-white/60 text-sm mb-1">School Administration</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">{schoolName}</h2>
          <p className="text-white/70 max-w-xl">Here's what's happening across your school today. Monitor students, staff, academics and finance from one place.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            {activeSession && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                <CalendarDays className="w-3.5 h-3.5" /> {activeSession.name}
              </span>
            )}
            {currentTerm && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> {currentTerm.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="Active Students" value={stats.students} color="indigo" />
          <StatCard icon={Users} label="Active Teachers" value={stats.teachers} color="orange" />
          <StatCard icon={BookOpen} label="Active Classes" value={stats.classes} color="green" />
          <StatCard icon={BookUser} label="Active Subjects" value={stats.subjects} color="navy" />
          <StatCard icon={KeyRound} label="Portal Accounts" value={stats.accounts} color="indigo" />
          <StatCard icon={CheckCircle2} label="Active Accounts" value={stats.activeAccounts} color="green" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.path} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-[hsl(var(--brand-indigo))]/5 transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[a.color].bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${colorClasses[a.color].text}`} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent announcements + Module shortcuts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentAnnouncements maxItems={4} />
        </div>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {[
            { label: "Students", icon: GraduationCap, path: "/app/students", color: "indigo" },
            { label: "Teachers", icon: Users, path: "/app/teachers", color: "orange" },
            { label: "Classes", icon: BookOpen, path: "/app/classes", color: "green" },
            { label: "Subjects", icon: BookUser, path: "/app/subjects", color: "navy" },
            { label: "Sessions", icon: CalendarDays, path: "/app/sessions", color: "indigo" },
            { label: "Terms", icon: Calendar, path: "/app/terms", color: "orange" },
            { label: "Enter Results", icon: FileBarChart, path: "/app/result-entry", color: "indigo" },
            { label: "Review Results", icon: ClipboardList, path: "/app/results", color: "green" },
            { label: "Grading", icon: Award, path: "/app/grading", color: "orange" },
            { label: "Attendance", icon: CalendarCheck, path: "/app/attendance", color: "navy" },
            { label: "Report Cards", icon: ScrollText, path: "/app/report-card", color: "indigo" },
            { label: "User Accounts", icon: KeyRound, path: "/app/user-accounts", color: "orange" }
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} to={m.path} className="flex items-center gap-3 bg-card rounded-xl border border-border/60 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClasses[m.color].bg}`}>
                  <Icon className={`w-5 h-5 ${colorClasses[m.color].text}`} />
                </div>
                <span className="font-heading font-bold text-foreground flex-1">{m.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}