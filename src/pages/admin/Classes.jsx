import React, { useEffect, useState, useCallback } from "react";
import { BookOpen, Pencil, Trash2, Loader2, Users } from "lucide-react";
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

export default function Classes() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", class_teacher_id: "", capacity: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [classData, teacherData, studentData] = await Promise.all([
        base44.entities.SchoolClass.filter({ school_id: schoolId }, "-created_date", 200),
        base44.entities.Teacher.filter({ school_id: schoolId, status: "active" }, "-created_date", 200),
        base44.entities.Student.filter({ school_id: schoolId }, "-created_date", 500)
      ]);
      setItems(classData || []);
      setTeachers(teacherData || []);
      const c = {};
      (studentData || []).forEach((s) => {
        if (s.current_class_id) c[s.current_class_id] = (c[s.current_class_id] || 0) + 1;
      });
      setCounts(c);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.class_teacher_name?.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", class_teacher_id: "", capacity: "", status: "active" }); setFormError(""); setDrawerOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || "", class_teacher_id: item.class_teacher_id || "", capacity: item.capacity || "", status: item.status || "active" }); setFormError(""); setDrawerOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setFormError("Class name is required."); return; }
    setSaving(true); setFormError("");
    try {
      const teacher = teachers.find((t) => String(t.id) === String(form.class_teacher_id));
      const payload = {
        name: form.name.trim(),
        class_teacher_id: form.class_teacher_id ? Number(form.class_teacher_id) : null,
        class_teacher_name: teacher?.full_name || "",
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status,
        school_id: schoolId
      };
      if (editing) {
        await base44.entities.SchoolClass.update(editing.id, payload);
      } else {
        await base44.entities.SchoolClass.create(payload);
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.SchoolClass.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete class.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Classes" subtitle="Create and manage classes, assign class teachers and track enrolment." actionLabel="Add Class" onAction={openAdd} icon={BookOpen} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by class or teacher…" />
          <p className="text-xs text-muted-foreground">{filtered.length} class{filtered.length !== 1 ? "es" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No classes yet" description="Create your first class, e.g. JSS 1A or SS 2 Science." actionLabel="Add Class" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Class Teacher</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">Capacity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.class_teacher_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="w-3.5 h-3.5" /> {counts[c.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.capacity || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
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
        title={editing ? "Edit Class" : "Add Class"}
        description={editing ? "Update class details." : "Create a new class."}
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
            <label className={labelCls}>Class Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. JSS 1A" />
            <p className="text-xs text-muted-foreground mt-1">Use any naming convention — JSS 1A, SS 2 Science, Basic 7, etc.</p>
          </div>
          <div>
            <label className={labelCls}>Class Teacher</label>
            <select className={inputCls} value={form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Capacity</label>
            <input type="number" min="0" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 40" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
        title="Delete class?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Students assigned to it will keep their historical records.`}
      />
    </div>
  );
}