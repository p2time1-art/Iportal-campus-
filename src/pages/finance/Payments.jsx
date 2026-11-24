import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ReceiptText, Loader2, Download, Undo2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import SearchInput from "@/components/admin/SearchInput";
import PaginationBar from "@/components/admin/PaginationBar";
import ReversePaymentDialog from "@/components/finance/ReversePaymentDialog";
import { formatCurrency, formatStatusLabel, PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function Payments() {
  const { schoolId, school, can } = useCurrentUser();
  const canReversePayment = can("finance.reverse_payment");
  const { sessions, terms } = useAcademicContext(schoolId);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ session: "", term: "", method: "", status: "" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1, from: 0, to: 0, total_successful_amount: 0 });
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!schoolId) return;
    base44.entities.Receipt.filter({ school_id: schoolId }, "-created_date", 500)
      .then((rec) => setReceipts(rec || []))
      .catch(() => setReceipts([]));
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await base44.entities.Payment.paginate(
        {
          school_id: schoolId,
          page,
          per_page: perPage,
          search: debouncedSearch || undefined,
          academic_session_id: filters.session || undefined,
          term_id: filters.term || undefined,
          payment_method: filters.method || undefined,
          status: filters.status || undefined,
        },
        "-payment_date"
      );
      setPayments(res?.data || []);
      setMeta(res?.meta || { current_page: page, per_page: perPage, total: 0, last_page: 1, from: 0, to: 0, total_successful_amount: 0 });
    } catch (_e) {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, page, perPage, debouncedSearch, filters]);

  useEffect(() => { load(); }, [load]);

  const receiptMap = useMemo(() => {
    const m = {};
    (receipts || []).forEach(r => { m[r.payment_id] = r; });
    return m;
  }, [receipts]);

  const filtered = payments;
  const totalAmount = meta?.total_successful_amount !== undefined
    ? Number(meta.total_successful_amount)
    : filtered.filter(p => p.status === "successful").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const downloadReceipt = async (payment) => {
    const receipt = receiptMap[payment.id];
    if (!receipt) return;
    try {
      const [student, allocs] = await Promise.all([
        payment.student_id ? base44.entities.Student.get(payment.student_id).catch(() => null) : Promise.resolve(null),
        base44.entities.PaymentAllocation.filter({ school_id: schoolId, payment_id: payment.id }, "-created_date", 50),
      ]);
      const sessionName = sessions.find(s => s.id === payment.academic_session_id)?.name || "";
      const termName = terms.find(t => t.id === payment.term_id)?.name || "";
      generateReceiptPdf({ school, student, payment, receipt, allocations: allocs || [], sessionName, termName });
    } catch (_e) {
      // non-fatal
    }
  };

  const handleReversePayment = async (reason) => {
    if (!reverseTarget) return;
    setReversing(true);
    try {
      await base44.functions.invoke("reversePayment", {
        payment_id: reverseTarget.id,
        action: "reverse",
        reason
      });
      setReverseTarget(null);
      load();
    } catch (_e) {
      // non-fatal — error handled in dialog
    } finally {
      setReversing(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Payments" subtitle="View all recorded payments and download receipts." icon={ReceiptText} />

      <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <select className={selectCls} value={filters.session} onChange={(e) => { setFilters({ ...filters, session: e.target.value, term: "" }); setPage(1); }}>
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={filters.term} onChange={(e) => { setFilters({ ...filters, term: e.target.value }); setPage(1); }} disabled={!filters.session}>
            <option value="">All Terms</option>
            {terms.filter((t) => !filters.session || String(t.session_id) === String(filters.session)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={selectCls} value={filters.method} onChange={(e) => { setFilters({ ...filters, method: e.target.value }); setPage(1); }}>
            <option value="">All Methods</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={selectCls} value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">All Statuses</option>
            {Object.keys(PAYMENT_STATUS_STYLES).map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search student, PIN, or ref…" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Successful Payments</p>
        <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{formatCurrency(totalAmount)}</p>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No payments found" description="No payments match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Receipt No</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((p) => {
                  const receipt = receiptMap[p.id];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 text-muted-foreground">{p.payment_date}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.student_name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.payment_reference || "—"}</td>
                      <td className="px-4 py-3">
                        {p.payment_method === "online" ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]">Online</span>
                        ) : (
                          <span className="text-muted-foreground">{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${PAYMENT_STATUS_STYLES[p.status] || PAYMENT_STATUS_STYLES.pending}`}>
                          {formatStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{receipt?.receipt_number || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {receipt && (
                            <button onClick={() => downloadReceipt(p)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Download receipt">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {p.status === "successful" && canReversePayment && (
                            <button onClick={() => setReverseTarget(p)} className="p-2 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-600" aria-label="Reverse payment" title="Reverse payment">
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          meta={meta}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          loading={loading}
        />
      </div>
      <ReversePaymentDialog
        open={!!reverseTarget}
        onClose={() => setReverseTarget(null)}
        onConfirm={handleReversePayment}
        payment={reverseTarget}
        loading={reversing}
      />
    </div>
  );
}