import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import AccountStatusBadge from "@/components/admin/AccountStatusBadge";
import OnboardingDrawer from "@/components/admin/OnboardingDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Users, UserPlus, KeyRound, MoreVertical, Loader2, ShieldCheck, ShieldOff, Ban, RefreshCw, Unlink, RotateCcw, CheckCircle2, X } from "lucide-react";

const roleLabels = {
  teacher: "Teacher",
  bursar: "Bursar / Accountant",
  exam_officer: "Exam Officer / Principal",
  student: "Student",
  parent: "Parent",
  school_admin: "School Admin",
  super_admin: "Super Admin",
};

export default function UserAccounts() {
  const { user, schoolId, school } = useCurrentUser();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [actionMenu, setActionMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pinResult, setPinResult] = useState(null);
  const [passwordResetBanner, setPasswordResetBanner] = useState(null);

  const loadMemberships = async () => {
    if (!schoolId) { setLoading(false); return; }
    try {
      const list = await base44.entities.SchoolMembership.filter({ school_id: schoolId }, "-created_date", 200);
      setMemberships(list || []);
    } catch (_e) {
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContext = async () => {
    if (!schoolId) return;
    try {
      const [cls, sess, studs] = await Promise.all([
        base44.entities.SchoolClass.filter({ school_id: schoolId, status: "active" }, "name", 100).catch(() => []),
        base44.entities.AcademicSession.filter({ school_id: schoolId, status: "active" }, "-is_active", 50).catch(() => []),
        base44.entities.Student.filter({ school_id: schoolId, status: "active" }, "full_name", 200).catch(() => [])
      ]);
      setClasses(cls || []);
      setSessions(sess || []);
      setStudents(studs || []);
    } catch (_e) {}
  };

  useEffect(() => {
    if (schoolId) { loadMemberships(); loadContext(); }
  }, [schoolId]);

  const filtered = useMemo(() => {
    return memberships.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (m.user_name || "").toLowerCase();
        const email = (m.user_email || "").toLowerCase();
        const loginPin = (m.login_pin || "").toLowerCase();
        const userPin = (m.user_pin || "").toLowerCase();
        const platformPin = (m.platform_pin || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !loginPin.includes(q) && !userPin.includes(q) && !platformPin.includes(q)) return false;
      }
      return true;
    });
  }, [memberships, search, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: memberships.length,
    active: memberships.filter((m) => m.status === "active").length,
    invited: memberships.filter((m) => m.status === "invited").length,
    suspended: memberships.filter((m) => m.status === "suspended").length,
    inactive: memberships.filter((m) => m.status === "inactive").length,
  }), [memberships]);

  const handleAction = async (action, membership) => {
    setActionLoading(true);
    try {
      const isUserPinAction = action === "generate" || action === "regenerate";
      const fnName = isUserPinAction ? "manageUserPin" : "manageUserAccount";
      const res = await base44.functions.invoke(fnName, { action, membership_id: membership.id });
      const data = res.data || res;
      if (data.password_reset) {
        setPasswordResetBanner({
          userName: data.user_name || membership.user_name || membership.user_email || "User",
          loginPin: data.login_pin || membership.login_pin || membership.user_pin || "",
          defaultPassword: data.default_password || "12345678",
        });
      } else {
        if (data.login_pin) setPinResult({ ...data, pin_type: "login" });
        if (data.pin) setPinResult({ ...data, pin_type: "platform" });
      }
      await loadMemberships();
      setConfirm(null);
      setActionMenu(null);
    } catch (err) {
      setConfirm({ ...confirm, error: err?.response?.data?.error || err?.data?.error || err?.message || "Action failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = (m) => m.user_id === user?.id;

  return (
    <div className="p-6">
      <AdminPageHeader
        title="User Accounts"
        subtitle="Manage portal access, credentials, and account lifecycle for your school."
        actionLabel="Onboard User"
        onAction={() => setOnboardOpen(true)}
        icon={UserPlus}
      />

      {passwordResetBanner && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Password reset for <span className="underline">{passwordResetBanner.userName}</span>!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {passwordResetBanner.loginPin && (
                  <>Login PIN: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{passwordResetBanner.loginPin}</strong>{" · "}</>
                )}
                Default Password: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{passwordResetBanner.defaultPassword}</strong>
                {" · "}The user will be prompted to set a new password on their next login.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPasswordResetBanner(null)}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, cls: "text-foreground" },
          { label: "Active", value: stats.active, cls: "text-emerald-600" },
          { label: "Invited", value: stats.invited, cls: "text-amber-600" },
          { label: "Suspended", value: stats.suspended, cls: "text-red-600" },
          { label: "Inactive", value: stats.inactive, cls: "text-slate-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground font-semibold">{s.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or PIN…" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-white text-sm">
          <option value="all">All Roles</option>
          <option value="bursar">Bursar / Accountant</option>
          <option value="exam_officer">Exam Officer / Principal</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
          <option value="parent">Parents</option>
          <option value="school_admin">School Admins</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-white text-sm">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No user accounts found" description="Onboard teachers, students, and parents to give them portal access." actionLabel="Onboard User" onAction={() => setOnboardOpen(true)} />
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Platform PIN</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{m.user_name || "—"}</p>
                      {isSelf(m) && <span className="text-xs text-[hsl(var(--brand-indigo))] font-semibold">You</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.user_email || "—"}</td>
                    <td className="px-4 py-3">
                      {["teacher", "bursar", "exam_officer", "school_admin"].includes(m.role) && !isSelf(m) ? (
                        <select
                          value={m.role}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            try {
                              await base44.entities.SchoolMembership.update(m.id, { role: newRole });
                              loadMemberships();
                            } catch (_err) {}
                          }}
                          className="h-8 px-2.5 rounded-lg border border-border bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                          title="Assign Sub-Admin / Staff Role"
                        >
                          <option value="teacher">Teacher</option>
                          <option value="bursar">Bursar / Accountant</option>
                          <option value="exam_officer">Exam Officer / Principal</option>
                          <option value="school_admin">School Admin</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {roleLabels[m.role] || m.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className="font-mono text-xs text-foreground">{m.user_pin || "—"}</span></td>
                    <td className="px-4 py-3"><AccountStatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setActionMenu(actionMenu === m.id ? null : m.id)} disabled={isSelf(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground disabled:opacity-40" aria-label="Actions">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenu === m.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                            <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-border bg-white shadow-xl py-1">
                              {m.status !== "active" && (
                                <button onClick={() => { setActionMenu(null); setConfirm({ type: "activate", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Activate</button>
                              )}
                              {m.status === "active" && (
                                <button onClick={() => { setActionMenu(null); setConfirm({ type: "suspend", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><Ban className="w-4 h-4 text-red-600" /> Suspend</button>
                              )}
                              {m.status === "active" && (
                                <button onClick={() => { setActionMenu(null); setConfirm({ type: "deactivate", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><ShieldOff className="w-4 h-4 text-slate-500" /> Deactivate</button>
                              )}
                              <button onClick={() => { setActionMenu(null); setConfirm({ type: "reset_password", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><RotateCcw className="w-4 h-4 text-amber-600" /> Reset Password</button>
                              <button onClick={() => { setActionMenu(null); setConfirm({ type: "reset_pin", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><RefreshCw className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> Reset Login PIN</button>
                              <button onClick={() => { setActionMenu(null); setConfirm({ type: m.user_pin ? "regenerate_user_pin" : "generate_user_pin", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"><KeyRound className="w-4 h-4 text-[hsl(var(--brand-indigo))]" /> {m.user_pin ? "Regenerate Platform PIN" : "Generate Platform PIN"}</button>
                              {m.user_id && (
                                <button onClick={() => { setActionMenu(null); setConfirm({ type: "unlink", membership: m }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Unlink className="w-4 h-4" /> Unlink Account</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding drawer */}
      <OnboardingDrawer
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        schoolId={schoolId}
        schoolName={school?.name}
        classes={classes}
        sessions={sessions}
        students={students}
        onDone={loadMemberships}
      />

      {/* PIN result dialog */}
      {pinResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPinResult(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--brand-indigo-light))] mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-[hsl(var(--brand-indigo))]" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground text-center">{pinResult.pin_type === "platform" ? "Platform PIN" : "New Login PIN"}</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">{pinResult.pin_type === "platform" ? "Unique user identifier." : "Share this PIN with the user."}</p>
            <div className="mt-4 rounded-xl border border-border bg-slate-50 p-4 text-center">
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">{pinResult.pin_type === "platform" ? pinResult.pin : pinResult.login_pin}</span>
            </div>
            <button onClick={() => setPinResult(null)} className="w-full mt-4 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold">Done</button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          title={confirmTitle(confirm.type)}
          message={confirmMessage(confirm.type, confirm.membership)}
          confirmLabel={confirmLabel(confirm.type)}
          loading={actionLoading}
          loadingLabel={confirmLoadingLabel(confirm.type)}
          error={confirm.error}
          onConfirm={() => handleAction(confirm.type.includes('_user_pin') ? confirm.type.replace('_user_pin', '') : confirm.type, confirm.membership)}
        />
      )}
    </div>
  );
}

function confirmTitle(type) {
  return { activate: "Activate Account", suspend: "Suspend Account", deactivate: "Deactivate Account", reset_password: "Reset Password to Default", reset_pin: "Reset Login PIN", generate_user_pin: "Generate Platform PIN", regenerate_user_pin: "Regenerate Platform PIN", unlink: "Unlink Portal Account" }[type] || "Confirm";
}
function confirmMessage(type, m) {
  const name = m?.user_name || m?.user_email || "this user";
  return {
    activate: `Activate ${name}'s portal account? They will be able to log in immediately.`,
    suspend: `Suspend ${name}'s portal account? They will lose access immediately. This can be reversed.`,
    deactivate: `Deactivate ${name}'s portal account? Their profile and all historical records are preserved.`,
    reset_password: `Reset ${name}'s password back to the default (12345678)? Any active sessions will be signed out and they will be asked to choose a new password on their next login.`,
    reset_pin: `Generate a new Login PIN for ${name}? The old PIN will no longer work.`,
    generate_user_pin: `Generate a platform PIN for ${name}? This is a unique identifier for the user.`,
    regenerate_user_pin: `Generate a new platform PIN for ${name}? The old PIN will be replaced immediately.`,
    unlink: `Unlink ${name}'s portal account from their profile? All historical records are preserved. The user will need to be re-onboarded to regain access.`
  }[type] || "Are you sure?";
}
function confirmLabel(type) {
  return { activate: "Activate", suspend: "Suspend", deactivate: "Deactivate", reset_password: "Reset Password", reset_pin: "Reset PIN", generate_user_pin: "Generate", regenerate_user_pin: "Regenerate", unlink: "Unlink" }[type] || "Confirm";
}
function confirmLoadingLabel(type) {
  return { activate: "Activating…", suspend: "Suspending…", deactivate: "Deactivating…", reset_password: "Resetting…", reset_pin: "Resetting…", generate_user_pin: "Generating…", regenerate_user_pin: "Regenerating…", unlink: "Unlinking…" }[type] || "Working…";
}