import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Users as UsersIcon, KeyRound, CheckCircle2, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import PaginationBar from "@/components/admin/PaginationBar";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function Users() {
  const [memberships, setMemberships] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1, from: 0, to: 0 });
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetBanner, setResetBanner] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    base44.entities.School.list("-created_date", 500)
      .then((schs) => setSchools(schs || []))
      .catch(() => setSchools([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SchoolMembership.paginate(
        {
          page,
          per_page: perPage,
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          school_id: schoolFilter || undefined,
          status: statusFilter || undefined,
        },
        "-created_date"
      );
      setMemberships(res?.data || []);
      setMeta(res?.meta || { current_page: page, per_page: perPage, total: 0, last_page: 1, from: 0, to: 0 });
    } catch (_e) {
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, roleFilter, schoolFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

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
        userName: data.user_name || resetTarget.user_name || resetTarget.user_email || "User",
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
      <AdminPageHeader title="Users" subtitle="Platform-wide directory of all users and Login PINs across all schools" />

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
                {" · "}The user will be prompted to set a new password on their next login.
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

      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, PIN, or school…" />
        <select className={selectCls + " sm:w-40"} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="school_admin">School Admin</option>
          <option value="bursar">Bursar</option>
          <option value="exam_officer">Exam Officer</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
        <select className={selectCls + " sm:w-48"} value={schoolFilter} onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectCls + " sm:w-36"} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
          </div>
        ) : memberships.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description={search || roleFilter || schoolFilter || statusFilter ? "Try adjusting your filters" : "No users have been registered yet"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Login PIN</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden md:table-cell">School</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {memberships.map((m) => (
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
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">{m.role_label || m.role?.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{m.school_name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {m.created_date ? new Date(m.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setResetError(""); setResetTarget(m); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 transition-colors"
                        title="Reset password to default (12345678)"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          meta={meta}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          loading={loading}
        />
      </div>

      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => { setResetTarget(null); setResetError(""); }}
        title="Reset Password to Default"
        message={`Reset ${resetTarget?.user_name || resetTarget?.user_email || "this user"}'s password back to the default (12345678)? Any active sessions will be signed out and they will be prompted to choose a new password on their next login.`}
        confirmLabel="Reset Password"
        loadingLabel="Resetting…"
        onConfirm={handleResetPassword}
        loading={resetting}
        error={resetError}
      />
    </div>
  );
}
