import React from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  ReceiptText,
  Globe,
  ClipboardList,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import StatCard from "./StatCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRpcQuery } from "@/hooks/useIportalQuery";
import { formatCurrency } from "@/lib/finance";

export default function BursarDashboard() {
  const { user, school, schoolId } = useCurrentUser();
  const { data: dashData, isLoading } = useRpcQuery(
    ["bursar-dashboard-stats", schoolId],
    "getAdminDashboardStats",
    { school_id: schoolId },
    { enabled: !!schoolId }
  );

  const finance = dashData?.finance || {
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    recentPayments: [],
  };
  const stats = dashData?.stats || { students: 0 };
  const collectionRate =
    finance.totalBilled > 0
      ? Math.min(100, Math.round((finance.totalCollected / finance.totalBilled) * 100))
      : 0;

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
        style={{ background: "linear-gradient(135deg, #065f46, #047857)" }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Bursar / Accountant Financial Desk</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">
              {school?.name || "School"} Bursary
            </h2>
            <p className="text-white/80 max-w-xl">
              Welcome, {user?.full_name || "Bursar"}. Manage fee structures, student billing, offline &amp; online payments, payment reversals, and QR-verified receipts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/app/payments"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-emerald-900 hover:bg-white/90 text-xs font-bold shadow"
            >
              <ReceiptText className="w-4 h-4" /> Record &amp; Manage Payments
            </Link>
            <Link
              to="/app/billing"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
            >
              <Wallet className="w-4 h-4" /> Student Billing
            </Link>
          </div>
        </div>
      </div>

      {/* Role Boundary Notice */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Active Sub-Admin Scope (Bursar / Accountant):</strong> Full authority over Fee Structures, Student Billing, Payment Recording, Payment Reversals, and Official Receipts.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" /> Grade Editing Restricted
        </span>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Fee Collected"
          value={formatCurrency(finance.totalCollected)}
          sub={`${collectionRate}% collection rate`}
          color="green"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Net Billed"
          value={formatCurrency(finance.totalBilled)}
          sub={`${stats.students} active students`}
          color="indigo"
        />
        <StatCard
          icon={CreditCard}
          label="Outstanding Debtors"
          value={formatCurrency(finance.totalOutstanding)}
          sub="Pending settlement"
          color="orange"
        />
        <StatCard
          icon={ReceiptText}
          label="Recent Settlements"
          value={String((finance.recentPayments || []).length)}
          sub="Verified receipts"
          color="navy"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Payments Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-base text-foreground">Recent Fee Payments &amp; Receipts</h3>
            <Link
              to="/app/payments"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(finance.recentPayments || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {finance.recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-border/50 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">{p.student_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {p.reference_number} · {String(p.payment_method).toUpperCase()} · {p.paid_at}
                    </p>
                  </div>
                  <span className="font-heading font-extrabold text-sm text-emerald-700">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bursary Quick Modules */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Bursary Operations</h3>
          <div className="space-y-2.5">
            {[
              { label: "Fee Categories", path: "/app/fee-categories", icon: CreditCard },
              { label: "Fee Structures & Pricing", path: "/app/fee-structures", icon: ClipboardList },
              { label: "Student Billing & Invoices", path: "/app/billing", icon: Wallet },
              { label: "Payments & Reversals", path: "/app/payments", icon: ReceiptText },
              { label: "Online Gateway Transactions", path: "/app/online-payments", icon: Globe },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-emerald-500/40 hover:bg-emerald-50/40 transition-all text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-emerald-700" />
                    {m.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
