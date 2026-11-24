import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  BookOpen,
  BookUser,
  CalendarDays,
  Calendar,
  Plus,
  Megaphone,
  ClipboardList,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileBarChart,
  Award,
  CalendarCheck,
  ScrollText,
  KeyRound,
  Wallet,
  UserCheck,
  FileText,
} from "lucide-react";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRpcQuery } from "@/hooks/useIportalQuery";

const colorClasses = {
  indigo: { bg: "bg-[hsl(var(--brand-indigo))]/10", text: "text-[hsl(var(--brand-indigo))]" },
  orange: { bg: "bg-[hsl(var(--brand-orange))]/10", text: "text-[hsl(var(--brand-orange))]" },
  green: { bg: "bg-[hsl(var(--brand-green))]/10", text: "text-[hsl(var(--brand-green))]" },
  navy: { bg: "bg-[hsl(var(--brand-navy))]/10", text: "text-[hsl(var(--brand-navy))]" },
};

const quickActions = [
  { label: "Add Student", icon: Plus, color: "indigo", path: "/app/students" },
  { label: "Review Admissions", icon: FileText, color: "orange", path: "/app/admissions" },
  { label: "Fee Collections", icon: Wallet, color: "green", path: "/app/payments" },
  { label: "Post Announcement", icon: Megaphone, color: "navy", path: "/app/announcements" },
];

