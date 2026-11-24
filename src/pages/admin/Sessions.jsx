import React, { useEffect, useState, useCallback } from "react";
import { CalendarDays, Pencil, Trash2, Loader2, CheckCircle2, RefreshCw, GraduationCap } from "lucide-react";
import PromotionWizardModal from "@/components/admin/PromotionWizardModal";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SearchInput from "@/components/admin/SearchInput";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

function computeNextSessionName(existingSessions = []) {
  let maxStartYear = new Date().getFullYear();
  existingSessions.forEach((s) => {
    const m = /^(\d{4})\/(\d{4})$/.exec((s.name || "").trim());
    if (m) {
      const y = Number(m[1]);
      if (y >= maxStartYear) maxStartYear = y + 1;
    }
  });
  return `${maxStartYear}/${maxStartYear + 1}`;
}

function isValidSessionFormat(name) {
  const m = /^(\d{4})\/(\d{4})$/.exec((name || "").trim());
  if (!m) return false;
  return Number(m[2]) === Number(m[1]) + 1;
}

export default function Sessions() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(null);
  const [rollingOver, setRollingOver] = useState(false);
  const [rolloverBanner, setRolloverBanner] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await base44.entities.AcademicSession.filter({ school_id: schoolId }, "-created_date", 100);
      setItems(data || []);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: computeNextSessionName(items), start_date: "", end_date: "", status: "active" });
    setFormError("");
    setDrawerOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || "", start_date: item.start_date || "", end_date: item.end_date || "", status: item.status || "active" });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const trimmed = (form.name || "").trim();
    if (!trimmed) { setFormError("Session name is required."); return; }
    if (!isValidSessionFormat(trimmed)) {
      setFormError("Session must be in YYYY/YYYY consecutive year format (e.g. 2026/2027).");
      return;
    }
    setSaving(true); setFormError("");
    try {
      if (editing) {
        await base44.entities.AcademicSession.update(editing.id, { ...form, name: trimmed });
      } else {
        await base44.entities.AcademicSession.create({ ...form, name: trimmed, school_id: schoolId, is_active: form.status === "active" });
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save session.");
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (session) => {
    setActivating(session.id);
    try {
      await base44.entities.AcademicSession.update(session.id, { is_active: true, status: "active" });
      try { await base44.entities.School.update(schoolId, { current_session_id: session.id }); } catch (_e) {}
      load();
    } catch (_e) {
      setFormError("Unable to set active session.");
    } finally {
      setActivating(null);
    }
  };

  const handleRollover = async () => {
    setRollingOver(true);
    setRolloverBanner("");
    try {
      const res = await base44.functions.invoke("rolloverSession", { school_id: schoolId });
      const data = res?.data || res;
      setRolloverBanner(data.message || "Session rolled over to the next academic year.");
      load();
    } catch (_e) {
      setFormError("Unable to rollover session.");
    } finally {
      setRollingOver(false);
    }
  };

  const archive = async (session) => {
    try {
      await base44.entities.AcademicSession.update(session.id, { status: "archived", is_active: false });
      load();
    } catch (_e) {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.AcademicSession.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete session.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Academic Sessions"
        subtitle="Sessions use YYYY/YYYY format (e.g. 2026/2027) and automatically advance after every Third Term."
        actionLabel="Add Session"
        onAction={openAdd}
        icon={CalendarDays}
      />

      {rolloverBanner && (
        <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-medium">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {rolloverBanner}</span>
          <button onClick={() => setRolloverBanner("")} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search sessions (e.g. 2026/2027)…" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[hsl(var(--brand-indigo))]/10 hover:bg-[hsl(var(--brand-indigo))]/20 text-[hsl(var(--brand-indigo))] text-xs font-semibold"
              title="Guided Third Term class promotion & graduation wizard"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Class Promotion Wizard
            </button>
            <button
              onClick={handleRollover}
              disabled={rollingOver}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-foreground disabled:opacity-60"
              title="Advance to next YYYY/YYYY session and promote students"
            >
              {rollingOver ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Rollover to Next Session
            </button>
            <p className="text-xs text-muted-foreground">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No academic sessions" description="Create your first academic session, e.g. 2026/2027." actionLabel="Add Session" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Session (YYYY/YYYY)</th>
                  <th className="px-4 py-3 font-semibold">Start</th>
                  <th className="px-4 py-3 font-semibold">End</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{s.name}</span>
                        {s.is_active && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.start_date || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.end_date || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!s.is_active && (
                          <button onClick={() => setActive(s)} disabled={activating === s.id} className="px-2.5 h-8 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-60 flex items-center gap-1">
                            {activating === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Set Active
                          </button>
                        )}
                        {s.status === "active" && !s.is_active && (
                          <button onClick={() => archive(s)} className="px-2.5 h-8 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200">Archive</button>
                        )}
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Session" : "Add Session"}
        description="Session name must follow YYYY/YYYY format (e.g. 2026/2027)."
        footer={
          <div className="flex gap-2">
            <button onClick={() => setDrawerOpen(false)} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Session Name (YYYY/YYYY) *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2026/2027" />
            <p className="text-xs text-muted-foreground mt-1">Format: YYYY/YYYY (automatically advances after Third Term closes).</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      <PromotionWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        schoolId={schoolId}
        sessions={items}
        onCompleted={(data) => {
          if (data?.message) setRolloverBanner(data.message);
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete session?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All terms within this session will remain but lose their session link.`}
      />
    </div>
  );
}
