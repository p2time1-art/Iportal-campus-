import React, { useState, useEffect } from "react";
import FormDrawer from "@/components/admin/FormDrawer";

export default function AdminFormDrawer({ open, onClose, onSaved, schools, admin }) {
  const isEdit = !!admin;
  const [form, setForm] = useState({
    user_id: "", user_email: "", user_name: "",
    school_id: "", role: "school_admin", login_pin: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) {
      setForm({
        user_id: admin.user_id || "",
        user_email: admin.user_email || "",
        user_name: admin.user_name || "",
        school_id: admin.school_id || "",
        role: admin.role || "school_admin",
        login_pin: admin.login_pin || ""
      });
    } else {
      setForm({ user_id: "", user_email: "", user_name: "", school_id: "", role: "school_admin", login_pin: "" });
    }
    setError("");
  }, [admin, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.user_id.trim()) { setError("User ID is required"); return; }
    if (!form.school_id) { setError("Please select a school"); return; }
    setSaving(true);
    setError("");
    try {
      await onSaved(form);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save administrator");
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
      title={isEdit ? "Edit Administrator" : "Assign Administrator"}
      description={isEdit ? "Update administrator assignment" : "Assign a user as a school administrator"}
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Assign Administrator"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>User ID *</label>
          <input className={inputCls} value={form.user_id} onChange={e => set("user_id", e.target.value)} disabled={isEdit} placeholder="Enter the user's ID" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={form.user_name} onChange={e => set("user_name", e.target.value)} placeholder="Display name" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.user_email} onChange={e => set("user_email", e.target.value)} placeholder="user@email.com" />
          </div>
        </div>
        <div>
          <label className={labelCls}>School *</label>
          <select className={inputCls} value={form.school_id} onChange={e => set("school_id", e.target.value)}>
            <option value="">Select a school…</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <select className={inputCls} value={form.role} onChange={e => set("role", e.target.value)}>
            <option value="school_admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Login PIN</label>
          <input className={inputCls} value={form.login_pin} onChange={e => set("login_pin", e.target.value)} placeholder="Optional PIN" />
        </div>
      </div>
    </FormDrawer>
  );
}