export default function AdminDashboard() {
  const { school, schoolId } = useCurrentUser();
  const schoolName = school?.name || "Your School";

  const { data: dashData, isLoading: loading } = useRpcQuery(
    ["admin-dashboard-stats", schoolId],
    "getAdminDashboardStats",
    { school_id: schoolId },
    { enabled: !!schoolId }
  );

  const stats = dashData?.stats || {
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    accounts: 0,
    activeAccounts: 0,
  };
  const admissions = dashData?.admissions || { total: 0, pending: 0, accepted: 0, rejected: 0, recent: [] };
  const finance = dashData?.finance || { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, recentPayments: [] };
  const attendance = dashData?.attendance || {
    studentAttendanceRate: 96,
    presentCount: 0,
    absentCount: 0,
    staffTotal: stats.teachers,
    staffPresentToday: stats.teachers,
    staffAttendanceRate: 100,
  };
  const activeSession = dashData?.activeSession || null;
  const currentTerm = dashData?.currentTerm || null;
  const subscription = dashData?.subscription || null;

  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");
  const collectionRate =
    finance.totalBilled > 0 ? Math.min(100, Math.round((finance.totalCollected / finance.totalBilled) * 100)) : 0;

  const bannerStyle = school?.primary_color
    ? { background: `linear-gradient(135deg, ${school.primary_color}, ${school.accent_color || "#4f46e5"})` }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl brand-gradient p-6 sm:p-8 text-white" style={bannerStyle}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-[hsl(25_95%_53%)]/20 blur-2xl" />
        <div className="relative">
          <p className="text-white/60 text-sm mb-1">School Administration</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">{schoolName}</h2>
          <p className="text-white/70 max-w-xl">
            {school?.motto ? `"${school.motto}" — ` : ""}
            Monitor school overview, online admissions, fee collections, and staff &amp; student attendance in real time.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {activeSession && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                <CalendarDays className="w-3.5 h-3.5" /> Session: {activeSession.name}
              </span>
            )}
            {currentTerm && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> {currentTerm.name}
              </span>
            )}
            {subscription && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 border border-white/20 px-3 py-1.5 rounded-full">
                {subscription.plan_label} · {subscription.current_students}/{subscription.max_students ?? "∞"} Students
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Strip: School Overview, Admissions, Fee Collections, Staff Attendance */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={GraduationCap}
            label="Active Students"
            value={stats.students}
            sub={`${stats.classes} classes · ${stats.subjects} subjects`}
            color="indigo"
          />
          <StatCard
            icon={FileText}
            label="Admissions Applicants"
            value={admissions.total}
            sub={`${admissions.pending} pending review · ${admissions.accepted} accepted`}
            color="orange"
          />
          <StatCard
            icon={Wallet}
            label="Fee Collections"
            value={fmtNaira(finance.totalCollected)}
            sub={`Outstanding: ${fmtNaira(finance.totalOutstanding)}`}
            color="green"
          />
          <StatCard
            icon={UserCheck}
            label="Staff & Attendance"
            value={`${attendance.staffPresentToday}/${attendance.staffTotal || stats.teachers}`}
            sub={`Student Attendance: ${attendance.studentAttendanceRate}%`}
            color="navy"
          />
        </div>
      )}

      {/* Admissions, Fee Collections & Staff/Student Attendance Detail Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 1. Fee Collections & Debtors Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-base text-foreground">Fee Collections</h3>
              </div>
              <Link
                to="/app/billing"
                className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
              >
                Billing <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Collection Progress ({collectionRate}%)</span>
                <span className="font-bold text-emerald-700">{fmtNaira(finance.totalCollected)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${collectionRate}%` }} />
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground">Total Billed: {fmtNaira(finance.totalBilled)}</span>
                <span className="font-semibold text-amber-700">Due: {fmtNaira(finance.totalOutstanding)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Settlements</p>
              {(finance.recentPayments || []).slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{p.student_name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">{p.payment_method} · {p.paid_at}</p>
                  </div>
                  <span className="font-bold text-emerald-700 shrink-0">{fmtNaira(p.amount)}</span>
                </div>
              ))}
              {(!finance.recentPayments || finance.recentPayments.length === 0) && (
                <p className="text-xs text-muted-foreground py-3 text-center">No fee payments recorded yet.</p>
              )}
            </div>
          </div>
          <Link
            to="/app/payments"
            className="mt-4 w-full h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            View All Payments &amp; Receipts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2. Admissions Pipeline Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
                <h3 className="font-heading font-bold text-base text-foreground">Admissions Applicants</h3>
              </div>
              <Link
                to="/app/admissions"
                className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
              >
                Review <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-amber-50 rounded-xl p-2.5">
                <p className="text-[10px] font-bold uppercase text-amber-700">Pending</p>
                <p className="text-base font-heading font-extrabold text-amber-800">{admissions.pending}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <p className="text-[10px] font-bold uppercase text-emerald-700">Accepted</p>
                <p className="text-base font-heading font-extrabold text-emerald-800">{admissions.accepted}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-[10px] font-bold uppercase text-slate-600">Total</p>
                <p className="text-base font-heading font-extrabold text-slate-800">{admissions.total}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Latest Applicants</p>
              {(admissions.recent || []).slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{app.applicant_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{app.application_number} · {app.programme || "JSS 1"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-slate-100 text-slate-700">
                    {app.status}
                  </span>
                </div>
              ))}
              {(!admissions.recent || admissions.recent.length === 0) && (
                <p className="text-xs text-muted-foreground py-3 text-center">No recent admission applications.</p>
              )}
            </div>
          </div>
          <Link
            to="/app/admissions"
            className="mt-4 w-full h-9 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            Manage Admissions &amp; Offer Letters <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3. Staff & Student Attendance Overview */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                <h3 className="font-heading font-bold text-base text-foreground">Staff &amp; Student Attendance</h3>
              </div>
              <Link
                to="/app/attendance"
                className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
              >
                Register <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-border/40">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-foreground">Teaching Staff On Duty</span>
                  <span className="font-bold text-emerald-700">
                    {attendance.staffPresentToday}/{attendance.staffTotal || stats.teachers} ({attendance.staffAttendanceRate}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${attendance.staffAttendanceRate}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-border/40">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-foreground">Student Roll-Call Rate</span>
                  <span className="font-bold text-[hsl(var(--brand-indigo))]">{attendance.studentAttendanceRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-[hsl(var(--brand-indigo))] rounded-full" style={{ width: `${attendance.studentAttendanceRate}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Present Logs: {attendance.presentCount} · Absence Alerts Sent: {attendance.absentCount}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link
              to="/app/attendance"
              className="h-9 rounded-lg bg-[hsl(var(--brand-indigo))]/10 hover:bg-[hsl(var(--brand-indigo))]/20 text-[hsl(var(--brand-indigo))] text-xs font-semibold flex items-center justify-center"
            >
              Daily Roll-Call
            </Link>
            <Link
              to="/app/timetable"
              className="h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-foreground text-xs font-semibold flex items-center justify-center"
            >
              Class Timetable
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-[hsl(var(--brand-indigo))]/5 transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[a.color].bg} group-hover:scale-110 transition-transform`}
                >
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
            { label: "Students & ID Cards", icon: GraduationCap, path: "/app/students", color: "indigo" },
            { label: "Teachers & Staff", icon: Users, path: "/app/teachers", color: "orange" },
            { label: "Classes", icon: BookOpen, path: "/app/classes", color: "green" },
            { label: "Subjects", icon: BookUser, path: "/app/subjects", color: "navy" },
            { label: "Academic Sessions", icon: CalendarDays, path: "/app/sessions", color: "indigo" },
            { label: "Terms & Rollover", icon: Calendar, path: "/app/terms", color: "orange" },
            { label: "Enter Results", icon: FileBarChart, path: "/app/result-entry", color: "indigo" },
            { label: "Review Results", icon: ClipboardList, path: "/app/results", color: "green" },
            { label: "Grading Schemes", icon: Award, path: "/app/grading", color: "orange" },
            { label: "Class Timetable", icon: CalendarCheck, path: "/app/timetable", color: "navy" },
            { label: "Official Report Cards", icon: ScrollText, path: "/app/report-card", color: "indigo" },
            { label: "Portal User Accounts", icon: KeyRound, path: "/app/user-accounts", color: "orange" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                to={m.path}
                className="flex items-center gap-3 bg-card rounded-xl border border-border/60 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
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
