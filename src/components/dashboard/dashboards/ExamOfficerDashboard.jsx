import React from "react";
import { Link } from "react-router-dom";
import {
  FileBarChart,
  Award,
  ScrollText,
  NotebookPen,
  GraduationCap,
  BookOpen,
  Calendar,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import StatCard from "./StatCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRpcQuery } from "@/hooks/useIportalQuery";

export default function ExamOfficerDashboard() {
  const { user, school, schoolId } = useCurrentUser();
  const { data: dashData, isLoading } = useRpcQuery(
    ["exam-officer-dashboard-stats", schoolId],
    "getAdminDashboardStats",
    { school_id: schoolId },
    { enabled: !!schoolId }
  );

  const stats = dashData?.stats || { students: 0, teachers: 0, classes: 0, subjects: 0 };
  const activeSession = dashData?.activeSession;
  const currentTerm = dashData?.currentTerm;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, #1e3a8a, #3730a3)" }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Exam Officer / Principal Academic Desk</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">
              {school?.name || "School"} Examinations &amp; Records
            </h2>
            <p className="text-white/80 max-w-xl">
              Welcome, {user?.full_name || "Exam Officer"}. Approve and publish examination results, manage grading schemes, endorse principal remarks, and digitally sign official report cards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/app/results"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-indigo-950 hover:bg-white/90 text-xs font-bold shadow"
            >
              <FileBarChart className="w-4 h-4" /> Approve &amp; Publish Results
            </Link>
            <Link
              to="/app/report-card"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
            >
              <ScrollText className="w-4 h-4" /> Sign Report Cards
            </Link>
          </div>
        </div>
      </div>

      {/* Role Boundary Notice */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
          <span>
            <strong>Active Sub-Admin Scope (Exam Officer / Principal):</strong> Full authority to Approve &amp; Publish Results, configure Grading Schemes, add Principal Remarks, and issue signed Report Cards.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" /> Payment Reversals Restricted
        </span>
      </div>

      {/* Academic KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Active Students"
          value={stats.students}
          sub={activeSession?.name || "Current Session"}
          color="indigo"
        />
        <StatCard
          icon={BookOpen}
          label="Classes & Subjects"
          value={`${stats.classes} / ${stats.subjects}`}
          sub={currentTerm?.name || "Current Term"}
          color="green"
        />
        <StatCard
          icon={Award}
          label="Grading Authority"
          value="Active"
          sub="CA + Exam Schemes"
          color="orange"
        />
        <StatCard
          icon={ScrollText}
          label="Digital Signature"
          value="Enabled"
          sub="Official Report Cards"
          color="navy"
        />
      </div>

      {/* Examination & Academic Operations Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Approve & Publish Results",
            desc: "Review teacher score submissions, verify grades, and publish official term results.",
            path: "/app/results",
            icon: FileBarChart,
          },
          {
            label: "CA & Exam Grade Entry Sheet",
            desc: "Enter or moderate continuous assessment and examination scores by class and subject.",
            path: "/app/result-entry",
            icon: Award,
          },
          {
            label: "Sign & Issue Report Cards",
            desc: "Generate official PDF Report Cards and Academic Transcripts with Principal digital signature and QR code.",
            path: "/app/report-card",
            icon: ScrollText,
          },
          {
            label: "Principal & Class Remarks",
            desc: "Endorse student term report cards with official Principal and Class Teacher comments.",
            path: "/app/remarks",
            icon: NotebookPen,
          },
          {
            label: "Grading Schemes Configuration",
            desc: "Configure CA/Exam weights and A–F grade boundaries for your school.",
            path: "/app/grading",
            icon: Award,
          },
          {
            label: "Class Timetables & Calendar",
            desc: "Manage weekly class timetables, academic sessions, and term rollover.",
            path: "/app/timetable",
            icon: Calendar,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 hover:border-[hsl(var(--brand-indigo))]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                </div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--brand-indigo))]">
                Open Module <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
