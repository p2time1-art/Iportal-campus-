import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  CalendarCheck,
  ArrowRight,
  FileBarChart,
  Users,
  ChevronDown,
  Check,
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

export default function ParentDashboard() {
  const { user, school, schoolId } = useCurrentUser();
  const [selectedChildId, setSelectedChildId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: parentCtx, isLoading: loading } = useQuery({
    queryKey: ["parent-context", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await base44.functions.invoke("getParentContext", {});
      return res?.data || res || { children: [] };
    },
  });

  const children = parentCtx?.children || [];

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0] || null;

  const { data: childBundle, isLoading: loadingChildData } = useQuery({
    queryKey: ["parent-child-dashboard", schoolId, selectedChild?.id],
    enabled: !!selectedChild?.id,
    queryFn: async () => {
      const [ctxRes, finRes, tt] = await Promise.all([
        base44.functions.invoke("getParentContext", { student_id: selectedChild.id }).catch(() => ({ data: {} })),
        base44.functions.invoke("getStudentFinance", { student_id: selectedChild.id }).catch(() => ({ data: {} })),
        base44.entities.TimetableEntry.filter(
          { school_id: schoolId, ...(selectedChild.current_class_id ? { class_id: selectedChild.current_class_id } : {}) },
          "start_time",
          50
        ).catch(() => []),
      ]);
      const ctx = ctxRes?.data || ctxRes || {};
      const fin = finRes?.data || finRes || { charges: [], payments: [], receipts: [], allocations: [] };
      return {
        results: ctx.results || [],
        attendance: ctx.attendance || [],
        finance: fin,
        timetable: tt || [],
      };
    },
  });

  const results = childBundle?.results || [];
  const attendance = childBundle?.attendance || [];
  const finance = childBundle?.finance || { charges: [], payments: [], receipts: [], allocations: [] };
  const timetable = childBundle?.timetable || [];

  const overall = computeOverall(results, null);
  const present = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 96;
  const balance = computeStudentBalance(finance.charges || [], finance.payments || []);
  const receipts = finance.receipts || [];

  const handleDownloadReceipt = (receipt) => {
    const payment = (finance.payments || []).find((p) => p.id === receipt.payment_id);
    const allocations = (finance.allocations || []).filter((a) => a.payment_id === receipt.payment_id);
    generateReceiptPdf({
      school,
      student: selectedChild,
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

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
          style={{ background: "linear-gradient(135deg, hsl(200 80% 50%), hsl(222 47% 25%))" }}
        >
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
      {/* Header with Child Selector */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(200 80% 50%), hsl(222 47% 25%))" }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Parent / Guardian Portal</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Family Dashboard</h2>
            <p className="text-white/80">
              Managing {children.length} child{children.length !== 1 ? "ren" : ""} · Monitor fee balances, pay online, view term results, timetable, and download official QR receipts.
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/15 rounded-xl px-4 py-3 text-left hover:bg-white/15 transition-colors min-w-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(selectedChild?.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
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
                    onClick={() => {
                      setSelectedChildId(c.id);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(200_80%_50%)] to-[hsl(222_47%_25%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {c.full_name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
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

      {/* KPI Strip: Fee Balance, Term Average, Published Results, Attendance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Fee Balance Due"
          value={formatCurrency(balance.outstanding)}
          sub={`Paid: ${formatCurrency(balance.totalPaid)}`}
          color="orange"
        />
        <StatCard icon={TrendingUp} label="Current Average" value={`${overall.average}%`} color="blue" />
        <StatCard icon={FileBarChart} label="Term Results" value={String(results.length)} color="indigo" />
        <StatCard icon={CalendarCheck} label="Attendance" value={`${attRate}%`} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Term Results */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">
              {selectedChild?.full_name?.split(" ")[0]}&apos;s Term Results
            </h3>
            <Link
              to="/app/report-card"
              className="text-sm font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1 hover:gap-2 transition-all"
            >
              Download Report Card PDF <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingChildData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No published results yet.</p>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.subject_name}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-indigo))] to-[hsl(263_70%_50%)]"
                        style={{ width: `${r.percentage || r.total_score || r.score || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground w-10 text-right">{r.total_score ?? r.score}</span>
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">
                    {r.grade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee Balance, Online Payment & Payment Receipts */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-base text-foreground">Fees &amp; Receipts</h3>
              </div>
              <Link to="/app/my-finance" className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline">
                Statement
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
                <span className="font-bold text-foreground">Outstanding</span>
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
            <CreditCard className="w-4 h-4" /> Pay Child&apos;s Fees Online
          </Link>
        </div>
      </div>

      {/* Child's Class Timetable */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
            <h3 className="font-heading font-bold text-base text-foreground">
              {selectedChild?.full_name?.split(" ")[0]}&apos;s Class Timetable
            </h3>
          </div>
          <Link
            to="/app/timetable"
            className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
          >
            Full Schedule <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {timetable.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No timetable slots published for this class yet.</p>
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
