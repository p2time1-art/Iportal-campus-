import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Globe, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import SearchInput from "@/components/admin/SearchInput";
import GatewayConfigCard from "@/components/finance/GatewayConfigCard";
import { formatCurrency, formatStatusLabel, ONLINE_TXN_STATUS_STYLES, GATEWAY_LABELS, GATEWAY_BADGE_STYLES } from "@/lib/finance";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function OnlinePayments() {
  const { schoolId, school } = useCurrentUser();
  const { sessions, terms } = useAcademicContext(schoolId);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", gateway: "", session: "" });
  const [detailTxn, setDetailTxn] = useState(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const txns = await base44.entities.OnlinePaymentTransaction.filter(
        { school_id: schoolId }, "-created_date", 2000
      );
      setTransactions(txns || []);
    } catch (_e) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.gateway && t.gateway !== filters.gateway) return false;
      if (filters.session && t.academic_session_id !== filters.session) return false;
      const q = search.toLowerCase();
      if (
        q &&
        !t.student_name?.toLowerCase().includes(q) &&
        !t.student_pin?.toLowerCase().includes(q) &&
        !t.login_pin?.toLowerCase().includes(q) &&
        !t.internal_reference?.toLowerCase().includes(q) &&
        !t.gateway_reference?.toLowerCase().includes(q) &&
        !t.payer_name?.toLowerCase().includes(q)
      ) return false;
      return true;
    });
  }, [transactions, filters, search]);

  const totalSuccess = filtered.filter(t => t.status === "success").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPending = filtered.filter(t => ["pending", "initiated"].includes(t.status)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalFailed = filtered.filter(t => t.status === "failed").length;

  return (
    <div>
      <AdminPageHeader title="Online Payments" subtitle="Monitor gateway transactions and payment statuses." icon={Globe} />

      <GatewayConfigCard />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Successful</p>
          <p className="text-lg font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{formatCurrency(totalSuccess)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
          <p className="text-lg font-heading font-extrabold text-[hsl(var(--brand-orange))] mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Failed</p>
          <p className="text-lg font-heading font-extrabold text-[hsl(var(--brand-red))] mt-1">{totalFailed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {Object.keys(ONLINE_TXN_STATUS_STYLES).map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
          </select>
          <select className={selectCls} value={filters.gateway} onChange={(e) => setFilters({ ...filters, gateway: e.target.value })}>
            <option value="">All Gateways</option>
            {Object.entries(GATEWAY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={selectCls} value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}>
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search student, PIN, ref, payer…" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Globe} title="No online payments" description="No online payment transactions match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Payer</th>
                  <th className="px-4 py-3 font-semibold">Gateway</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 cursor-pointer" onClick={() => setDetailTxn(t)}>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.initiated_at ? new Date(t.initiated_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.student_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.payer_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${GATEWAY_BADGE_STYLES[t.gateway] || ""}`}>
                        {GATEWAY_LABELS[t.gateway] || t.gateway}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.internal_reference}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${ONLINE_TXN_STATUS_STYLES[t.status] || ONLINE_TXN_STATUS_STYLES.pending}`}>
                        {formatStatusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === "success" && t.authorization_url && (
                        <span className="text-xs text-muted-foreground">View</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailTxn && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDetailTxn(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-heading font-bold text-base text-foreground">Transaction Details</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium text-foreground">{detailTxn.student_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payer</span>
                  <span className="text-foreground">{detailTxn.payer_name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Fee Amount</span>
                  <span className="font-bold text-foreground">{formatCurrency(detailTxn.amount)}</span>
                </div>
                {detailTxn.convenience_fee > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Convenience Fee (Gateway + ₦100 Platform Split)</span>
                      <span className="font-medium text-foreground">{formatCurrency(detailTxn.convenience_fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Payable</span>
                      <span className="font-extrabold text-[hsl(var(--brand-indigo))]">{formatCurrency(detailTxn.total_payable || (Number(detailTxn.amount) + Number(detailTxn.convenience_fee)))}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gateway</span>
                  <span className="text-foreground">{GATEWAY_LABELS[detailTxn.gateway] || detailTxn.gateway}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Internal Ref</span>
                  <span className="font-mono text-xs text-foreground">{detailTxn.internal_reference}</span>
                </div>
                {detailTxn.gateway_reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gateway Ref</span>
                    <span className="font-mono text-xs text-foreground">{detailTxn.gateway_reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${ONLINE_TXN_STATUS_STYLES[detailTxn.status] || ONLINE_TXN_STATUS_STYLES.pending}`}>
                    {formatStatusLabel(detailTxn.status)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="text-foreground uppercase text-xs">{detailTxn.environment || "test"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Initiated</span>
                  <span className="text-foreground text-xs">{detailTxn.initiated_at ? new Date(detailTxn.initiated_at).toLocaleString() : "—"}</span>
                </div>
                {detailTxn.verified_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="text-foreground text-xs">{new Date(detailTxn.verified_at).toLocaleString()}</span>
                  </div>
                )}
                {detailTxn.failure_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-red-700">{detailTxn.failure_reason}</p>
                  </div>
                )}
                {detailTxn.receipt_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receipt No</span>
                    <span className="font-mono text-xs text-[hsl(var(--brand-indigo))]">{detailTxn.receipt_number}</span>
                  </div>
                )}
                {detailTxn.allocation_plan && detailTxn.allocation_plan.length > 0 && (
                  <div className="pt-3 border-t border-border/60">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Fee Breakdown</p>
                    {detailTxn.allocation_plan.map((a, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-foreground">{a.category_name}</span>
                        <span className="text-foreground">{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 py-4 bg-slate-50 border-t border-border">
                <button onClick={() => setDetailTxn(null)} className="w-full h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}