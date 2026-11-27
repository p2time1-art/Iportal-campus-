import React, { useState, useEffect } from "react";
import FormDrawer from "@/components/admin/FormDrawer";

export default function SchoolFormDrawer({ open, onClose, onSaved, school }) {
  const isEdit = !!school;
  const [form, setForm] = useState({
    name: "", school_code: "", short_name: "", motto: "",
    address: "", city: "", country: "", phone: "", email: "", website: "",
    logo_url: "", status: "active", plan: "basic",
    subdomain: "", custom_domain: "", domain_status: "active"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name || "", school_code: school.school_code || "",
        short_name: school.short_name || "", motto: school.motto || "",
        address: school.address || "", city: school.city || "",
        country: school.country || "", phone: school.phone || "",
        email: school.email || "", website: school.website || "",
        logo_url: school.logo_url || "", status: school.status || "active",
        plan: school.plan || "basic",
        subdomain: school.subdomain || school.slug || "",
        custom_domain: school.custom_domain || "",
        domain_status: school.domain_status || (school.custom_domain ? "pending_dns" : "active")
      });
    } else {
      setForm({
        name: "", school_code: "", short_name: "", motto: "",
        address: "", city: "", country: "", phone: "", email: "", website: "",
        logo_url: "", status: "active", plan: "basic",
        subdomain: "", custom_domain: "", domain_status: "active"
      });
    }
    setError("");
  }, [school, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("School name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSaved({
        ...form,
        slug: form.subdomain || undefined,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e?.data?.error || e?.message || "Failed to save school");
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
      title={isEdit ? "Edit School" : "Create New School"}
      description={isEdit ? "Update school information" : "Register a new school on the platform"}
      footer={
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-destructive mr-auto">{error}</span>}
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="h-10 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create School"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>School Name *</label>
          <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Gracefield College" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>School Code</label>
            <input className={inputCls} value={form.school_code} onChange={e => set("school_code", e.target.value)} placeholder="e.g. GCC" />
          </div>
          <div>
            <label className={labelCls}>Short Name</label>
            <input className={inputCls} value={form.short_name} onChange={e => set("short_name", e.target.value)} placeholder="e.g. Gracefield" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Motto</label>
          <input className={inputCls} value={form.motto} onChange={e => set("motto", e.target.value)} placeholder="School motto" />
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={form.country} onChange={e => set("country", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input className={inputCls} value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className={labelCls}>Logo URL</label>
          <input className={inputCls} value={form.logo_url} onChange={e => set("logo_url", e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Plan</label>
            <select className={inputCls} value={form.plan} onChange={e => set("plan", e.target.value)}>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Super Admin Portal Domain Assignment */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--brand-indigo))]">
              Portal Domain &amp; Routing
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Assign a unique platform subdomain and optional custom domain for this school.
            </p>
          </div>
          <div>
            <label className={labelCls}>Subdomain</label>
            <div className="flex items-center">
              <input
                className="w-full h-10 px-3 rounded-l-lg bg-white border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                value={form.subdomain}
                onChange={e => set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. gracefield"
              />
              <span className="h-10 px-3 inline-flex items-center bg-slate-100 border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground font-mono shrink-0">
                .iportalcampus.com
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Custom Domain (Optional)</label>
              <input
                className={inputCls + " font-mono"}
                value={form.custom_domain}
                onChange={e => {
                  const val = e.target.value.toLowerCase().trim();
                  setForm(f => ({
                    ...f,
                    custom_domain: val,
                    domain_status: val && !f.custom_domain ? "pending_dns" : f.domain_status
                  }));
                }}
                placeholder="portal.schoolname.edu.ng"
              />
            </div>
            <div>
              <label className={labelCls}>Domain Status</label>
              <select
                className={inputCls}
                value={form.domain_status}
                onChange={e => set("domain_status", e.target.value)}
              >
                <option value="pending_dns">Pending DNS</option>
                <option value="verified">Verified</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </FormDrawer>
  );
}