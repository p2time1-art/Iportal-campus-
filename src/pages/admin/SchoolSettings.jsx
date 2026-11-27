import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/lib/AuthContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Settings, Save, Loader2, CheckCircle2, Palette, Globe, Crown, Upload, RotateCcw, Copy, Lock, ExternalLink } from "lucide-react";
import { DEFAULT_SCHOOL_COLORS, applySchoolTheme, notifySchoolBrandingUpdated } from "@/lib/schoolTheme";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function SchoolSettings() {
  const { schoolId } = useCurrentUser();
  const { checkAppState } = useAuth();
  const [form, setForm] = useState({
    name: "", short_name: "", email: "", phone: "", website: "", address: "", motto: "",
    logo_url: "", crest_url: "",
    ...DEFAULT_SCHOOL_COLORS,
    subdomain: "", slug: "", custom_domain: "", domain_status: "active", subdomain_url: "", portal_url: "",
    sms_notifications: false, custom_domain_enabled: false,
    application_fee_enabled: true, application_fee_amount: "5000",
  });
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [cascadeSummary, setCascadeSummary] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const s = await base44.entities.School.get(schoolId);
        if (s) {
          setForm({
            name: s.name || "",
            short_name: s.short_name || s.school_code || "",
            email: s.email || "",
            phone: s.phone || "",
            website: s.website || "",
            address: s.address || "",
            motto: s.motto || "",
            logo_url: s.logo_url || "",
            crest_url: s.crest_url || "",
            primary_color: s.primary_color || DEFAULT_SCHOOL_COLORS.primary_color,
            accent_color: s.accent_color || DEFAULT_SCHOOL_COLORS.accent_color,
            secondary_color: s.secondary_color || DEFAULT_SCHOOL_COLORS.secondary_color,
            sidebar_color: s.sidebar_color || s.primary_color || DEFAULT_SCHOOL_COLORS.sidebar_color,
            success_color: s.success_color || DEFAULT_SCHOOL_COLORS.success_color,
            violet_color: s.violet_color || DEFAULT_SCHOOL_COLORS.violet_color,
            subdomain: s.subdomain || s.slug || "",
            slug: s.slug || s.subdomain || "",
            custom_domain: s.custom_domain || "",
            domain_status: s.domain_status || (s.custom_domain ? "pending_dns" : "active"),
            subdomain_url: s.subdomain_url || (s.subdomain || s.slug ? `https://${s.subdomain || s.slug}.iportalcampus.com` : ""),
            portal_url: s.portal_url || "",
            sms_notifications: !!s.sms_notifications,
            custom_domain_enabled: !!s.custom_domain_enabled,
            application_fee_enabled: s.application_fee_enabled !== false,
            application_fee_amount: String(s.application_fee_amount ?? 5000),
          });
          setTier(s.subscription_tier || null);
        }
      } catch (_e) {}
      finally { setLoading(false); }
    })();
  }, [schoolId]);

  const handleImageUpload = async (file, key) => {
    if (!file) return;
    setUploading(key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, purpose: "logo" });
      setForm((prev) => ({ ...prev, [key]: file_url }));
    } catch (_e) {}
    finally { setUploading(""); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setCascadeSummary(null);
    try {
      const normalizedCode = (form.short_name || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const {
        subdomain: _sub,
        slug: _slug,
        custom_domain: _cd,
        domain_status: _ds,
        subdomain_url: _su,
        portal_url: _pu,
        custom_domain_enabled: _cde,
        ...editableFields
      } = form;
      const updated = await base44.entities.School.update(schoolId, {
        ...editableFields,
        short_name: normalizedCode || form.short_name,
        code: normalizedCode || undefined,
        school_code: normalizedCode || undefined,
        application_fee_amount: Number(form.application_fee_amount) || 0,
      });
      if (updated?.subscription_tier) setTier(updated.subscription_tier);
      if (updated?.school_code) {
        setForm((prev) => ({ ...prev, short_name: updated.school_code, slug: updated.slug || prev.slug }));
      }
      if (updated?.cascade_summary) {
        setCascadeSummary(updated.cascade_summary);
      }
      notifySchoolBrandingUpdated(updated || form);
      if (typeof checkAppState === "function") {
        checkAppState().catch(() => {});
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (_e) {}
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="School Settings & SaaS Branding"
        subtitle="Configure school profile, custom branding (logo, crest, colors), subdomain/domain, and SaaS subscription add-ons."
        icon={Settings}
      />

      {/* SaaS Subscription Tier Overview */}
      {tier && (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">{tier.plan_label}</h3>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-semibold capitalize text-emerald-600">{tier.status}</span>
                  {tier.expiry_date ? ` · Expires ${tier.expiry_date}` : ""}
                  {tier.days_remaining !== null ? ` (${tier.days_remaining} days left)` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                <span>STUDENT QUOTA</span>
                <span>{tier.current_students} / {tier.max_students ?? "Unlimited"}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--brand-indigo))]"
                  style={{ width: tier.max_students ? `${Math.min(100, (tier.current_students / tier.max_students) * 100)}%` : "15%" }}
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                <span>PORTAL USER ACCOUNTS</span>
                <span>{tier.current_users} / {tier.max_users ?? "Unlimited"}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: tier.max_users ? `${Math.min(100, (tier.current_users / tier.max_users) * 100)}%` : "15%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {cascadeSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            School Code updated from <span className="font-mono">{cascadeSummary.old_code}</span> to <span className="font-mono">{cascadeSummary.new_code}</span>
          </p>
          <p className="text-xs text-emerald-800 mt-1">
            Automatically propagated across {cascadeSummary.users_updated} user PIN(s), {cascadeSummary.teachers_updated} teacher staff ID(s), {cascadeSummary.students_updated} student admission no(s), {cascadeSummary.receipts_updated} receipt(s), and {cascadeSummary.applications_updated} application(s).
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-6">
        {/* General Profile */}
        <div>
          <h3 className="font-heading font-bold text-base text-foreground mb-3">Institution Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>School Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>School Short Code</label>
              <input
                className={`${inputCls} uppercase font-mono`}
                value={form.short_name}
                onChange={(e) => setForm({ ...form, short_name: e.target.value.toUpperCase() })}
                placeholder="e.g. AB"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Changing this updates all connected PINs (SS-ROL-XXXXXX), teacher IDs, and references.</p>
            </div>
            <div>
              <label className={labelCls}>Official Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>School Motto</label>
              <input className={inputCls} value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="e.g. Excellence & Integrity" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Custom Branding */}
        <div className="pt-5 border-t border-border/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Custom Branding (Logo, Crest &amp; Full Color Palette)
            </h3>
            <button
              type="button"
              onClick={() => {
                setForm((prev) => {
                  const next = { ...prev, ...DEFAULT_SCHOOL_COLORS };
                  applySchoolTheme(next);
                  return next;
                });
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-white hover:bg-slate-50 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Colors
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Changes to Logo, School Name, and Motto automatically update your portal header. Pick any theme color below to preview it live.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>School Logo URL</label>
              <div className="flex gap-2">
                <input className={inputCls} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://… or upload" />
                <label className="inline-flex items-center justify-center px-3 h-10 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold shrink-0">
                  {uploading === "logo_url" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], "logo_url")} />
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>School Crest / Emblem URL</label>
              <div className="flex gap-2">
                <input className={inputCls} value={form.crest_url} onChange={(e) => setForm({ ...form, crest_url: e.target.value })} placeholder="https://… or upload" />
                <label className="inline-flex items-center justify-center px-3 h-10 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold shrink-0">
                  {uploading === "crest_url" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], "crest_url")} />
                </label>
              </div>
            </div>
            {[
              { key: "primary_color", label: "Primary / Header Color" },
              { key: "accent_color", label: "Accent / Links Color" },
              { key: "secondary_color", label: "Highlight / CTA Color" },
              { key: "sidebar_color", label: "Sidebar Background Color" },
              { key: "violet_color", label: "Secondary Accent / Gradient" },
              { key: "success_color", label: "Success / Positive Badge Color" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key] || DEFAULT_SCHOOL_COLORS[key]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const next = { ...prev, [key]: val };
                        applySchoolTheme(next);
                        return next;
                      });
                    }}
                    className="w-11 h-10 rounded-lg border border-border cursor-pointer p-1 bg-white shrink-0"
                  />
                  <input
                    className={`${inputCls} font-mono`}
                    value={form[key] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const next = { ...prev, [key]: val };
                        applySchoolTheme(next);
                        return next;
                      });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subdomain & SaaS Add-ons */}
        <div className="pt-5 border-t border-border/60">
          <h3 className="font-heading font-bold text-base text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Subdomain, Custom Domain & SaaS Add-ons
          </h3>
          <div className="rounded-xl border border-border bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                Read-Only — Assigned by Platform Administrator
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  form.domain_status === "active"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : form.domain_status === "verified"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                }`}
              >
                {form.domain_status === "pending_dns"
                  ? "Pending DNS"
                  : form.domain_status === "verified"
                    ? "Verified"
                    : "Active"}
              </span>
            </div>

            {/* Assigned Platform Subdomain */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-lg border border-border px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Assigned Portal Subdomain</p>
                <p className="font-mono text-sm font-bold text-foreground truncate">
                  {form.subdomain_url || (form.subdomain ? `https://${form.subdomain}.iportalcampus.com` : "Not assigned yet")}
                </p>
              </div>
              {(form.subdomain_url || form.subdomain) && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const url = form.subdomain_url || `https://${form.subdomain}.iportalcampus.com`;
                      navigator.clipboard?.writeText(url);
                      setCopiedKey("sub");
                      setTimeout(() => setCopiedKey(""), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-foreground"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedKey === "sub" ? "Copied!" : "Copy Link"}
                  </button>
                  <a
                    href={form.subdomain_url || `https://${form.subdomain}.iportalcampus.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-white hover:bg-slate-50 text-xs font-semibold text-[hsl(var(--brand-indigo))]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Assigned Custom Domain (if configured by Super Admin) */}
            {form.custom_domain && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-lg border border-border px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">Custom Domain</p>
                  <p className="font-mono text-sm font-bold text-[hsl(var(--brand-indigo))] truncate">
                    https://{form.custom_domain}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://${form.custom_domain}`);
                    setCopiedKey("custom");
                    setTimeout(() => setCopiedKey(""), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-foreground shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedKey === "custom" ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}

            {/* DNS Setup Instructions when Custom Domain is Pending DNS */}
            {form.custom_domain && form.domain_status === "pending_dns" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-950 space-y-1.5">
                <p className="font-bold text-amber-900">DNS Setup Instructions (Pending Verification)</p>
                <p>
                  To activate <strong className="font-mono">{form.custom_domain}</strong>, add the following DNS record at your domain registrar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-200">
                    <span className="text-amber-700 block">Type</span>
                    <strong>CNAME</strong>
                  </div>
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-200">
                    <span className="text-amber-700 block">Host / Name</span>
                    <strong className="break-all">{form.custom_domain}</strong>
                  </div>
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-200">
                    <span className="text-amber-700 block">Target / Value</span>
                    <strong>cname.iportalcampus.com</strong>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 pt-1">
                  Once propagated, notify your Platform Administrator to mark the domain as <strong>Active</strong>.
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Need a custom domain (e.g. <span className="font-mono">portal.yourschool.edu.ng</span>) or a subdomain change? Contact Platform Support.
            </p>
          </div>

          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" checked={form.sms_notifications} onChange={(e) => setForm({ ...form, sms_notifications: e.target.checked })} className="w-4 h-4 rounded border-border" />
              Enable SMS Notifications Add-on
            </label>
          </div>
        </div>

        {/* Application Fee */}
        <div className="pt-5 border-t border-border/60">
          <h3 className="font-heading font-bold text-base text-foreground mb-3">Public Admission Application Fee</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className={labelCls}>Application Fee Amount (₦)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.application_fee_amount}
                onChange={(e) => setForm({ ...form, application_fee_amount: e.target.value })}
              />
            </div>
            <div className="pt-5">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.application_fee_enabled}
                  onChange={(e) => setForm({ ...form, application_fee_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                Require application fee payment on submission
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
          {saved && (
            <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
