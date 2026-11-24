import React, { useEffect, useState, useCallback } from "react";
import { Users, Pencil, Trash2, Loader2, ClipboardList, Plus, X, UserPlus, CheckCircle2, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SearchInput from "@/components/admin/SearchInput";
import OnboardExistingDialog from "@/components/admin/OnboardExistingDialog";
import BulkCsvImportModal from "@/components/admin/BulkCsvImportModal";
import { Upload } from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function Teachers() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: "", staff_id: "", gender: "", phone: "", email: "", qualification: "", status: "active", date_of_birth: "", address: "", user_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [newAssign, setNewAssign] = useState({ class_id: "", subject_id: "" });
  const [assignError, setAssignError] = useState("");
  const [onboardTarget, setOnboardTarget] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [createdBanner, setCreatedBanner] = useState(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [tData, cData, sData] = await Promise.all([
        base44.entities.Teacher.filter({ school_id: schoolId }, "-created_date", 200),
        base44.entities.SchoolClass.filter({ school_id: schoolId, status: "active" }, "name", 200),
        base44.entities.Subject.filter({ school_id: schoolId, status: "active" }, "name", 200)
      ]);
      setItems(tData || []);
      setClasses(cData || []);
      setSubjects(sData || []);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.full_name?.toLowerCase().includes(q) ||
      t.staff_id?.toLowerCase().includes(q) ||
      t.staff_number?.toLowerCase().includes(q) ||
      t.login_pin?.toLowerCase().includes(q) ||
      t.pin?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q)
    );
  });

  const openAdd = () => { setEditing(null); setForm({ full_name: "", staff_id: "", gender: "", phone: "", email: "", qualification: "", status: "active", date_of_birth: "", address: "", user_id: "" }); setFormError(""); setDrawerOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ full_name: item.full_name || "", staff_id: item.staff_id || "", gender: item.gender || "", phone: item.phone || "", email: item.email || "", qualification: item.qualification || "", status: item.status || "active", date_of_birth: item.date_of_birth || "", address: item.address || "", user_id: item.user_id || "" }); setFormError(""); setDrawerOpen(true); };

  const handleSave = async () => {
    if (!form.full_name?.trim()) { setFormError("Full name is required."); return; }
    setSaving(true); setFormError("");
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        gender: form.gender || undefined,
        qualification: form.qualification?.trim() || undefined,
        date_of_birth: form.date_of_birth || undefined,
        address: form.address?.trim() || undefined,
        status: form.status || "active",
        school_id: schoolId,
      };
      if (editing) {
        if (form.staff_id?.trim()) payload.staff_id = form.staff_id.trim();
        await base44.entities.Teacher.update(editing.id, payload);
      } else {
        const created = await base44.entities.Teacher.create(payload);
        const pin = created?.generated_pin || created?.login_pin || created?.staff_id;
        if (pin) {
          setCreatedBanner({
            name: created?.full_name || payload.full_name,
            pin,
            defaultPassword: created?.default_password || "12345678",
          });
          setCopiedPin(false);
        }
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Teacher.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete teacher.");
    } finally {
      setDeleting(false);
    }
  };

  const openAssignments = async (teacher) => {
    setAssignTarget(teacher);
    setNewAssign({ class_id: "", subject_id: "" });
    setAssignError("");
    setAssignLoading(true);
    try {
      const data = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_id: teacher.id }, "-created_date", 200);
      setAssignments(data || []);
    } catch (_e) {
      setAssignments([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const addAssignment = async () => {
    if (!newAssign.class_id || !newAssign.subject_id) { setAssignError("Please select a class and subject."); return; }
    setAssignError("");
    try {
      const cls = classes.find((c) => c.id === newAssign.class_id);
      const subj = subjects.find((s) => s.id === newAssign.subject_id);
      // Avoid duplicates
      if (assignments.some((a) => a.class_id === newAssign.class_id && a.subject_id === newAssign.subject_id)) {
        setAssignError("This class+subject is already assigned.");
        return;
      }
      const created = await base44.entities.TeacherAssignment.create({
        school_id: schoolId, teacher_id: assignTarget.id, teacher_name: assignTarget.full_name,
        class_id: newAssign.class_id, class_name: cls?.name || "",
        subject_id: newAssign.subject_id, subject_name: subj?.name || ""
      });
      setAssignments([created, ...assignments]);
      setNewAssign({ class_id: "", subject_id: "" });
    } catch (err) {
      setAssignError(err?.message || "Unable to add assignment.");
    }
  };

  const removeAssignment = async (a) => {
    try {
      await base44.entities.TeacherAssignment.delete(a.id);
      setAssignments(assignments.filter((x) => x.id !== a.id));
    } catch (_e) {}
  };

  return (
    <div>
      <AdminPageHeader title="Teachers & Staff" subtitle="Manage teaching staff, assign classes and subjects." actionLabel="Add Teacher" onAction={openAdd} icon={Users} />

      {createdBanner && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Teacher <span className="underline">{createdBanner.name}</span> added &amp; PIN generated!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Staff ID / Login PIN: <strong className="font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded">{createdBanner.pin}</strong>
                {" · "}Default Password: <strong className="font-mono">{createdBanner.defaultPassword}</strong>
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
            <button type="button" onClick={() => setCreatedBanner(null)} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, staff ID, PIN, or phone…" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBulkImportOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white hover:bg-slate-50 text-foreground text-xs font-semibold"
              title="Bulk import teachers from CSV with auto-generated Staff IDs & PINs"
            >
              <Upload className="w-3.5 h-3.5 text-[hsl(var(--brand-indigo))]" /> Bulk Import CSV
            </button>
            <p className="text-xs text-muted-foreground">{filtered.length} teacher{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No teachers yet" description="Add teaching staff to assign classes and subjects." actionLabel="Add Teacher" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Staff ID / PIN</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{t.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.staff_id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.phone || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setOnboardTarget(t)} className="p-2 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600" aria-label="Onboard portal account" title="Onboard portal account"><UserPlus className="w-4 h-4" /></button>
                        <button onClick={() => openAssignments(t)} className="p-2 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600" aria-label="Manage assignments" title="Classes & Subjects"><ClipboardList className="w-4 h-4" /></button>
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

      {/* Add/Edit drawer */}
      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Teacher" : "Add Teacher"}
        description={editing ? "Update teacher details." : "Register a new teacher."}
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
            <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Mr. Adeyemi Johnson" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Staff ID / Login PIN</label>
              {editing ? (
                <input className={`${inputCls} font-mono bg-slate-50`} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} />
              ) : (
                <div className="h-10 px-3 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 text-xs text-indigo-700 flex items-center font-mono">
                  Auto-generated (SS-TEA-XXXXXX)
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0803 123 4567" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. teacher@school.edu" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Qualification</label>
              <input className={inputCls} value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. B.Sc Mathematics" />
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
          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      {/* Assignments drawer */}
      <FormDrawer
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Classes & Subjects — ${assignTarget?.full_name || ""}`}
        description="Assign classes and subjects to this teacher."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-border p-4 bg-slate-50/40">
            <p className="text-sm font-semibold text-foreground mb-3">Add assignment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class</label>
                <select className={inputCls} value={newAssign.class_id} onChange={(e) => setNewAssign({ ...newAssign, class_id: e.target.value })}>
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
                <select className={inputCls} value={newAssign.subject_id} onChange={(e) => setNewAssign({ ...newAssign, subject_id: e.target.value })}>
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addAssignment} className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-indigo))]/90 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add
            </button>
            {assignError && <p className="text-sm text-red-600 mt-2">{assignError}</p>}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Current assignments</p>
            {assignLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{a.class_name}</span>
                      <span className="text-muted-foreground"> — {a.subject_name}</span>
                    </div>
                    <button onClick={() => removeAssignment(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Remove"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FormDrawer>

      <OnboardExistingDialog
        open={!!onboardTarget}
        onClose={() => setOnboardTarget(null)}
        profile={onboardTarget}
        role="teacher"
        onDone={load}
      />

      <BulkCsvImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        mode="teachers"
        extraPayload={{ school_id: schoolId }}
        onSuccess={() => load()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete teacher?"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? Class and subject assignments will be removed.`}
      />
    </div>
  );
}