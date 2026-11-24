import React, { useState, useEffect } from "react";
import { Settings, Save, Loader2, CheckCircle2, Palette, User, Upload, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react";
import { apiRequest } from "@/api/client";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { DEFAULT_SCHOOL_COLORS, applySchoolTheme, notifyPlatformSettingsUpdated } from "@/lib/schoolTheme";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function PlatformSettings() {
  const { checkAppState } = useAuth();
  const [form, setForm] = useState({
    platform_name: "iPortal Campus",
    tagline: "Platform Administration",
    logo_url: "",
    support_email: "",
    support_phone: "",
    website: "",
    ...DEFAULT_SCHOOL_COLORS,
  });
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    login_pin: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/platform/settings");
        const d = res?.data || {};
        setForm({
          platform_name: d.platform_name || "iPortal Campus",
          tagline: d.tagline || "Platform Administration",
          logo_url: d.logo_url || "",
          support_email: d.support_email || "",
          support_phone: d.support_phone || "",
          website: d.website || "",
          primary_color: d.primary_color || DEFAULT_SCHOOL_COLORS.primary_color,
          accent_color: d.accent_color || DEFAULT_SCHOOL_COLORS.accent_color,
          secondary_color: d.secondary_color || DEFAULT_SCHOOL_COLORS.secondary_color,
          sidebar_color: d.sidebar_color || DEFAULT_SCHOOL_COLORS.sidebar_color,
          violet_color: d.violet_color || DEFAULT_SCHOOL_COLORS.violet_color,
          success_color: d.success_color || DEFAULT_SCHOOL_COLORS.success_color,
        });
        if (d.profile) {
          setProfile({
            full_name: d.profile.full_name || "",
            email: d.profile.email || "",
            phone: d.profile.phone || "",
            login_pin: d.profile.login_pin || "",
          });
        }
      } catch (e) {
        setError(e?.message || "Unable to load platform settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, purpose: "logo" });
      setForm((prev) => ({ ...prev, logo_url: file_url }));
    } catch (e) {
      setError(e?.message || "Logo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await apiRequest("/platform/settings", {
        method: "PATCH",
        body: {
          ...form,
          profile: {
            full_name: profile.full_name.trim(),
            email: profile.email.trim().toLowerCase(),
            phone: profile.phone.trim(),
          },
        },
      });
      const updated = res?.data || form;
      notifyPlatformSettingsUpdated(updated);
      if (typeof checkAppState === "function") {
        checkAppState().catch(() => {});
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setError(err?.message || "Unable to save platform settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Platform Settings"
        subtitle="Manage Super Admin profile details, platform identity, and Super Admin dashboard colors (strictly isolated from school-level settings)."
        icon={Settings}
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-6">
        {/* Super Admin Profile */}
        <div>
          <h3 className="font-heading font-bold text-base text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Super Admin Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input
                className={inputCls}
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Email Address *</label>
              <input
                type="email"
                className={inputCls}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                className={inputCls}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="e.g. 0803 000 0000"
              />
            </div>
            <div>
              <label className={labelCls}>Platform Login PIN</label>
              <input className={`${inputCls} font-mono bg-slate-50 text-muted-foreground`} value={profile.login_pin || "—"} disabled />
            </div>
          </div>
        </div>

        {/* Platform Identity */}
        <div className="pt-5 border-t border-border/60">
          <h3 className="font-heading font-bold text-base text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Platform Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platform Name</label>
              <input
                className={inputCls}
                value={form.platform_name}
                onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                placeholder="iPortal Campus"
              />
            </div>
            <div>
              <label className={labelCls}>Platform Tagline</label>
              <input
                className={inputCls}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="Platform Administration"
              />
            </div>
            <div>
              <label className={labelCls}>Platform Logo URL</label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://… or upload"
                />
                <label className="inline-flex items-center justify-center px-3 h-10 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold shrink-0">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>Support Email</label>
              <input
                type="email"
                className={inputCls}
                value={form.support_email}
                onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                placeholder="support@iportalcampus.com"
              />
            </div>
            <div>
              <label className={labelCls}>Support Phone</label>
              <input
                className={inputCls}
                value={form.support_phone}
                onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Platform Website</label>
              <input
                className={inputCls}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://iportalcampus.com"
              />
            </div>
          </div>
        </div>

        {/* Platform Color Palette */}
        <div className="pt-5 border-t border-border/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Super Admin Theme Colors
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
            These colors apply exclusively to the Super Admin dashboard. School Admin theme changes never affect your Super Admin view.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Submit */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-4">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Platform settings saved!
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
