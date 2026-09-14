import React, { useState, useEffect } from "react";
import FormDrawer from "@/components/admin/FormDrawer";

export default function SubscriptionFormDrawer({ open, onClose, onSaved, schools, subscription }) {
  const isEdit = !!subscription;
  const [form, setForm] = useState({
    school_id: "", plan_name: "basic", status: "trial",
    start_date: "", expiry_date: "", amount: 0, billing_cycle: "annually",
    external_reference: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (subscription) {
      setForm({
        school_id: subscription.school_id || "",
        plan_name: subscription.plan_name || "basic",
        status: subscription.status || "trial",
        start_date: subscription.start_date || "",
        expiry_date: subscription.expiry_date || "",
        amount: subscription.amount || 0,
        billing_cycle: subscription.billing_cycle || "annually",
        external_reference: subscription.external_reference || "",
        notes: subscription.notes || ""
      });
    } else {
      setForm({ school_id: "", plan_name: "basic", status: "trial", start_date: "", expiry_date: "", amount: 0, billing_cycle: "annually", external_reference: "", notes: "" });
    }
    setError("");
  }, [subscription, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.school_id) { setError("Please select a school"); return; }
    setSaving(true);
    setError("");
    try {
      await onSaved(form);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5";

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Subscription" : "Create Subscription"}
      description={isEdit ? "Update subscription details" : "Create a new subscription for a school"}
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Subscription"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>School *</label>
          <select className={inputCls} value={form.school_id} onChange={e => set("school_id", e.target.value)} disabled={isEdit}>
            <option value="">Select a school…</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Plan</label>
            <select className={inputCls} value={form.plan_name} onChange={e => set("plan_name", e.target.value)}>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" className={inputCls} value={form.start_date} onChange={e => set("start_date", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Expiry Date</label>
            <input type="date" className={inputCls} value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Amount (₦)</label>
            <input type="number" className={inputCls} value={form.amount} onChange={e => set("amount", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Billing Cycle</label>
            <select className={inputCls} value={form.billing_cycle} onChange={e => set("billing_cycle", e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="termly">Termly</option>
              <option value="annually">Annually</option>
              <option value="one_time">One Time</option>
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