import React, { useState, useEffect, useMemo } from "react";
import { Calculator } from "lucide-react";
import FormDrawer from "@/components/admin/FormDrawer";

const BILLING_FORMATS = [
  { key: "format_1", label: "Format 1: 20 – 100 students/users (₦1,000 / user)", min: 20, max: 100, rate: 1000 },
  { key: "format_2", label: "Format 2: 101 – 300 users (₦500 / user)", min: 101, max: 300, rate: 500 },
  { key: "format_3", label: "Format 3: 301 – 500 students/users (₦450 / student)", min: 301, max: 500, rate: 450 },
];

function toIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeEndDate(startStr, billingCycle, planName) {
  const base = startStr ? new Date(`${startStr}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  const end = new Date(base.getTime());

  if (planName === "free_trial") {
    end.setDate(end.getDate() + 14);
    return toIsoDate(end);
  }

  switch (String(billingCycle || "annually").toLowerCase()) {
    case "monthly":
      end.setMonth(end.getMonth() + 1);
      break;
    case "termly":
      end.setMonth(end.getMonth() + 4);
      break;
    case "annually":
    case "one_time":
    default:
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  return toIsoDate(end);
}

function detectFormatForCount(count) {
  if (count >= 301) return "format_3";
  if (count >= 101) return "format_2";
  return "format_1";
}

function computeTieredAmount(formatKey, registeredCount) {
  const fmt = BILLING_FORMATS.find((f) => f.key === formatKey) || BILLING_FORMATS[0];
  const raw = Math.max(0, Number(registeredCount) || 0);
  const floorApplied = raw < fmt.min;
  const billable = Math.min(fmt.max, Math.max(raw, fmt.min));
  return {
    ...fmt,
    registered: raw,
    billable,
    floorApplied,
    total: billable * fmt.rate,
  };
}

export default function SubscriptionFormDrawer({ open, onClose, onSaved, schools, subscription }) {
  const isEdit = !!subscription;
  const todayStr = toIsoDate(new Date());

  const [form, setForm] = useState({
    school_id: "",
    plan_name: "standard",
    status: "active",
    billing_cycle: "termly",
    billing_format: "format_1",
    start_date: todayStr,
    expiry_date: computeEndDate(todayStr, "termly", "standard"),
    amount: 20000,
    external_reference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSchool = useMemo(
    () => schools.find((s) => String(s.id) === String(form.school_id)) || null,
    [schools, form.school_id]
  );

  const registeredUsersCount = useMemo(() => {
    if (!selectedSchool) return 0;
    const tier = selectedSchool.subscription_tier || {};
    return Math.max(Number(tier.current_students || 0), Number(tier.current_users || 0));
  }, [selectedSchool]);

  const billingCalc = useMemo(
    () => computeTieredAmount(form.billing_format, registeredUsersCount),
    [form.billing_format, registeredUsersCount]
  );

  useEffect(() => {
    if (subscription) {
      const start = subscription.start_date || todayStr;
      const cycle = subscription.billing_cycle || "annually";
      const plan = subscription.plan_name || "standard";
      setForm({
        school_id: subscription.school_id ? String(subscription.school_id) : "",
        plan_name: plan,
        status: subscription.status || "active",
        billing_cycle: cycle,
        billing_format: subscription.billing_format || "format_1",
        start_date: start,
        expiry_date: subscription.expiry_date || computeEndDate(start, cycle, plan),
        amount: Number(subscription.amount || 0),
        external_reference: subscription.external_reference || "",
        notes: subscription.notes || "",
      });
    } else {
      const defaultCycle = "termly";
      const defaultPlan = "standard";
      const start = toIsoDate(new Date());
      const calc = computeTieredAmount("format_1", 0);
      setForm({
        school_id: "",
        plan_name: defaultPlan,
        status: "active",
        billing_cycle: defaultCycle,
        billing_format: "format_1",
        start_date: start,
        expiry_date: computeEndDate(start, defaultCycle, defaultPlan),
        amount: calc.total,
        external_reference: "",
        notes: "",
      });
    }
    setError("");
  }, [subscription, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSchoolChange = (schoolIdVal) => {
    const sch = schools.find((s) => String(s.id) === String(schoolIdVal));
    const tier = sch?.subscription_tier || {};
    const count = Math.max(Number(tier.current_students || 0), Number(tier.current_users || 0));
    const autoFormat = detectFormatForCount(count);
    const calc = computeTieredAmount(autoFormat, count);
    setForm((f) => ({
      ...f,
      school_id: schoolIdVal,
      billing_format: autoFormat,
      amount: f.plan_name === "free_trial" ? 0 : calc.total,
    }));
  };

  const handlePlanChange = (nextPlan) => {
    setForm((f) => {
      const start = f.start_date || todayStr;
      const nextExpiry = computeEndDate(start, f.billing_cycle, nextPlan);
      const nextStatus = nextPlan === "free_trial" ? "trial" : (f.status === "trial" ? "active" : f.status);
      const calc = computeTieredAmount(f.billing_format, registeredUsersCount);
      return {
        ...f,
        plan_name: nextPlan,
        status: nextStatus,
        start_date: start,
        expiry_date: nextExpiry,
        amount: nextPlan === "free_trial" ? 0 : calc.total,
      };
    });
  };

  const handleCycleChange = (nextCycle) => {
    setForm((f) => {
      const start = f.start_date || todayStr;
      return {
        ...f,
        billing_cycle: nextCycle,
        start_date: start,
        expiry_date: computeEndDate(start, nextCycle, f.plan_name),
      };
    });
  };

  const handleStartDateChange = (nextStart) => {
    setForm((f) => ({
      ...f,
      start_date: nextStart,
      expiry_date: nextStart ? computeEndDate(nextStart, f.billing_cycle, f.plan_name) : f.expiry_date,
    }));
  };

  const handleFormatChange = (nextFormat) => {
    const calc = computeTieredAmount(nextFormat, registeredUsersCount);
    setForm((f) => ({
      ...f,
      billing_format: nextFormat,
      amount: f.plan_name === "free_trial" ? 0 : calc.total,
    }));
  };

  const handleSubmit = async () => {
    if (!form.school_id) {
      setError("Please select a school.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaved({
        ...form,
        school_id: Number(form.school_id),
        amount: Number(form.amount) || 0,
      });
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to save subscription.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5";
  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Subscription" : "Create Subscription"}
      description={isEdit ? "Update subscription duration, tier, and billing details." : "Create a subscription with automatic duration and tiered per-user billing."}
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Subscription"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>School *</label>
          <select className={inputCls} value={form.school_id} onChange={(e) => handleSchoolChange(e.target.value)} disabled={isEdit}>
            <option value="">Select a school…</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Plan</label>
            <select className={inputCls} value={form.plan_name} onChange={(e) => handlePlanChange(e.target.value)}>
              <option value="free_trial">Free Trial (14 Days)</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Billing Cycle & Auto-Calculated Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Billing Cycle</label>
            <select className={inputCls} value={form.billing_cycle} onChange={(e) => handleCycleChange(e.target.value)}>
              <option value="monthly">Monthly (1 Month)</option>
              <option value="termly">Termly (4 Months)</option>
              <option value="annually">Annually (12 Months)</option>
              <option value="one_time">One Time (12 Months)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" className={inputCls} value={form.start_date} onChange={(e) => handleStartDateChange(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End / Expiry Date</label>
            <input type="date" className={inputCls} value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
          </div>
        </div>

        {/* Tiered Billing Format Selector & Live Breakdown */}
        {form.plan_name !== "free_trial" && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wide">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Tiered Per-User Billing Calculator
            </div>
            <div>
              <label className={labelCls}>Billing Format</label>
              <select className={inputCls} value={form.billing_format} onChange={(e) => handleFormatChange(e.target.value)}>
                {BILLING_FORMATS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs bg-white rounded-lg border border-indigo-100 p-2.5">
              <div>
                <p className="text-slate-500">Registered</p>
                <p className="font-bold text-slate-900">{billingCalc.registered} users</p>
              </div>
              <div>
                <p className="text-slate-500">Billable {billingCalc.floorApplied ? `(Min ${billingCalc.min})` : ""}</p>
                <p className="font-bold text-indigo-700">{billingCalc.billable} × {fmtNaira(billingCalc.rate)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Calculated Total</p>
                <p className="font-extrabold text-emerald-700">{fmtNaira(billingCalc.total)}</p>
              </div>
            </div>
            {billingCalc.floorApplied && (
              <p className="text-[11px] text-indigo-800">
                School has {billingCalc.registered} registered user(s) (below tier minimum of {billingCalc.min}), so the minimum of <strong>{billingCalc.min}</strong> users is billed.
              </p>
            )}
          </div>
        )}

        <div>
          <label className={labelCls}>Billing Amount (₦)</label>
          <input type="number" className={inputCls} value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} />
        </div>

        <div>
          <label className={labelCls}>External Reference</label>
          <input className={inputCls} value={form.external_reference} onChange={(e) => set("external_reference", e.target.value)} placeholder="Payment reference" />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
    </FormDrawer>
  );
}
