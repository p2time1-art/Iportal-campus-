import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Award, Plus, Trash2, Check, Loader2, Star } from "lucide-react";
import { defaultScheme } from "@/lib/grading";

const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function GradingConfig() {
  const { schoolId } = useCurrentUser();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activateTarget, setActivateTarget] = useState(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const data = await base44.entities.GradingScheme.filter({ school_id: schoolId }, "-is_active", 50);
      setSchemes(data || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...defaultScheme(), name: "" });
    setDrawerOpen(true);
  };

  const openEdit = (scheme) => {
    setEditing(scheme);
    setForm({
      name: scheme.name,
      components: scheme.components || [],
      grade_boundaries: scheme.grade_boundaries || [],
      enable_position: scheme.enable_position || false
    });
    setDrawerOpen(true);
  };

  const addComponent = () => {
    setForm((f) => ({ ...f, components: [...f.components, { key: `c${f.components.length + 1}`, label: "", max_score: 0 }] }));
  };
  const updateComponent = (i, field, value) => {
    setForm((f) => {
      const comps = [...f.components];
      comps[i] = { ...comps[i], [field]: field === "max_score" ? Number(value) : value };
      return { ...f, components: comps };
    });
  };
  const removeComponent = (i) => {
    setForm((f) => ({ ...f, components: f.components.filter((_, idx) => idx !== i) }));
  };

  const addBoundary = () => {
    setForm((f) => ({ ...f, grade_boundaries: [...f.grade_boundaries, { min_score: 0, grade: "", grade_point: 0, remark: "" }] }));
  };
  const updateBoundary = (i, field, value) => {
    setForm((f) => {
      const bs = [...f.grade_boundaries];
      bs[i] = { ...bs[i], [field]: ["min_score", "grade_point"].includes(field) ? Number(value) : value };
      return { ...f, grade_boundaries: bs };
    });
  };
  const removeBoundary = (i) => {
    setForm((f) => ({ ...f, grade_boundaries: f.grade_boundaries.filter((_, idx) => idx !== i) }));
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        school_id: schoolId,
        name: form.name.trim(),
        components: form.components,
        grade_boundaries: form.grade_boundaries,
        enable_position: form.enable_position
      };
      if (editing) {
        await base44.entities.GradingScheme.update(editing.id, payload);
      } else {
        await base44.entities.GradingScheme.create(payload);
      }
      setDrawerOpen(false);
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const activate = async (scheme) => {
    setSaving(true);
    try {
      await base44.entities.GradingScheme.updateMany({ school_id: schoolId }, { $set: { is_active: false } });
      await base44.entities.GradingScheme.update(scheme.id, { is_active: true });
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
      setActivateTarget(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Grading Configuration"
        subtitle="Define score components, grade boundaries, and grade points for your school."
        actionLabel="New Scheme"
        onAction={openNew}
        icon={Plus}
      />

      {schemes.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No grading schemes yet"
          description="Create a grading scheme to define how scores are calculated and graded."
          actionLabel="Create Scheme"
          onAction={openNew}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
                  {s.is_active && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[hsl(var(--brand-green))]">
                      <Star className="w-3 h-3 fill-current" /> Active
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mb-4">
                <p>{(s.components || []).length} component(s): {(s.components || []).map(c => c.label).join(", ")}</p>
                <p>{(s.grade_boundaries || []).length} grade boundaries</p>
                <p>Class position: {s.enable_position ? "Enabled" : "Disabled"}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(s)} className="flex-1 h-9 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary">Edit</button>
                {!s.is_active && (
                  <button onClick={() => setActivateTarget(s)} className="flex-1 h-9 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-sm font-semibold hover:opacity-90">Set Active</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {drawerOpen && form && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 inset-y-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-heading font-bold text-base text-foreground">{editing ? "Edit Scheme" : "New Grading Scheme"}</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-semibold">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <label className={labelCls}>Scheme Name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Default Grading Scheme" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Score Components</label>
                  <button onClick={addComponent} className="text-xs font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.components.map((c, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input className={inputCls + " flex-1"} value={c.label} onChange={(e) => updateComponent(i, "label", e.target.value)} placeholder="Label (e.g. CA)" />
                      <input type="number" className={inputCls + " w-20"} value={c.max_score} onChange={(e) => updateComponent(i, "max_score", e.target.value)} placeholder="Max" />
                      <input className={inputCls + " w-24"} value={c.key} onChange={(e) => updateComponent(i, "key", e.target.value)} placeholder="Key" />
                      <button onClick={() => removeComponent(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Grade Boundaries</label>
                  <button onClick={addBoundary} className="text-xs font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Enter minimum score for each grade. Boundaries are matched highest-first.</p>
                <div className="space-y-2">
                  {form.grade_boundaries.map((b, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input type="number" className={inputCls + " w-16"} value={b.min_score} onChange={(e) => updateBoundary(i, "min_score", e.target.value)} placeholder="Min" />
                      <input className={inputCls + " w-16"} value={b.grade} onChange={(e) => updateBoundary(i, "grade", e.target.value)} placeholder="Grade" />
                      <input type="number" className={inputCls + " w-20"} value={b.grade_point} onChange={(e) => updateBoundary(i, "grade_point", e.target.value)} placeholder="Point" />
                      <input className={inputCls + " flex-1"} value={b.remark} onChange={(e) => updateBoundary(i, "remark", e.target.value)} placeholder="Remark" />
                      <button onClick={() => removeBoundary(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.enable_position} onChange={(e) => setForm({ ...form, enable_position: e.target.checked })} className="w-4 h-4 rounded border-border accent-[hsl(var(--brand-indigo))]" />
                <span className="text-sm text-foreground">Enable class position / ranking on report cards</span>
              </label>
            </div>
            <div className="border-t border-border p-4 flex gap-3 shrink-0">
              <button onClick={() => setDrawerOpen(false)} className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        title="Set Active Grading Scheme"
        message={`Activate "${activateTarget?.name}"? This will deactivate the current active scheme.`}
        confirmLabel="Activate"
        onConfirm={() => activate(activateTarget)}
        loading={saving}
      />
    </div>
  );
}