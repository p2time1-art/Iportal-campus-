import React, { useEffect, useState, useCallback } from "react";
import { CreditCard, Pencil, Trash2, Loader2 } from "lucide-react";
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

export default function FeeCategories() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await base44.entities.FeeCategory.filter({ school_id: schoolId }, "-created_date", 200);
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
    return !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", code: "", description: "", status: "active" }); setFormError(""); setDrawerOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || "", code: item.code || "", description: item.description || "", status: item.status || "active" }); setFormError(""); setDrawerOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setFormError("Category name is required."); return; }
    setSaving(true); setFormError("");
    try {
      if (editing) {
        await base44.entities.FeeCategory.update(editing.id, { ...form, name: form.name.trim(), code: form.code.trim() });
      } else {
        await base44.entities.FeeCategory.create({ ...form, name: form.name.trim(), code: form.code.trim(), school_id: schoolId });
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save fee category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.FeeCategory.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete fee category. It may be in use by fee structures.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Fee Categories" subtitle="Define the categories of fees offered at your school." actionLabel="Add Category" onAction={openAdd} icon={CreditCard} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code…" />
          <p className="text-xs text-muted-foreground">{filtered.length} categor{filtered.length !== 1 ? "ies" : "y"}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No fee categories yet" description="Add fee categories like Tuition, Examination, Development Levy, Sports, ICT, etc." actionLabel="Add Category" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Category Name</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.code || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.description || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
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
        title={editing ? "Edit Fee Category" : "Add Fee Category"}
        description={editing ? "Update category details." : "Create a new fee category."}
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
            <label className={labelCls}>Category Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tuition" />
          </div>
          <div>
            <label className={labelCls}>Category Code</label>
            <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. TUIT" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
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
        title="Delete fee category?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}