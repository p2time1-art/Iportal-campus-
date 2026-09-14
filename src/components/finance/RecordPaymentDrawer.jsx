import React, { useState, useMemo } from "react";
import { Loader2, CheckCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function RecordPaymentDrawer({ open, onClose, schoolId, student, onDone }) {
  const { sessions, terms } = useAcademicContext(schoolId);
  const { school } = useCurrentUser();
  const [form, setForm] = useState({
    amount: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0],
    payment_reference: "", academic_session_id: "", term_id: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sessionTerms = useMemo(() => terms.filter((t) => t.session_id === form.academic_session_id), [terms, form.academic_session_id]);

  if (!open) return null;

  const handleSave = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { setError("Amount must be a positive number."); return; }
    if (!form.payment_date) { setError("Payment date is required."); return; }
    setSaving(true); setError(""); setResult(null);
    try {
      const payload = {
        school_id: schoolId,
        student_id: student.id,
        amount: amt,
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        payment_reference: form.payment_reference,
        academic_session_id: form.academic_session_id || "",
        term_id: form.term_id || "",
        notes: form.notes
      };
      const res = await base44.functions.invoke("recordPayment", payload);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const downloadReceipt = async () => {
    if (!result) return;
    try {
      const receipt = await base44.entities.Receipt.get(result.receipt_id);
      const payment = await base44.entities.Payment.get(result.payment_id);
      const allocations = result.allocations || [];
      const sessionName = sessions.find((s) => s.id === form.academic_session_id)?.name || "";
      const termName = terms.find((t) => t.id === form.term_id)?.name || "";
      generateReceiptPdf({ school, student, payment, receipt, allocations, sessionName, termName });
    } catch (_e) {
      // non-fatal
    }
  };

  const handleClose = () => {
    setResult(null); setError("");
    if (result) onDone?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />
      <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading font-bold text-base text-foreground">Record Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{student?.full_name} {student?.admission_number ? `· ${student.admission_number}` : ""}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {result ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground">Payment Recorded</h3>
              <p className="text-sm text-muted-foreground mt-2">Receipt No: <span className="font-mono font-bold text-foreground">{result.receipt_number}</span></p>
              <div className="mt-4 bg-slate-50 rounded-lg p-4 text-left">
                <p className="text-xs text-muted-foreground mb-2">Allocated to:</p>
                {result.allocations?.length > 0 ? (
                  <ul className="space-y-1">
                    {result.allocations.map((a, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-foreground">{a.category_name}</span>
                        <span className="font-medium text-foreground">{formatCurrency(a.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No outstanding charges to allocate — payment recorded as credit.</p>
                )}
              </div>
              <button onClick={downloadReceipt} className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold">
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Amount (₦) *</label>
                <input type="number" min="1" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" />
              </div>
              <div>
                <label className={labelCls}>Payment Method *</label>
                <select className={inputCls} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Date *</label>
                <input type="date" className={inputCls} value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Payment Reference</label>
                <input className={inputCls} value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="e.g. Teller No, Transfer Ref" />
              </div>
              <div>
                <label className={labelCls}>Academic Session</label>
                <select className={inputCls} value={form.academic_session_id} onChange={(e) => setForm({ ...form, academic_session_id: e.target.value, term_id: "" })}>
                  <option value="">Select session…</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Term</label>
                <select className={inputCls} value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} disabled={!form.academic_session_id}>
                  <option value="">Select term…</option>
                  {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  Payment will be auto-allocated to outstanding charges (oldest first). A receipt will be generated automatically.
                </p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}
        </div>
        <div className="border-t border-border p-4 shrink-0">
          {result ? (
            <button onClick={handleClose} className="w-full h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold">Done</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleClose} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : "Record Payment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}