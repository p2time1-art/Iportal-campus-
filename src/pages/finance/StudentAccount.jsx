import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Loader2, Download, Pencil, FileText, Undo2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import AssignFeesDrawer from "@/components/finance/AssignFeesDrawer";
import ReversePaymentDialog from "@/components/finance/ReversePaymentDialog";
import RecordPaymentDrawer from "@/components/finance/RecordPaymentDrawer";
import { formatCurrency, computeStudentBalance, formatStatusLabel, CHARGE_STATUS_STYLES, PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";
import { downloadOfficialInvoicePdf } from "@/lib/documentEngine";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function StudentAccount() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { schoolId, school, can } = useCurrentUser();
  const canAssignCharges = can("finance.assign_charges");
  const canRecordPayment = can("finance.record_payment");
  const canReversePayment = can("finance.reverse_payment");
  const { sessions, terms } = useAcademicContext(schoolId);
  const [student, setStudent] = useState(null);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ session: "", term: "" });
  const [assignOpen, setAssignOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editCharge, setEditCharge] = useState(null);
  const [discountForm, setDiscountForm] = useState({ discount_amount: "", status: "", notes: "" });
  const [savingCharge, setSavingCharge] = useState(false);
  const [chargeError, setChargeError] = useState("");
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reversing, setReversing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId || !schoolId) return;
    setLoading(true);
    try {
      const [stu, chg, pay, rec] = await Promise.all([
        base44.entities.Student.get(studentId).catch(() => null),
        base44.entities.StudentCharge.filter({ school_id: schoolId, student_id: studentId }, "-created_date", 2000),
        base44.entities.Payment.filter({ school_id: schoolId, student_id: studentId }, "-payment_date", 2000),
        base44.entities.Receipt.filter({ school_id: schoolId, student_id: studentId }, "-created_date", 2000)
      ]);
      setStudent(stu);
      setCharges(chg || []);
      setPayments(pay || []);
      setReceipts(rec || []);
    } catch (_e) {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, schoolId]);

  useEffect(() => { load(); }, [load]);

  const filteredCharges = useMemo(() => {
    return charges.filter((c) => {
      if (filters.session && c.academic_session_id !== filters.session) return false;
      if (filters.term && c.term_id !== filters.term) return false;
      return true;
    });
  }, [charges, filters]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filters.session && p.academic_session_id !== filters.session) return false;
      if (filters.term && p.term_id !== filters.term) return false;
      return true;
    });
  }, [payments, filters]);

  const balance = useMemo(() => computeStudentBalance(filteredCharges, filteredPayments), [filteredCharges, filteredPayments]);

  const openEditCharge = (charge) => {
    setEditCharge(charge);
    setDiscountForm({ discount_amount: String(charge.discount_amount || ""), status: charge.status, notes: charge.notes || "" });
    setChargeError("");
  };

  const handleSaveCharge = async () => {
    if (!editCharge) return;
    const discount = Number(discountForm.discount_amount) || 0;
    if (discount < 0) { setChargeError("Discount cannot be negative."); return; }
    if (discount > editCharge.amount) { setChargeError("Discount cannot exceed the original amount."); return; }
    if ((discountForm.status === "waived" || discountForm.status === "cancelled") && (editCharge.amount_paid || 0) > 0) {
      setChargeError("Cannot waive or cancel a charge that has existing payments. Reverse the payment first.");
      return;
    }
    setSavingCharge(true); setChargeError("");
    try {
      let netAmount = editCharge.amount - discount;
      const update = {
        discount_amount: discount,
        net_amount: netAmount,
        status: discountForm.status,
        notes: discountForm.notes
      };
      // If waived, zero out the net amount (student no longer owes)
      if (discountForm.status === "waived") {
        update.discount_amount = editCharge.amount;
        update.net_amount = 0;
        update.amount_paid = 0;
      }
      // If cancelled, zero out paid amount
      if (discountForm.status === "cancelled") {
        update.amount_paid = 0;
      }
      await base44.entities.StudentCharge.update(editCharge.id, update);
      setEditCharge(null);
      load();
    } catch (err) {
      setChargeError(err?.message || "Unable to update charge.");
    } finally {
      setSavingCharge(false);
    }
  };

  const downloadReceipt = async (receiptId) => {
    try {
      const receipt = receipts.find((r) => r.id === receiptId) || await base44.entities.Receipt.get(receiptId);
      const payment = payments.find((p) => p.id === receipt.payment_id) || await base44.entities.Payment.get(receipt.payment_id);
      const allocs = await base44.entities.PaymentAllocation.filter({ school_id: schoolId, payment_id: receipt.payment_id }, "-created_date", 50);
      const sessionName = sessions.find((s) => s.id === payment.academic_session_id)?.name || "";
      const termName = terms.find((t) => t.id === payment.term_id)?.name || "";
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
    } catch (err) {
      setChargeError(err?.response?.data?.error || err?.message || "Unable to reverse payment.");
    } finally {
      setReversing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!student) {
    return <EmptyState icon={Wallet} title="Student not found" description="This student record could not be loaded." />;
  }

  return (
    <div>
      <button onClick={() => navigate("/app/billing")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Billing
      </button>

      {/* Student header */}
      <div className="bg-[hsl(var(--brand-navy))] text-white rounded-xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-extrabold text-xl">{student.full_name}</h1>
            <p className="text-sm text-white/70 mt-0.5">
              {student.admission_number ? `Adm. No: ${student.admission_number} · ` : ""}
              {student.current_class_name || "No class assigned"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadOfficialInvoicePdf({ studentId: student.id, sessionId: filters.session, termId: filters.term, studentName: student.full_name })}
              className="h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download Invoice PDF
            </button>
            <button onClick={() => setAssignOpen(true)} className="h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold">Assign Fees</button>
            <button onClick={() => setPayOpen(true)} className="h-9 px-4 rounded-lg bg-[hsl(var(--brand-orange))] hover:opacity-90 text-white text-sm font-semibold">Record Payment</button>
          </div>
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Charges</p>
          <p className="text-xl font-heading font-extrabold text-foreground mt-1">{formatCurrency(balance.totalCharges)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{formatCurrency(balance.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-orange))] mt-1">{formatCurrency(balance.outstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
          <p className="text-xl font-heading font-extrabold text-foreground mt-1 capitalize">{formatStatusLabel(balance.status)}</p>
        </div>
      </div>

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
          <h2 className="font-heading font-bold text-base text-foreground">Charges ({filteredCharges.length})</h2>
        </div>
        {filteredCharges.length === 0 ? (
          <EmptyState icon={Wallet} title="No charges" description="Assign fees to this student to generate charges." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Session / Term</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Discount</th>
                  <th className="px-4 py-3 font-semibold text-right">Net</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCharges.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{c.category_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.session_name} {c.term_name ? `· ${c.term_name}` : ""}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 text-right text-[hsl(var(--brand-orange))]">{c.discount_amount ? formatCurrency(c.discount_amount) : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(c.net_amount)}</td>
                    <td className="px-4 py-3 text-right text-[hsl(var(--brand-green))]">{formatCurrency(c.amount_paid)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${CHARGE_STATUS_STYLES[c.status] || CHARGE_STATUS_STYLES.pending}`}>
                        {formatStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEditCharge(c)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit charge">
                        <Pencil className="w-4 h-4" />
                      </button>
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
          <h2 className="font-heading font-bold text-base text-foreground">Payments ({filteredPayments.length})</h2>
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState icon={FileText} title="No payments" description="Record a payment to generate a receipt." />
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
                  <th className="px-4 py-3 font-semibold">Receipt</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPayments.map((p) => {
                  const receipt = receipts.find((r) => r.payment_id === p.id);
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
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{receipt?.receipt_number || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {receipt && (
                            <button onClick={() => downloadReceipt(receipt.id)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Download receipt">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {p.status === "successful" && (
                            <button onClick={() => { setReverseTarget(p); setChargeError(""); }} className="p-2 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-600" aria-label="Reverse payment" title="Reverse payment">
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
      </div>

      <AssignFeesDrawer open={assignOpen} onClose={() => setAssignOpen(false)} schoolId={schoolId} studentId={studentId} defaultClassId={student.current_class_id} onDone={load} />
      <RecordPaymentDrawer open={payOpen} onClose={() => setPayOpen(false)} schoolId={schoolId} student={student} onDone={load} />

      {/* Edit charge drawer */}
      <FormDrawer
        open={!!editCharge}
        onClose={() => setEditCharge(null)}
        title="Adjust Charge"
        description={editCharge ? `${editCharge.category_name} — ${formatCurrency(editCharge.amount)}` : ""}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setEditCharge(null)} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
            <button onClick={handleSaveCharge} disabled={savingCharge} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {savingCharge ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Discount Amount (₦)</label>
            <input type="number" min="0" max={editCharge?.amount} className={inputCls} value={discountForm.discount_amount} onChange={(e) => setDiscountForm({ ...discountForm, discount_amount: e.target.value })} placeholder="0" />
            <p className="text-xs text-muted-foreground mt-1">Original: {formatCurrency(editCharge?.amount || 0)} · Net after discount: {formatCurrency((editCharge?.amount || 0) - (Number(discountForm.discount_amount) || 0))}</p>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={discountForm.status} onChange={(e) => setDiscountForm({ ...discountForm, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={discountForm.notes} onChange={(e) => setDiscountForm({ ...discountForm, notes: e.target.value })} placeholder="Reason for discount/waiver" />
          </div>
          {chargeError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{chargeError}</p>}
        </div>
      </FormDrawer>

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