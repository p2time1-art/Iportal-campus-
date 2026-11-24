import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AccountStatusBadge from "@/components/admin/AccountStatusBadge";
import { Loader2, Mail, School, Shield, User, Save, CheckCircle2, KeyRound, Copy, Check, AlertTriangle } from "lucide-react";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

const roleLabels = { teacher: "Teacher", student: "Student", parent: "Parent", school_admin: "School Admin", super_admin: "Super Admin" };
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function AccountProfile() {
  const { user, loading: userLoading } = useCurrentUser();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(/** @type {Record<string, string>} */ ({}));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getUserAccountDetails", {});
        setDetails(res.data || res);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = () => {
    // Find the first profile to edit (teacher/student/parent)
    const firstProfile = details?.profiles?.find((p) => p.profile?.type !== "admin");
    if (firstProfile?.profile?.data) {
      const d = firstProfile.profile.data;
      setProfileForm({ phone: d.phone || "", address: d.address || "", qualification: d.qualification || "", occupation: d.occupation || "" });
    }
    setEditing(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const firstProfile = details?.profiles?.find((p) => p.profile?.type !== "admin");
      if (firstProfile?.profile?.data?.id) {
        const type = firstProfile.profile.type;
        const entityName = type === "teacher" ? "Teacher" : type === "student" ? "Student" : "ParentGuardian";
        await base44.entities[entityName].update(firstProfile.profile.data.id, profileForm);
      }
      setEditing(false);
      setSaved(true);
      // Refresh details
      const res = await base44.functions.invoke("getUserAccountDetails", {});
      setDetails(res.data || res);
      setTimeout(() => setSaved(false), 3000);
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const memberships = details?.memberships || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-1">My Account</h1>
      <p className="text-sm text-muted-foreground mb-6">View your portal account details, memberships, and profile information.</p>

      {/* Account summary card */}
      <div className="rounded-2xl border border-border bg-white p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--brand-navy))] flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-lg text-foreground">{user?.full_name || user?.email}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              {user?.role && <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {user.role}</span>}
            </div>
          </div>
        </div>
        {details?.user?.pin && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo-light))] flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Platform PIN</p>
                <p className="font-mono text-base font-bold text-foreground tracking-wider">{details.user.pin}</p>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(details.user.pin); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-50"
            >
              {copied ? <Check className="w-4 h-4 text-[hsl(var(--brand-green))]" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Security — Password Change */}
      <div className="rounded-2xl border border-border bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-navy))] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Security</h3>
              <p className="text-xs text-muted-foreground">Change your login password</p>
            </div>
          </div>
          {details?.user?.must_change_password && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> Password change required
            </span>
          )}
        </div>
        <ChangePasswordForm onSuccess={() => window.location.reload()} />
      </div>

      {/* Memberships */}
      <h3 className="font-heading font-bold text-base text-foreground mb-3">School Memberships</h3>
      {memberships.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">No school memberships found. Contact your school administrator if you believe this is an error.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {memberships.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{m.school_name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[m.role] || m.role}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <AccountStatusBadge status={m.status} />
                    </div>
                  </div>
                </div>
                {m.is_primary && <span className="text-xs font-semibold text-[hsl(var(--brand-indigo))] bg-[hsl(var(--brand-indigo-light))] px-2 py-0.5 rounded-full">Primary</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile details */}
      {details?.profiles?.filter((p) => p.profile?.type !== "admin").map((entry, idx) => {
        const profile = entry.profile?.data;
        const getProfileField = (field) => JSON.parse(JSON.stringify(profile))[field];
        const type = entry.profile?.type;
        if (!profile) return null;
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-base text-foreground">{roleLabels[type] || "Profile"} Profile</h3>
              {!editing && (
                <button onClick={startEdit} className="text-sm font-semibold text-[hsl(var(--brand-indigo))] hover:underline">Edit Details</button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Full Name</p>
                  <p className="text-sm text-foreground mt-0.5">{profile.full_name || "—"}</p>
                </div>
                {profile.admission_number && <div><p className="text-xs font-semibold text-muted-foreground">Admission Number</p><p className="text-sm text-foreground mt-0.5 font-mono">{profile.admission_number}</p></div>}
                {profile.staff_id && <div><p className="text-xs font-semibold text-muted-foreground">Staff ID</p><p className="text-sm text-foreground mt-0.5 font-mono">{profile.staff_id}</p></div>}
                {profile.email && <div><p className="text-xs font-semibold text-muted-foreground">Email</p><p className="text-sm text-foreground mt-0.5">{profile.email}</p></div>}
                {editing ? (
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} value={profileForm.phone || ""} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                ) : (
                  <div><p className="text-xs font-semibold text-muted-foreground">Phone</p><p className="text-sm text-foreground mt-0.5">{getProfileField("phone") || "—"}</p></div>
                )}
                {type === "teacher" && (editing ? (
                  <div><label className={labelCls}>Qualification</label><input className={inputCls} value={profileForm.qualification || ""} onChange={(e) => setProfileForm((p) => ({ ...p, qualification: e.target.value }))} /></div>
                ) : <div><p className="text-xs font-semibold text-muted-foreground">Qualification</p><p className="text-sm text-foreground">{getProfileField("qualification") || "—"}</p></div>)}
                {type === "parent" && (editing ? (
                  <div><label className={labelCls}>Occupation</label><input className={inputCls} value={profileForm.occupation || ""} onChange={(e) => setProfileForm((p) => ({ ...p, occupation: e.target.value }))} /></div>
                ) : <div><p className="text-xs font-semibold text-muted-foreground">Occupation</p><p className="text-sm text-foreground mt-0.5">{getProfileField("occupation") || "—"}</p></div>)}
                {profile.relationship && <div><p className="text-xs font-semibold text-muted-foreground">Relationship</p><p className="text-sm text-foreground mt-0.5 capitalize">{profile.relationship}</p></div>}
                {profile.current_class_name && <div><p className="text-xs font-semibold text-muted-foreground">Class</p><p className="text-sm text-foreground mt-0.5">{profile.current_class_name}</p></div>}
                {profile.gender && <div><p className="text-xs font-semibold text-muted-foreground">Gender</p><p className="text-sm text-foreground mt-0.5 capitalize">{profile.gender}</p></div>}
              </div>

              {/* Linked children for parents */}
              {type === "parent" && entry.profile?.children?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Linked Children</p>
                  <div className="space-y-1">
                    {entry.profile.children.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{c.student_name}</span>
                        {c.is_primary && <span className="text-xs font-semibold text-[hsl(var(--brand-indigo))]">Primary</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editing && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="h-9 px-4 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
                  {saved && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}