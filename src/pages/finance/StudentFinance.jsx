import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Wallet, Loader2, Download, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import { formatCurrency, computeStudentBalance, formatStatusLabel, CHARGE_STATUS_STYLES, PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";
import { downloadOfficialInvoicePdf } from "@/lib/documentEngine";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function StudentFinance() {
  const { user, schoolId, school, role } = useCurrentUser();
  const { sessions, terms } = useAcademicContext(schoolId);
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [data, setData] = useState({ student: null, charges: [], payments: [], receipts: [], allocations: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ session: "", term: "" });

  // Resolve children list for parents, or auto-select for students
  useEffect(() => {
    if (!user?.id || !schoolId) return;
    if (role === "student") {
      (async () => {
        const mine = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
        if (mine[0]) { setSelectedStudentId(mine[0].id); setChildren(mine); }
      })();
    } else if (role === "parent") {
      (async () => {
        try {
          const res = await base44.functions.invoke("getParentContext", {});
          setChildren(res.data?.children || []);
          if ((res.data?.children || []).length > 0) setSelectedStudentId(res.data.children[0].id);
        } catch (_e) {
          setChildren([]);
        }
      })();
    }
  }, [user, schoolId, role]);

  const loadFinance = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getStudentFinance", { student_id: selectedStudentId });
      setData(res.data || { student: null, charges: [], payments: [], receipts: [], allocations: [] });
    } catch (_e) {
      setData({ student: null, charges: [], payments: [], receipts: [], allocations: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => { if (selectedStudentId) loadFinance(); }, [selectedStudentId, loadFinance]);

  const filteredCharges = useMemo(() => {
    return (data.charges || []).filter((c) => {
      if (filters.session && c.academic_session_id !== filters.session) return false;
      if (filters.term && c.term_id !== filters.term) return false;
      return true;
    });
  }, [data.charges, filters]);

  const filteredPayments = useMemo(() => {
    return (data.payments || []).filter((p) => {
      if (filters.session && p.academic_session_id !== filters.session) return false;
      if (filters.term && p.term_id !== filters.term) return false;
      return true;
    });
  }, [data.payments, filters]);

  const balance = useMemo(() => computeStudentBalance(filteredCharges, filteredPayments), [filteredCharges, filteredPayments]);

  const downloadReceipt = (receiptId) => {
    const receipt = (data.receipts || []).find(r => r.id === receiptId);
    if (!receipt) return;
    const payment = (data.payments || []).find(p => p.id === receipt.payment_id);
    const sessionName = sessions.find(s => s.id === payment?.academic_session_id)?.name || "";
    const termName = terms.find(t => t.id === payment?.term_id)?.name || "";
    // Use actual payment allocations from the backend
    const allocations = (data.allocations || [])
      .filter(a => a.payment_id === receipt.payment_id)
      .map(a => ({ category_name: a.category_name, amount: a.amount }));
    generateReceiptPdf({ school, student: data.student, payment, receipt, allocations, sessionName, termName });
  };

  if (loading && !data.student) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (children.length === 0) {
    return <EmptyState icon={Wallet} title="No financial records" description="No linked student records found for your account." />;
  }

  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">My Finance</h1>

      {/* Child selector for parents */}
      {role === "parent" && children.length > 1 && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5">
          <select className={selectCls} value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.current_class_name ? ` — ${c.current_class_name}` : ""}</option>)}
          </select>
        </div>
      )}

      {/* Student header */}
      {data.student && (
        <div className="bg-[hsl(var(--brand-navy))] text-white rounded-xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-extrabold text-xl">{data.student.full_name}</h2>
            <p className="text-sm text-white/70 mt-0.5">
              {data.student.admission_number ? `Adm. No: ${data.student.admission_number} · ` : ""}
              {data.student.current_class_name || ""}
            </p>
          </div>
          <button
            onClick={() => downloadOfficialInvoicePdf({ studentId: data.student.id, sessionId: filters.session, termId: filters.term, studentName: data.student.full_name })}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold shrink-0"
          >
            <Download className="w-4 h-4" /> Download Official Invoice (PDF)
          </button>
        </div>
      )}

      {/* Balance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Charges</p>
          <p className="text-xl font-heading font-extrabold text-foreground mt-1">{formatCurrency(balance.totalCharges)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{formatCurrency(balance.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-orange))] mt-1">{formatCurrency(balance.outstanding)}</p>
        </div>
      </div>

      {/* Pay Online button */}
      {balance.outstanding > 0 && (
        <Link to="/app/pay-fees" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-violet))] text-white text-sm font-bold transition-colors shadow-sm mb-5">
          <CreditCard className="w-4 h-4" /> Pay Fees Online
        </Link>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <select className={selectCls} value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value, term: "" })}>
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })} disabled={!filters.session}>
            <option value="">All Terms</option>
            {terms.filter((t) => !filters.session || String(t.session_id) === String(filters.session)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Charges */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border/60">
          <h3 className="font-heading font-bold text-base text-foreground">Charges ({filteredCharges.length})</h3>
        </div>
        {filteredCharges.length === 0 ? (
          <EmptyState icon={Wallet} title="No charges" description="No fee charges found for the selected period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Session / Term</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCharges.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{c.category_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.session_name} {c.term_name ? `· ${c.term_name}` : ""}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(c.net_amount)}</td>
                    <td className="px-4 py-3 text-right text-[hsl(var(--brand-green))]">{formatCurrency(c.amount_paid)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${CHARGE_STATUS_STYLES[c.status] || CHARGE_STATUS_STYLES.pending}`}>
                        {formatStatusLabel(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60">
          <h3 className="font-heading font-bold text-base text-foreground">Payments ({filteredPayments.length})</h3>
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments" description="No payment records found for the selected period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPayments.map((p) => {
                  const receipt = (data.receipts || []).find(r => r.payment_id === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 text-muted-foreground">{p.payment_date}</td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{p.payment_reference || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${PAYMENT_STATUS_STYLES[p.status] || PAYMENT_STATUS_STYLES.pending}`}>
                          {formatStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {receipt && (
                          <button onClick={() => downloadReceipt(receipt.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline">
                            <Download className="w-3 h-3" /> {receipt.receipt_number}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}