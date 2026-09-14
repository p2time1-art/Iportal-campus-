import React, { useState, useEffect } from "react";
import FormDrawer from "@/components/admin/FormDrawer";

export default function PlatformTransactionDrawer({ open, onClose, onSaved, schools, subscriptions }) {
  const [form, setForm] = useState({
    school_id: "", subscription_id: "", amount: 0, currency: "NGN",
    payment_method: "bank_transfer", external_reference: "",
    transaction_date: "", status: "pending", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      school_id: "", subscription_id: "", amount: 0, currency: "NGN",
      payment_method: "bank_transfer", external_reference: "",
      transaction_date: new Date().toISOString().slice(0, 10), status: "pending", notes: ""
    });
    setError("");
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.school_id) { setError("Please select a school"); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be positive"); return; }
    if (!form.transaction_date) { setError("Transaction date is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSaved(form);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to record transaction");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5";
  const filteredSubs = (subscriptions || []).filter(s => !form.school_id || s.school_id === form.school_id);

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Record Platform Transaction"
      description="Record a subscription payment from a school"
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Record Transaction"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>School *</label>
          <select className={inputCls} value={form.school_id} onChange={e => set("school_id", e.target.value)}>
            <option value="">Select a school…</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subscription (optional)</label>
          <select className={inputCls} value={form.subscription_id} onChange={e => set("subscription_id", e.target.value)}>
            <option value="">None</option>
            {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.plan_name} — {s.school_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Amount (₦) *</label>
            <input type="number" className={inputCls} value={form.amount} onChange={e => set("amount", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Payment Method</label>
            <select className={inputCls} value={form.payment_method} onChange={e => set("payment_method", e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="pos">POS</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Transaction Date *</label>
            <input type="date" className={inputCls} value={form.transaction_date} onChange={e => set("transaction_date", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>External Reference</label>
          <input className={inputCls} value={form.external_reference} onChange={e => set("external_reference", e.target.value)} placeholder="Payment reference" />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
    </FormDrawer>
  );
}