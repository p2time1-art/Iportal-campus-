import React, { useEffect, useState, useCallback } from "react";
import { UsersRound, Pencil, Trash2, Loader2, Check, Plus, X, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SearchInput from "@/components/admin/SearchInput";
import OnboardExistingDialog from "@/components/admin/OnboardExistingDialog";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";
const relTypes = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" }
];

export default function Parents() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", relationship: "father", occupation: "", address: "", status: "active", user_id: "" });
  const [rels, setRels] = useState([]);
  const [newRel, setNewRel] = useState({ student_id: "", relationship_type: "guardian", is_primary: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [onboardTarget, setOnboardTarget] = useState(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        base44.entities.ParentGuardian.filter({ school_id: schoolId }, "-created_date", 200),
        base44.entities.Student.filter({ school_id: schoolId }, "-created_date", 500)
      ]);
      setItems(pData || []);
      setStudents(sData || []);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const studentName = (id) => students.find((s) => s.id === id)?.full_name || "Unknown";

  const filtered = items.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.login_pin?.toLowerCase().includes(q) ||
      p.platform_pin?.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ full_name: "", phone: "", email: "", relationship: "father", occupation: "", address: "", status: "active", user_id: "" });
    setRels([]);
    setNewRel({ student_id: "", relationship_type: "guardian", is_primary: false });
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    setForm({ full_name: item.full_name || "", phone: item.phone || "", email: item.email || "", relationship: item.relationship || "father", occupation: item.occupation || "", address: item.address || "", status: item.status || "active", user_id: item.user_id || "" });
    setRels([]);
    setNewRel({ student_id: "", relationship_type: "guardian", is_primary: false });
    setFormError("");
    setDrawerOpen(true);
    try {
      const r = await base44.entities.GuardianRelationship.filter({ school_id: schoolId, guardian_id: item.id }, "-created_date", 100);
      setRels((r || []).map((x) => ({ _id: x.id, student_id: x.student_id, relationship_type: x.relationship_type, is_primary: x.is_primary })));
    } catch (_e) { setRels([]); }
  };

  const addRel = () => {
    if (!newRel.student_id) { setFormError("Select a student to link."); return; }
    if (rels.some((r) => !r._removed && r.student_id === newRel.student_id)) { setFormError("This student is already linked."); return; }
    const turningPrimary = newRel.is_primary;
    setRels((prev) => [...prev, { student_id: newRel.student_id, relationship_type: newRel.relationship_type, is_primary: turningPrimary }].concat(turningPrimary ? prev.map((r) => ({ ...r, is_primary: false })) : prev));
    setNewRel({ student_id: "", relationship_type: "guardian", is_primary: false });
    setFormError("");
  };

  const removeRel = (idx) => {
    setRels((prev) => prev.map((r, i) => (i === idx ? (r._id ? { ...r, _removed: true } : null) : r)).filter(Boolean));
  };

  const togglePrimary = (idx) => {
    const turningOn = !rels[idx].is_primary;
    setRels(rels.map((r, i) => {
      if (r._removed) return r;
      if (i === idx) return { ...r, is_primary: turningOn };
      if (turningOn) return { ...r, is_primary: false };
      return r;
    }));
  };

  const handleSave = async () => {
    if (!form.full_name?.trim()) { setFormError("Parent/guardian name is required."); return; }
    if (!form.phone?.trim()) { setFormError("Phone number is required."); return; }
    setSaving(true); setFormError("");
    try {
      const payload = { ...form, full_name: form.full_name.trim(), school_id: schoolId };
      let saved;
      if (editing) {
        saved = await base44.entities.ParentGuardian.update(editing.id, payload);
      } else {
        saved = await base44.entities.ParentGuardian.create(payload);
      }
      const guardianId = editing?.id || saved?.id;
      // Sync relationships
      if (guardianId) {
        const removed = rels.filter((r) => r._id && r._removed);
        for (const r of removed) { try { await base44.entities.GuardianRelationship.delete(r._id); } catch (_e) {} }
        const toCreate = rels.filter((r) => !r._id && !r._removed).map((r) => ({
          school_id: schoolId, guardian_id: guardianId, guardian_name: payload.full_name,
          student_id: r.student_id, student_name: studentName(r.student_id),
          relationship_type: r.relationship_type, is_primary: r.is_primary
        }));
        if (toCreate.length) await base44.entities.GuardianRelationship.bulkCreate(toCreate);
        const kept = rels.filter((r) => r._id && !r._removed);
        for (const r of kept) {
          try { await base44.entities.GuardianRelationship.update(r._id, { relationship_type: r.relationship_type, is_primary: r.is_primary, guardian_name: payload.full_name, student_name: studentName(r.student_id) }); } catch (_e) {}
        }
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save parent/guardian.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Remove relationships referencing this guardian, then delete
      const r = await base44.entities.GuardianRelationship.filter({ school_id: schoolId, guardian_id: deleteTarget.id }, "-created_date", 200);
      if (r && r.length) await base44.entities.GuardianRelationship.deleteMany({ school_id: schoolId, guardian_id: deleteTarget.id });
      await base44.entities.ParentGuardian.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete parent/guardian.");
    } finally {
      setDeleting(false);
    }
  };

  const visibleRels = rels.filter((r) => !r._removed);

  return (
    <div>
      <AdminPageHeader title="Parents & Guardians" subtitle="Manage parents and guardians, and link them to their children." actionLabel="Add Parent" onAction={openAdd} icon={UsersRound} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, email, or PIN…" />
          <p className="text-xs text-muted-foreground">{filtered.length} parent{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UsersRound} title="No parents yet" description="Add parents and guardians, then link them to their children." actionLabel="Add Parent" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Relationship</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{p.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize whitespace-nowrap">{p.relationship || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setOnboardTarget(p)} className="p-2 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600" aria-label="Onboard portal account" title="Onboard portal account"><UserPlus className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
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
        title={editing ? "Edit Parent/Guardian" : "Add Parent/Guardian"}
        description={editing ? "Update details and linked children." : "Register a parent or guardian."}
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
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Mr. Bola Adeyemi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone *</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0803 123 4567" />
            </div>
            <div>
              <label className={labelCls}>Relationship</label>
              <select className={inputCls} value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. parent@email.com" />
            </div>
            <div>
              <label className={labelCls}>Occupation</label>
              <input className={inputCls} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="e.g. Engineer" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Residential address" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Portal account is created via the Onboard button in the table — no manual user ID entry */}

          {/* Children — managed via GuardianRelationship */}
          <div>
            <label className={labelCls}>Linked Children</label>
            <p className="text-xs text-muted-foreground mb-2">One parent can link to multiple children. Mark the primary contact per child.</p>
            {visibleRels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No children linked yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {visibleRels.map((r) => {
                  const realIdx = rels.indexOf(r);
                  return (
                    <div key={realIdx} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{studentName(r.student_id)}</p>
                        <select value={r.relationship_type} onChange={(e) => setRels(rels.map((x, i) => i === realIdx ? { ...x, relationship_type: e.target.value } : x))} className="mt-1 h-8 px-2 rounded-md border border-border bg-white text-xs">
                          {relTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <button type="button" onClick={() => togglePrimary(realIdx)} className={`shrink-0 inline-flex items-center gap-1 px-2 h-8 rounded-md text-xs font-semibold border ${r.is_primary ? "bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" : "bg-white text-muted-foreground border-border"}`} title="Primary guardian">
                        <Check className="w-3 h-3" /> Primary
                      </button>
                      <button type="button" onClick={() => removeRel(realIdx)} className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Remove"><X className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}
            {students.length > 0 && (
              <div className="rounded-xl border border-dashed border-border p-3 bg-slate-50/40">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Add child</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputCls} value={newRel.student_id} onChange={(e) => setNewRel({ ...newRel, student_id: e.target.value })}>
                    <option value="">Select student…</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <select className={inputCls} value={newRel.relationship_type} onChange={(e) => setNewRel({ ...newRel, relationship_type: e.target.value })}>
                    {relTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={newRel.is_primary} onChange={(e) => setNewRel({ ...newRel, is_primary: e.target.checked })} className="w-4 h-4 rounded border-border" />
                    Mark as primary
                  </label>
                  <button type="button" onClick={addRel} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-indigo))]/90 text-white text-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" /> Link
                  </button>
                </div>
              </div>
            )}
            {students.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">No students available. Add students first.</p>}
          </div>

          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      <OnboardExistingDialog
        open={!!onboardTarget}
        onClose={() => setOnboardTarget(null)}
        profile={onboardTarget}
        role="parent"
        onDone={load}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete parent/guardian?"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? Links to their children will be removed.`}
      />
    </div>
  );
}