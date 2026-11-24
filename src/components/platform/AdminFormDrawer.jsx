import React, { useState, useEffect } from "react";
import FormDrawer from "@/components/admin/FormDrawer";

export default function AdminFormDrawer({ open, onClose, onSaved, schools, admin }) {
  const isEdit = !!admin;
  const [form, setForm] = useState({
    user_name: "",
    user_email: "",
    phone: "",
    school_id: "",
    role: "school_admin",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) {
      setForm({
        user_name: admin.user_name || "",
        user_email: admin.user_email || "",
        phone: admin.user_phone || admin.phone || "",
        school_id: admin.school_id ? String(admin.school_id) : "",
        role: admin.role || "school_admin",
        status: admin.status || "active",
      });
    } else {
      setForm({
        user_name: "",
        user_email: "",
        phone: "",
        school_id: schools?.[0]?.id ? String(schools[0].id) : "",
        role: "school_admin",
        status: "active",
      });
    }
    setError("");
  }, [admin, open, schools]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.user_name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.user_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.user_email.trim())) {
      setError("A valid email address is required.");
      return;
    }
    if (!form.school_id) {
      setError("Please select a school.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        user_name: form.user_name.trim(),
        user_email: form.user_email.trim().toLowerCase(),
        phone: form.phone.trim(),
        school_id: Number(form.school_id),
        ...(isEdit ? { membership_id: admin.id } : {}),
      };
      await onSaved(payload);
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to save administrator.");
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
      title={isEdit ? "Edit Administrator" : "Add Administrator"}
      description={
        isEdit
          ? "Update administrator profile details, school assignment, and status."
          : "Create a new school administrator. User ID and Login PIN (SS-ADM-XXXXXX) are generated automatically."
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Administrator"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {isEdit ? (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-border/60">
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground uppercase">User ID</span>
              <span className="font-mono text-sm font-bold text-foreground">#{admin.user_id}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground uppercase">Login PIN</span>
              <span className="font-mono text-sm font-bold text-[hsl(var(--brand-indigo))]">{admin.login_pin || "—"}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-3.5 py-2.5 text-xs text-indigo-800">
            <strong>Auto-Generated Credentials:</strong> A unique User ID and standard Login PIN (<span className="font-mono">SS-ADM-XXXXXX</span>) will be generated automatically upon saving.
          </div>
        )}

        <div>
          <label className={labelCls}>Full Name *</label>
          <input
            className={inputCls}
            value={form.user_name}
            onChange={(e) => set("user_name", e.target.value)}
            placeholder="e.g. Mrs. Amina Bello"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Email Address *</label>
            <input
              type="email"
              className={inputCls}
              value={form.user_email}
              onChange={(e) => set("user_email", e.target.value)}
              placeholder="admin@school.edu"
            />
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              type="tel"
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 0803 123 4567"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>School *</label>
          <select className={inputCls} value={form.school_id} onChange={(e) => set("school_id", e.target.value)}>
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
            <label className={labelCls}>Role</label>
            <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="school_admin">School Admin (ADM)</option>
              <option value="bursar">Bursar / Accountant (BUR)</option>
              <option value="exam_officer">Exam Officer / Principal (EXM)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>
    </FormDrawer>
  );
}
