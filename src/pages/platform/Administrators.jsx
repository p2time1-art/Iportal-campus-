import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, UserCog, Pencil, UserX, KeyRound, CheckCircle2, Copy, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminFormDrawer from "@/components/platform/AdminFormDrawer";

export default function Administrators() {
  const [memberships, setMemberships] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [createdBanner, setCreatedBanner] = useState(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetBanner, setResetBanner] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mems, schs] = await Promise.all([
        base44.entities.SchoolMembership.filter({ role: "school_admin" }, "-created_date", 500),
        base44.entities.School.list("-created_date", 500)
      ]);
      setMemberships(mems || []);
      setSchools(schs || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = memberships.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.user_name?.toLowerCase().includes(q) ||
      m.user_email?.toLowerCase().includes(q) ||
      m.login_pin?.toLowerCase().includes(q) ||
      m.school_name?.toLowerCase().includes(q);
    const matchSchool = !schoolFilter || String(m.school_id) === String(schoolFilter);
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchSchool && matchStatus;
  });

  const handleSave = async (form) => {
    const res = await base44.functions.invoke("manageAdmin", { action: "assign", ...form });
    const data = res?.data || res || {};
    if (!form.membership_id && data?.login_pin) {
      setCreatedBanner({
        name: form.user_name,
        userId: data.user_id,
        pin: data.login_pin,
        defaultPassword: data.default_password || "12345678",
        isNewUser: data.is_new_user !== false,
      });
      setCopiedPin(false);
    }
    await load();
  };

  const handleRemove = async () => {
    setProcessing(true);
    try {
      await base44.functions.invoke("manageAdmin", { action: "remove", membership_id: confirm.id });
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetError("");
    try {
      const res = await base44.functions.invoke("manageUserAccount", {
        action: "reset_password",
        membership_id: resetTarget.id,
      });
      const data = res?.data || res || {};
      setResetBanner({
        userName: data.user_name || resetTarget.user_name || resetTarget.user_email || "Administrator",
        loginPin: data.login_pin || resetTarget.login_pin || resetTarget.user_pin || "",
        defaultPassword: data.default_password || "12345678",
      });
      setResetTarget(null);
    } catch (err) {
      setResetError(err?.response?.data?.error || err?.data?.error || err?.message || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  const selectCls = "h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

  return (
    <div>
      <AdminPageHeader
        title="Administrators"
        subtitle="Manage school administrator accounts and assignments across the platform"
        actionLabel="Add Administrator"
        onAction={() => { setEditAdmin(null); setDrawerOpen(true); }}
        icon={Plus}
      />

      {createdBanner && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Administrator <span className="underline">{createdBanner.name}</span> created &amp; assigned!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                User ID: <strong className="font-mono">#{createdBanner.userId}</strong>
                {" · "}Login PIN: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{createdBanner.pin}</strong>
                {createdBanner.isNewUser && (
                  <>{" · "}Default Password: <strong className="font-mono">{createdBanner.defaultPassword}</strong></>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(createdBanner.pin);
                setCopiedPin(true);
                setTimeout(() => setCopiedPin(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Copy className="w-3.5 h-3.5" /> {copiedPin ? "Copied!" : "Copy PIN"}
            </button>
            <button
              type="button"
              onClick={() => setCreatedBanner(null)}
              className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {resetBanner && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Password reset for <span className="underline">{resetBanner.userName}</span>!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {resetBanner.loginPin && (
                  <>Login PIN: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{resetBanner.loginPin}</strong>{" · "}</>
                )}
                Default Password: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{resetBanner.defaultPassword}</strong>
                {" · "}They will be prompted to choose a new password on their next login.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResetBanner(null)}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, PIN, or school…" />
        <select className={selectCls + " sm:w-48"} value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectCls + " sm:w-36"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="No administrators found" description={search || schoolFilter || statusFilter ? "Try adjusting your filters" : "Add the first school administrator"} actionLabel="Add Administrator" onAction={() => { setEditAdmin(null); setDrawerOpen(true); }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Login PIN</th>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3 hidden md:table-cell">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--brand-indigo))] to-[hsl(var(--brand-violet))] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(m.user_name || m.user_email || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{m.user_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.user_email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[hsl(var(--brand-indigo))] whitespace-nowrap">
                      {m.login_pin || m.user_pin || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.school_name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] capitalize">{m.role?.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {m.created_date ? new Date(m.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setResetError(""); setResetTarget(m); }} className="p-2 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600" title="Reset Password (12345678)"><KeyRound className="w-4 h-4" /></button>
                        <button onClick={() => { setEditAdmin(m); setDrawerOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirm(m)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Remove"><UserX className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSave} schools={schools} admin={editAdmin} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Remove Administrator"
        message={`Remove ${confirm?.user_name || confirm?.user_email} from ${confirm?.school_name}? They will lose access to this school. Historical data is preserved.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        loading={processing}
      />

      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => { setResetTarget(null); setResetError(""); }}
        title="Reset Password to Default"
        message={`Reset ${resetTarget?.user_name || resetTarget?.user_email || "this administrator"}'s password back to the default (12345678)? Any active sessions will be signed out and they will be prompted to choose a new password on their next login.`}
        confirmLabel="Reset Password"
        loadingLabel="Resetting…"
        onConfirm={handleResetPassword}
        loading={resetting}
        error={resetError}
      />
    </div>
  );
}
