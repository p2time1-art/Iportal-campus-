import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ReceiptText, Loader2, Download, Printer, CheckCircle2, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import { formatCurrency, formatStatusLabel, PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";
import { downloadOfficialReceiptPdf } from "@/lib/documentEngine";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function StudentReceipts() {
  const { user, schoolId, school, role } = useCurrentUser();
  const { sessions, terms } = useAcademicContext(schoolId);
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [data, setData] = useState({ student: null, charges: [], payments: [], receipts: [], allocations: [] });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filters, setFilters] = useState({ session: "", term: "" });

  useEffect(() => {
    if (!user?.id || !schoolId) return;
    if (role === "student") {
      (async () => {
        try {
          const mine = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
          if (mine?.[0]) {
            setSelectedStudentId(mine[0].id);
            setChildren(mine);
          } else {
            setLoading(false);
          }
        } catch (_e) {
          setLoading(false);
        }
      })();
    } else if (role === "parent") {
      (async () => {
        try {
          const res = await base44.functions.invoke("getParentContext", {});
          const kids = res?.data?.children || [];
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedStudentId(kids[0].id);
          } else {
            setLoading(false);
          }
        } catch (_e) {
          setChildren([]);
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [user, schoolId, role]);

  const loadFinance = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getStudentFinance", { student_id: selectedStudentId });
      setData(res?.data || { student: null, charges: [], payments: [], receipts: [], allocations: [] });
    } catch (_e) {
      setData({ student: null, charges: [], payments: [], receipts: [], allocations: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) loadFinance();
  }, [selectedStudentId, loadFinance]);

  const receiptByPaymentId = useMemo(() => {
    const map = {};
    (data.receipts || []).forEach((r) => {
      map[String(r.payment_id)] = r;
    });
    return map;
  }, [data.receipts]);

  const filteredPayments = useMemo(() => {
    return (data.payments || []).filter((p) => {
      if (filters.session && String(p.academic_session_id) !== String(filters.session)) return false;
      if (filters.term && String(p.term_id) !== String(filters.term)) return false;
      return true;
    });
  }, [data.payments, filters]);

  const totalPaid = useMemo(() => {
    return filteredPayments
      .filter((p) => p.status === "successful" || p.status === "success")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const handlePrintReceipt = (payment) => {
    const receipt = receiptByPaymentId[String(payment.id)] || {
      id: payment.id,
      payment_id: payment.id,
      receipt_number: payment.receipt_number || `RCP-${payment.id}`,
      issued_date: payment.payment_date,
    };
    const sessionName = sessions.find((s) => String(s.id) === String(payment?.academic_session_id))?.name || "";
    const termName = terms.find((t) => String(t.id) === String(payment?.term_id))?.name || "";
    const allocations = (data.allocations || [])
      .filter((a) => String(a.payment_id) === String(payment.id))
      .map((a) => ({ category_name: a.category_name, amount: a.amount }));

    generateReceiptPdf({
      school,
      student: data.student,
      payment,
      receipt,
      allocations,
      sessionName,
      termName,
    });
  };

  const handleOfficialPdf = async (payment) => {
    const receipt = receiptByPaymentId[String(payment.id)];
    const label = receipt?.receipt_number || payment.payment_reference || `RECEIPT-${payment.id}`;
    setDownloadingId(payment.id);
    try {
      await downloadOfficialReceiptPdf(receipt?.id || payment.id, label);
    } catch (_e) {
      // Fallback to client-side receipt generator if backend PDF unavailable
      handlePrintReceipt(payment);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !data.student) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No payment receipts"
        description="No linked student financial records were found for your account."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">
            Payment Receipts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View every payment made and print or download your official payment receipts.
          </p>
        </div>
        <Link
          to="/app/pay-fees"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold"
        >
          <CreditCard className="w-4 h-4" /> Pay Fees
        </Link>
      </div>

      {/* Child selector for parents */}
      {role === "parent" && children.length > 1 && (
        <div className="no-print bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5">
          <select
            className={selectCls}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
                {c.current_class_name ? ` — ${c.current_class_name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Receipts</p>
            <p className="text-2xl font-heading font-extrabold text-foreground mt-1">
              {filteredPayments.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] flex items-center justify-center">
            <ReceiptText className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
            <p className="text-2xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className={selectCls}
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value, term: "" })}
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
            disabled={!filters.session}
          >
            <option value="">All Terms</option>
            {terms
              .filter((t) => !filters.session || String(t.session_id) === String(filters.session))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No payment receipts yet"
            description="Once you make a fee payment, your official printable receipt will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Receipt No.</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="no-print px-4 py-3 font-semibold text-right">Print / Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPayments.map((p) => {
                  const receipt = receiptByPaymentId[String(p.id)];
                  const isPaid = p.status === "successful" || p.status === "success";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {p.payment_date || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {receipt?.receipt_number || `RCP-${p.id}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {p.payment_reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            PAYMENT_STATUS_STYLES[p.status] || PAYMENT_STATUS_STYLES.successful
                          }`}
                        >
                          {formatStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="no-print px-4 py-3 text-right whitespace-nowrap">
                        {isPaid ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOfficialPdf(p)}
                              disabled={downloadingId === p.id}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-xs font-semibold disabled:opacity-60"
                              title="Download Official QR-Verified PDF Receipt"
                            >
                              {downloadingId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(p)}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-white hover:bg-slate-50 text-foreground text-xs font-semibold"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
