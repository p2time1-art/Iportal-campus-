import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  CalendarCheck,
  ArrowRight,
  FileBarChart,
  BookOpen,
  Loader2,
  Wallet,
  CreditCard,
  Download,
  Clock,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StatCard from "./StatCard";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";
import { computeOverall } from "@/lib/grading";
import { formatCurrency, computeStudentBalance } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";

export default function StudentDashboard() {
  const { user, school, schoolId } = useCurrentUser();

  const { data: bundle, isLoading: loading } = useQuery({
    queryKey: ["student-dashboard", schoolId, user?.id],
    enabled: !!user?.id && !!schoolId,
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
      const me = (students || [])[0];
      if (!me) {
        return { student: null, results: [], attendance: [], timetable: [], finance: null };
      }

      const [res, att, tt, finRes] = await Promise.all([
        base44.entities.Result.filter({ student_id: me.id }, "-created_date", 100).catch(() => []),
        base44.entities.Attendance.filter({ student_id: me.id }, "-date", 300).catch(() => []),
        base44.entities.TimetableEntry.filter(
          { school_id: schoolId, ...(me.current_class_id ? { class_id: me.current_class_id } : {}) },
          "start_time",
          50
        ).catch(() => []),
        base44.functions.invoke("getStudentFinance", { student_id: me.id }).catch(() => ({ data: null })),
      ]);

      return {
        student: me,
        results: res || [],
        attendance: att || [],
        timetable: tt || [],
        finance: finRes?.data || finRes || { charges: [], payments: [], receipts: [], allocations: [] },
      };
    },
  });

  const student = bundle?.student;
  const results = bundle?.results || [];
  const attendance = bundle?.attendance || [];
  const timetable = bundle?.timetable || [];
  const finance = bundle?.finance || { charges: [], payments: [], receipts: [], allocations: [] };

  const present = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 95;
  const overall = computeOverall(results, null);
  const balance = computeStudentBalance(finance.charges || [], finance.payments || []);
  const receipts = finance.receipts || [];

  const handleDownloadReceipt = (receipt) => {
    const payment = (finance.payments || []).find((p) => p.id === receipt.payment_id);
    const allocations = (finance.allocations || []).filter((a) => a.payment_id === receipt.payment_id);
    generateReceiptPdf({
      school,
      student,
      payment,
      receipt,
      allocations,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner with Online Fee Payment CTA */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(160 65% 38%))" }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Student Portal</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">
              Hi, {student?.full_name || user?.full_name || "Student"}
            </h2>
            <p className="text-white/80 max-w-xl">
              {student?.admission_number ? `Adm No: ${student.admission_number} · ` : ""}
              {student?.current_class_name || "Assigned Class"} — Track your fee balance, pay online, check term results, timetable, and download official QR receipts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/app/pay-fees"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-emerald-900 hover:bg-white/90 text-xs font-bold shadow"
            >
              <CreditCard className="w-4 h-4" /> Pay Fees Online
            </Link>
            <Link
              to="/app/report-card"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
            >
              <BookOpen className="w-4 h-4" /> Report Card PDF
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Strip: Fee Balance, Term Average, Published Results, Attendance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Fee Balance Due"
          value={formatCurrency(balance.outstanding)}
          sub={`Paid: ${formatCurrency(balance.totalPaid)}`}
          color="orange"
        />
        <StatCard icon={TrendingUp} label="Term Average" value={`${overall.average}%`} color="green" />
        <StatCard icon={FileBarChart} label="Term Results" value={String(results.length)} color="indigo" />
        <StatCard icon={CalendarCheck} label="Attendance Rate" value={`${attRate}%`} color="indigo" />
      </div>

      {/* Fee Balance + Online Payment & Payment Receipts + Term Results */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Term Results Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Term Results &amp; Subject Scores</h3>
            <Link
              to="/app/report-card"
              className="text-sm font-semibold text-[hsl(var(--brand-green))] flex items-center gap-1 hover:gap-2 transition-all"
            >
              Official Report Card <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No published results yet for this term.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium text-center">Score</th>
                    <th className="pb-3 font-medium text-center">Grade</th>
                    <th className="pb-3 font-medium">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 font-medium text-foreground">{r.subject_name}</td>
                      <td className="py-3 text-center font-bold text-foreground">
                        {r.total_score ?? r.score}/100
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{r.remark || r.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fee Balance & Official Payment Receipts Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-base text-foreground">Fees &amp; Payment Receipts</h3>
              </div>
              <Link to="/app/my-finance" className="text-xs font-semibold text-emerald-700 hover:underline">
                Full Statement
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/50 mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Total Billed</span>
                <span className="font-semibold">{formatCurrency(balance.totalCharges)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(balance.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border/50">
                <span className="font-bold text-foreground">Balance Due</span>
                <span className="font-extrabold text-amber-700">{formatCurrency(balance.outstanding)}</span>
              </div>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Official Payment Receipts ({receipts.length})
            </p>
            {receipts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No receipts issued yet.</p>
            ) : (
              <div className="space-y-2">
                {receipts.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-white text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-foreground truncate">{rec.receipt_number}</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(rec.amount)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(rec)}
                      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold shrink-0"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/app/pay-fees"
            className="mt-4 w-full h-10 rounded-xl bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-violet))] text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Pay Fees Online (Paystack / Flutterwave / Monnify)
          </Link>
        </div>
      </div>

      {/* Class Timetable Card */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
            <h3 className="font-heading font-bold text-base text-foreground">Weekly Class Timetable</h3>
          </div>
          <Link
            to="/app/timetable"
            className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
          >
            Full Timetable <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {timetable.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No class timetable slots scheduled yet. Visit the Timetable page to view updates.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {timetable.slice(0, 8).map((slot) => (
              <div key={slot.id} className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[hsl(var(--brand-indigo))] mb-1">
                  <span>{slot.day_of_week}</span>
                  <span>
                    {slot.start_time} – {slot.end_time}
                  </span>
                </div>
                <p className="font-heading font-bold text-sm text-foreground">{slot.subject_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {slot.teacher_name || "Subject Teacher"} {slot.room ? `· Rm ${slot.room}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <RecentAnnouncements maxItems={3} />
    </div>
  );
}
