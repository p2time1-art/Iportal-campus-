import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Pencil, Trash2, Loader2, CheckCircle2, Lock, Unlock } from "lucide-react";
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

export default function Terms() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ session_id: "", name: "", start_date: "", end_date: "", status: "open" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(null);
  const [rolloverNotice, setRolloverNotice] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [termData, sessData] = await Promise.all([
        base44.entities.Term.filter({ school_id: schoolId }, "-created_date", 200),
        base44.entities.AcademicSession.filter({ school_id: schoolId }, "-created_date", 100)
      ]);
      setItems(termData || []);
      setSessions(sessData || []);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name?.toLowerCase().includes(q) || t.session_name?.toLowerCase().includes(q);
    const matchSession = !filterSession || String(t.session_id) === String(filterSession);
    return matchSearch && matchSession;
  });

  const openAdd = () => { setEditing(null); setForm({ session_id: sessions.find((s) => s.is_active)?.id || sessions[0]?.id || "", name: "", start_date: "", end_date: "", status: "open" }); setFormError(""); setDrawerOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ session_id: item.session_id || "", name: item.name || "", start_date: item.start_date || "", end_date: item.end_date || "", status: item.status || "open" }); setFormError(""); setDrawerOpen(true); };

  const handleSave = async () => {
    if (!form.session_id) { setFormError("Please select a session."); return; }
    if (!form.name?.trim()) { setFormError("Term name is required."); return; }
    setSaving(true); setFormError("");
    try {
      const sess = sessions.find((s) => s.id === form.session_id);
      const payload = { ...form, name: form.name.trim(), school_id: schoolId, session_name: sess?.name || "" };
      if (editing) {
        await base44.entities.Term.update(editing.id, payload);
      } else {
        await base44.entities.Term.create({ ...payload, is_current: false });
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save term.");
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (term) => {
    setSettingCurrent(term.id);
    try {
      // Only one current term per session
      await base44.entities.Term.updateMany(
        { school_id: schoolId, session_id: term.session_id, is_current: true },
        { $set: { is_current: false } }
      );
      await base44.entities.Term.update(term.id, { is_current: true, status: "open" });
      load();
    } catch (_e) {
      setFormError("Unable to set current term.");
    } finally {
      setSettingCurrent(null);
    }
  };

  const toggleStatus = async (term) => {
    const next = term.status === "open" ? "closed" : "open";
    try {
      const res = await base44.entities.Term.update(term.id, { status: next });
      if (res?.session_rolled_over && res?.new_session_name) {
        setRolloverNotice(`Third Term closed — Academic Session automatically updated to ${res.new_session_name} (First Term active)!`);
      }
      load();
    } catch (_e) {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Term.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete term.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Terms" subtitle="Manage terms within academic sessions. Closing Third Term automatically advances the school to the next YYYY/YYYY session." actionLabel="Add Term" onAction={openAdd} icon={Calendar} />

      {rolloverNotice && (
        <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-medium">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {rolloverNotice}</span>
          <button onClick={() => setRolloverNotice("")} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search terms…" />
            <select className="h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
              <option value="">All sessions</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} term{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Calendar} title="No terms yet" description="Add terms to your academic sessions, e.g. First Term, Second Term." actionLabel="Add Term" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Start</th>
                  <th className="px-4 py-3 font-semibold">End</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{t.name}</span>
                        {t.is_current && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Current</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.session_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.start_date || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.end_date || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!t.is_current && (
                          <button onClick={() => setCurrent(t)} disabled={settingCurrent === t.id} className="px-2.5 h-8 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-60 flex items-center gap-1">
                            {settingCurrent === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Set Current
                          </button>
                        )}
                        <button onClick={() => toggleStatus(t)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label={t.status === "open" ? "Close term" : "Open term"}>
                          {t.status === "open" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
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
        title={editing ? "Edit Term" : "Add Term"}
        description={editing ? "Update term details." : "Create a new term within a session."}
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
            <label className={labelCls}>Academic Session *</label>
            <select className={inputCls} value={form.session_id} onChange={(e) => setForm({ ...form, session_id: e.target.value })}>
              <option value="">Select session…</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Term Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. First Term" />
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
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete term?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}