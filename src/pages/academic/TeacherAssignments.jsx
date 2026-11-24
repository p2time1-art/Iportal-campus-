import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { ClipboardList, Plus, Loader2, X, Check, FileText, Users } from "lucide-react";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function TeacherAssignments() {
  const { user, schoolId, role } = useCurrentUser();
  const { classes, subjects, sessions, loading: ctxLoading } = useAcademicContext(schoolId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submissionsView, setSubmissionsView] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingId, setGradingId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: "", feedback: "" });
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const data = await base44.entities.Assignment.filter({ school_id: schoolId }, "-created_date", 200);
      // Teachers see only their own assignments; admins see all
      const mine = role === "teacher" ? (data || []).filter((a) => a.teacher_user_id === user.id) : data;
      setAssignments(mine || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [schoolId, role, user]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({
      class_id: "", subject_id: "", title: "", instructions: "",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: "", file_url: "", status: "draft", max_score: 100
    });
    setDrawerOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      class_id: a.class_id, subject_id: a.subject_id, title: a.title,
      instructions: a.instructions || "", issue_date: a.issue_date || "",
      due_date: a.due_date || "", file_url: a.file_url || "", status: a.status, max_score: a.max_score || 100
    });
    setDrawerOpen(true);
  };

  const validateFile = (file) => {
    if (file.size > 10 * 1024 * 1024) return { valid: false, error: "File must be under 10MB" };
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "application/zip"];
    if (!allowed.includes(file.type)) return { valid: false, error: "Unsupported file type. Use PDF, Word, PowerPoint, images, or text." };
    return { valid: true };
  };

  const handleFile = async (file) => {
    if (!file) return;
    const check = validateFile(file);
    if (!check.valid) { setFormError(check.error); return; }
    setFormError("");
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, file_url: res.file_url }));
    } catch (_e) {
      setFormError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.class_id || !form.subject_id) return;
    setSaving(true);
    try {
      const className = classes.find((c) => c.id === form.class_id)?.name || "";
      const subjectName = subjects.find((s) => s.id === form.subject_id)?.name || "";
      const session = sessions.find((s) => s.is_active) || sessions[0];
      const payload = {
        school_id: schoolId,
        session_id: session?.id || "",
        term_id: "",
        class_id: form.class_id,
        class_name: className,
        subject_id: form.subject_id,
        subject_name: subjectName,
        teacher_id: "", teacher_name: user.full_name || user.email || "",
        teacher_user_id: role === "teacher" ? user.id : "",
        title: form.title.trim(),
        instructions: form.instructions,
        issue_date: form.issue_date,
        due_date: form.due_date,
        file_url: form.file_url,
        max_score: Number(form.max_score) || 100,
        status: form.status
      };
      if (editing) {
        await base44.entities.Assignment.update(editing.id, payload);
      } else {
        await base44.entities.Assignment.create(payload);
      }
      setDrawerOpen(false);
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const viewSubmissions = async (a) => {
    setSubmissionsView(a);
    setLoadingSubs(true);
    try {
      const data = await base44.entities.AssignmentSubmission.filter({ school_id: schoolId, assignment_id: a.id }, "-created_date", 200);
      setSubmissions(data || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoadingSubs(false);
    }
  };

  const startGrade = (s) => {
    setGradingId(s.id);
    setGradeForm({ grade: s.grade || "", feedback: s.feedback || "" });
  };

  const saveGrade = async (submission) => {
    setSaving(true);
    try {
      await base44.entities.AssignmentSubmission.update(submission.id, {
        grade: Number(gradeForm.grade) || 0,
        grade_label: "",
        feedback: gradeForm.feedback,
        is_released: true,
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by_id: user.id
      });
      setGradingId(null);
      viewSubmissions(submissionsView);
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  if (ctxLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader title="Assignments" subtitle="Create assignments, view submissions, and provide feedback." actionLabel="New Assignment" onAction={openNew} icon={Plus} />

      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Create your first assignment to share with your class." actionLabel="Create Assignment" onAction={openNew} />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-foreground">{a.title}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${a.status === "published" ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] border-[hsl(var(--brand-green))]/20" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.class_name} · {a.subject_name}</p>
                  {a.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {a.due_date}</p>}
                  {a.instructions && <p className="text-sm text-foreground mt-2 line-clamp-2">{a.instructions}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => viewSubmissions(a)} className="h-9 px-3 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Submissions
                  </button>
                  <button onClick={() => openEdit(a)} className="h-9 px-3 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit drawer */}
      {drawerOpen && form && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-heading font-bold text-base text-foreground">{editing ? "Edit Assignment" : "New Assignment"}</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Class</label>
                  <select className={selectCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                    <option value="">Select…</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Subject</label>
                  <select className={selectCls} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                    <option value="">Select…</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Instructions</label>
                <textarea className="w-full p-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Instructions for students…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Issue Date</label>
                  <input type="date" className={inputCls} value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" className={inputCls} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Max Score</label>
                  <input type="number" className={inputCls} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Attachment</label>
                <input type="file" onChange={(e) => handleFile(e.target.files[0])} className="text-sm" disabled={uploading} />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
                {formError && <p className="text-xs text-red-600 mt-1">{formError}</p>}
                {form.file_url && <p className="text-xs text-[hsl(var(--brand-indigo))] mt-1 truncate">Attached: {form.file_url}</p>}
              </div>
            </div>
            <div className="border-t border-border p-4 flex gap-3 shrink-0">
              <button onClick={() => setDrawerOpen(false)} className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Submissions drawer */}
      {submissionsView && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSubmissionsView(null)} />
          <div className="fixed right-0 inset-y-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <div>
                <h2 className="font-heading font-bold text-base text-foreground">Submissions</h2>
                <p className="text-xs text-muted-foreground">{submissionsView.title}</p>
              </div>
              <button onClick={() => setSubmissionsView(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingSubs ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : submissions.length === 0 ? (
                <EmptyState icon={FileText} title="No submissions yet" description="Students' submissions will appear here." />
              ) : (
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{s.student_name}</p>
                          <p className="text-xs text-muted-foreground">Submitted: {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${s.status === "graded" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {s.status}
                        </span>
                      </div>
                      {s.content && <p className="text-sm text-muted-foreground mb-2">{s.content}</p>}
                      {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1 mb-2"><FileText className="w-3.5 h-3.5" /> View submission</a>}
                      {s.is_released && (
                        <div className="mt-2 p-3 rounded-lg bg-secondary/50">
                          <p className="text-sm"><span className="font-semibold">Grade:</span> {s.grade}/{submissionsView.max_score}</p>
                          {s.feedback && <p className="text-sm text-muted-foreground mt-1">{s.feedback}</p>}
                        </div>
                      )}
                      {gradingId === s.id ? (
                        <div className="mt-3 space-y-2">
                          <input type="number" placeholder="Grade" className={inputCls} value={gradeForm.grade} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })} max={submissionsView.max_score} />
                          <textarea placeholder="Feedback" className="w-full p-2 rounded-lg border border-border text-sm" rows={2} value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
                          <div className="flex gap-2">
                            <button onClick={() => setGradingId(null)} className="flex-1 h-9 rounded-lg border border-border text-sm font-semibold">Cancel</button>
                            <button onClick={() => saveGrade(s)} disabled={saving} className="flex-1 h-9 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold disabled:opacity-50">Save & Release</button>
                          </div>
                        </div>
                      ) : (
                        !s.is_released && <button onClick={() => startGrade(s)} className="mt-2 h-9 px-4 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-sm font-semibold hover:opacity-90">Grade</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}