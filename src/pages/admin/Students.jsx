import React, { useEffect, useState, useCallback } from "react";
import { GraduationCap, Pencil, Trash2, Loader2, History, Check, Plus, X, ShieldAlert, UserPlus, CreditCard, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { downloadOfficialStudentIdCardsPdf, downloadOfficialAdmissionLetterPdf } from "@/lib/documentEngine";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SearchInput from "@/components/admin/SearchInput";
import PaginationBar from "@/components/admin/PaginationBar";
import OnboardExistingDialog from "@/components/admin/OnboardExistingDialog";
import BulkCsvImportModal from "@/components/admin/BulkCsvImportModal";
import { Upload } from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";
const relTypes = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" }
];

export default function Students() {
  const { schoolId } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1, from: 0, to: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: "", admission_number: "", date_of_birth: "", gender: "", phone: "", email: "", address: "", current_class_id: "", current_session_id: "", admission_date: "", status: "active", user_id: "" });
  const [rels, setRels] = useState([]);
  const [newRel, setNewRel] = useState({ guardian_id: "", relationship_type: "guardian", is_primary: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [onboardTarget, setOnboardTarget] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      base44.entities.SchoolClass.filter({ school_id: schoolId, status: "active" }, "name", 200),
      base44.entities.AcademicSession.filter({ school_id: schoolId }, "-created_date", 100),
      base44.entities.ParentGuardian.filter({ school_id: schoolId, status: "active" }, "-created_date", 200)
    ]).then(([cData, sessData, pData]) => {
      setClasses(cData || []);
      setSessions(sessData || []);
      setParents(pData || []);
    }).catch(() => {});
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await base44.entities.Student.paginate(
        {
          school_id: schoolId,
          page,
          per_page: perPage,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          class_id: classFilter || undefined,
        },
        "-created_date"
      );
      setItems(res?.data || []);
      setMeta(res?.meta || { current_page: page, per_page: perPage, total: 0, last_page: 1, from: 0, to: 0 });
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, page, perPage, debouncedSearch, statusFilter, classFilter]);

  useEffect(() => { load(); }, [load]);

  const className = (id) => classes.find((c) => c.id === id)?.name || "—";
  const activeSessionId = sessions.find((s) => s.is_active)?.id || sessions[0]?.id || "";
  const guardianName = (id) => parents.find((p) => p.id === id)?.full_name || "Unknown";

  const filtered = items;

  const openAdd = () => {
    setEditing(null);
    setForm({ full_name: "", admission_number: "", date_of_birth: "", gender: "", phone: "", email: "", address: "", current_class_id: "", current_session_id: activeSessionId, admission_date: new Date().toISOString().slice(0, 10), status: "active", user_id: "" });
    setRels([]);
    setNewRel({ guardian_id: "", relationship_type: "guardian", is_primary: false });
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    setForm({ full_name: item.full_name || "", admission_number: item.admission_number || "", date_of_birth: item.date_of_birth || "", gender: item.gender || "", phone: item.phone || "", email: item.email || "", address: item.address || "", current_class_id: item.current_class_id || "", current_session_id: item.current_session_id || activeSessionId, admission_date: item.admission_date || "", status: item.status || "active", user_id: item.user_id || "" });
    setRels([]);
    setNewRel({ guardian_id: "", relationship_type: "guardian", is_primary: false });
    setFormError("");
    setDrawerOpen(true);
    try {
      const r = await base44.entities.GuardianRelationship.filter({ school_id: schoolId, student_id: item.id }, "-created_date", 100);
      setRels((r || []).map((x) => ({ _id: x.id, guardian_id: x.guardian_id, relationship_type: x.relationship_type, is_primary: x.is_primary })));
    } catch (_e) { setRels([]); }
  };

  const addRel = () => {
    if (!newRel.guardian_id) { setFormError("Select a parent/guardian to link."); return; }
    if (rels.some((r) => !r._removed && r.guardian_id === newRel.guardian_id)) { setFormError("This guardian is already linked to the student."); return; }
    const turningPrimary = newRel.is_primary;
    setRels((prev) => [...prev, { guardian_id: newRel.guardian_id, relationship_type: newRel.relationship_type, is_primary: turningPrimary }].concat(turningPrimary ? prev.map((r) => ({ ...r, is_primary: false })) : prev));
    setNewRel({ guardian_id: "", relationship_type: "guardian", is_primary: false });
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
    if (!form.full_name?.trim()) { setFormError("Full name is required."); return; }
    if (!form.admission_number?.trim()) { setFormError("Admission number is required."); return; }
    setSaving(true); setFormError("");
    try {
      const existing = await base44.entities.Student.filter({ school_id: schoolId, admission_number: form.admission_number.trim() }, "-created_date", 50);
      if (existing && existing.some((s) => s.id !== editing?.id)) {
        setFormError("A student with this Admission Number already exists at your school.");
        setSaving(false);
        return;
      }
      const cls = classes.find((c) => c.id === form.current_class_id);
      const sess = sessions.find((s) => s.id === form.current_session_id);
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        admission_number: form.admission_number.trim(),
        school_id: schoolId,
        current_class_name: cls?.name || "",
        current_session_id: form.current_session_id || activeSessionId
      };
      let saved;
      if (editing) {
        saved = await base44.entities.Student.update(editing.id, payload);
      } else {
        saved = await base44.entities.Student.create(payload);
      }
      const studentId = editing?.id || saved?.id;
      // Record / update historical class assignment
      if (studentId && form.current_class_id && payload.current_session_id) {
        try {
          const existingAssign = await base44.entities.ClassAssignment.filter({ school_id: schoolId, student_id: studentId, session_id: payload.current_session_id }, "-created_date", 10);
          if (!existingAssign || existingAssign.length === 0) {
            await base44.entities.ClassAssignment.create({
              school_id: schoolId, student_id: studentId, student_name: payload.full_name,
              class_id: form.current_class_id, class_name: cls?.name || "",
              session_id: payload.current_session_id, session_name: sess?.name || ""
            });
          } else if (existingAssign[0].class_id !== form.current_class_id) {
            await base44.entities.ClassAssignment.update(existingAssign[0].id, { class_id: form.current_class_id, class_name: cls?.name || "" });
          }
        } catch (_e) { /* non-fatal */ }
      }
      // Sync guardian relationships
      if (studentId) {
        const removed = rels.filter((r) => r._id && r._removed);
        for (const r of removed) { try { await base44.entities.GuardianRelationship.delete(r._id); } catch (_e) {} }
        const toCreate = rels.filter((r) => !r._id && !r._removed).map((r) => ({
          school_id: schoolId, student_id: studentId, student_name: payload.full_name,
          guardian_id: r.guardian_id, guardian_name: guardianName(r.guardian_id),
          relationship_type: r.relationship_type, is_primary: r.is_primary
        }));
        if (toCreate.length) await base44.entities.GuardianRelationship.bulkCreate(toCreate);
        const kept = rels.filter((r) => r._id && !r._removed);
        for (const r of kept) {
          try { await base44.entities.GuardianRelationship.update(r._id, { relationship_type: r.relationship_type, is_primary: r.is_primary, guardian_name: guardianName(r.guardian_id), student_name: payload.full_name }); } catch (_e) {}
        }
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save student.");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = async (student) => {
    try {
      const assignments = await base44.entities.ClassAssignment.filter({ school_id: schoolId, student_id: student.id }, "-created_date", 500);
      if (assignments && assignments.length > 0) {
        setDeleteBlocked({ student, count: assignments.length });
        return;
      }
    } catch (_e) {}
    setDeleteTarget(student);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Student.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete student.");
    } finally {
      setDeleting(false);
    }
  };

  const openHistory = async (student) => {
    setHistoryTarget(student);
    setHistoryLoading(true);
    try {
      const data = await base44.entities.ClassAssignment.filter({ school_id: schoolId, student_id: student.id }, "-created_date", 50);
      setHistory(data || []);
    } catch (_e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const visibleRels = rels.filter((r) => !r._removed);

  return (
    <div>
      <AdminPageHeader title="Students" subtitle="Manage student records, class assignments, guardians and academic history." actionLabel="Add Student" onAction={openAdd} icon={GraduationCap} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, admission no, or PIN…" />
            <select className="h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setBulkImportOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white hover:bg-slate-50 text-foreground text-xs font-semibold"
              title="Bulk import students from CSV with auto-generated Login PINs"
            >
              <Upload className="w-3.5 h-3.5 text-[hsl(var(--brand-indigo))]" /> Bulk Import CSV
            </button>
            <button
              onClick={() => downloadOfficialStudentIdCardsPdf({ schoolId, classId: classFilter, studentIds: filtered.map((s) => s.id) })}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[hsl(var(--brand-indigo))]/10 hover:bg-[hsl(var(--brand-indigo))]/20 text-[hsl(var(--brand-indigo))] text-xs font-semibold disabled:opacity-50"
              title="Download printable A4 sheet of Student ID cards (Front & Back with QR)"
            >
              <CreditCard className="w-3.5 h-3.5" /> Bulk Print ID Cards ({filtered.length})
            </button>
            <p className="text-xs text-muted-foreground">{meta.total} student{meta.total !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description="Adjust filters or add your first student to start managing academics." actionLabel="Add Student" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Admission No.</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.admission_number}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.current_class_name || className(s.current_class_id)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => downloadOfficialStudentIdCardsPdf({ schoolId, studentId: s.id })} className="p-2 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600" aria-label="Download Student ID Card PDF" title="Download Student ID Card PDF"><CreditCard className="w-4 h-4" /></button>
                        <button onClick={() => downloadOfficialAdmissionLetterPdf(s.id, s.admission_number || s.full_name)} className="p-2 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600" aria-label="Download Admission Letter PDF" title="Download Admission Letter PDF"><Download className="w-4 h-4" /></button>
                        <button onClick={() => setOnboardTarget(s)} className="p-2 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600" aria-label="Onboard portal account" title="Onboard portal account"><UserPlus className="w-4 h-4" /></button>
                        <button onClick={() => openHistory(s)} className="p-2 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600" aria-label="Academic history" title="Academic history"><History className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => requestDelete(s)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
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

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Student" : "Add Student"}
        description={editing ? "Update student details, class assignment and guardians." : "Register a new student."}
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
            <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Admission Number *</label>
              <input className={inputCls} value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} placeholder="e.g. ADM/2026/001" />
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
              <label className={labelCls}>Date of Birth</label>
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Admission Date</label>
              <input type="date" className={inputCls} value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Student phone (optional)" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Student email (optional)" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Residential address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Current Class</label>
              <select className={inputCls} value={form.current_class_id} onChange={(e) => setForm({ ...form, current_class_id: e.target.value })}>
                <option value="">Unassigned</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Academic Session</label>
              <select className={inputCls} value={form.current_session_id} onChange={(e) => setForm({ ...form, current_session_id: e.target.value })}>
                <option value="">Select session…</option>
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (active)" : ""}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">Use Graduated/Transferred to retain records without deleting academic history.</p>
          </div>

          {/* Portal account is created via the Onboard button in the table — no manual user ID entry */}

          {/* Guardians — managed via GuardianRelationship */}
          <div>
            <label className={labelCls}>Parents / Guardians</label>
            <p className="text-xs text-muted-foreground mb-2">Link one or more guardians. Mark the primary contact for the Parent Portal.</p>
            {visibleRels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No guardians linked yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {visibleRels.map((r, idx) => {
                  const realIdx = rels.indexOf(r);
                  return (
                    <div key={realIdx} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{guardianName(r.guardian_id)}</p>
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
            {parents.length > 0 && (
              <div className="rounded-xl border border-dashed border-border p-3 bg-slate-50/40">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Add guardian</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputCls} value={newRel.guardian_id} onChange={(e) => setNewRel({ ...newRel, guardian_id: e.target.value })}>
                    <option value="">Select guardian…</option>
                    {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
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
            {parents.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">No active parents available. Add parents first.</p>}
          </div>

          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      {/* Academic history drawer */}
      <FormDrawer
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        title={`Academic History — ${historyTarget?.full_name || ""}`}
        description="Class assignments per session (historical record)."
      >
        {historyLoading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No class assignments recorded yet. Assign a class and session to this student to build their history.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{h.class_name}</p>
                  <p className="text-xs text-muted-foreground">{h.session_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormDrawer>

      <OnboardExistingDialog
        open={!!onboardTarget}
        onClose={() => setOnboardTarget(null)}
        profile={onboardTarget}
        role="student"
        onDone={load}
      />

      {/* Delete blocked — has academic history */}
      <ConfirmDialog
        open={!!deleteBlocked}
        onClose={() => setDeleteBlocked(null)}
        onConfirm={() => { setDeleteBlocked(null); if (deleteBlocked?.student) { setEditing(deleteBlocked.student); setForm({ full_name: deleteBlocked.student.full_name || "", admission_number: deleteBlocked.student.admission_number || "", date_of_birth: deleteBlocked.student.date_of_birth || "", gender: deleteBlocked.student.gender || "", phone: deleteBlocked.student.phone || "", email: deleteBlocked.student.email || "", address: deleteBlocked.student.address || "", current_class_id: deleteBlocked.student.current_class_id || "", current_session_id: deleteBlocked.student.current_session_id || activeSessionId, admission_date: deleteBlocked.student.admission_date || "", status: "inactive", user_id: deleteBlocked.student.user_id || "" }); setDrawerOpen(true); } }}
        confirmLabel="Deactivate instead"
        title="Cannot delete — academic history exists"
        message={`"${deleteBlocked?.student?.full_name}" has ${deleteBlocked?.count} class assignment record(s). Permanent deletion would break academic history. Deactivate (or mark Graduated/Transferred) to retain the record.`}
        icon={ShieldAlert}
      />

      <BulkCsvImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        mode="students"
        extraPayload={{ school_id: schoolId, academic_session_id: activeSessionId }}
        onSuccess={() => load()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete student?"
        message={`"${deleteTarget?.full_name}" has no academic history. Confirm permanent deletion. This cannot be undone.`}
      />
    </div>
  );
}