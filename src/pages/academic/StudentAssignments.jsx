import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmptyState from "@/components/admin/EmptyState";
import { ClipboardList, Loader2, Upload, Check, FileText, X } from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function StudentAssignments() {
  const { user, schoolId } = useCurrentUser();
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitFor, setSubmitFor] = useState(null);
  const [form, setForm] = useState({ content: "", file_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
      const me = (students || [])[0];
      setStudent(me);
      const published = await base44.entities.Assignment.filter({ school_id: schoolId, status: "published" }, "-created_date", 200);
      const mine = me ? (published || []).filter((a) => a.class_id === me.current_class_id) : [];
      setAssignments(mine);
      const subs = await base44.entities.AssignmentSubmission.filter({ student_user_id: user.id }, "-created_date", 200);
      setSubmissions(subs || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [user, schoolId]);

  useEffect(() => { load(); }, [load]);

  const subMap = {};
  submissions.forEach((s) => { subMap[s.assignment_id] = s; });

  const validateFile = (file) => {
    if (file.size > 10 * 1024 * 1024) return { valid: false, error: "File must be under 10MB" };
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "application/zip"];
    if (!allowed.includes(file.type)) return { valid: false, error: "Unsupported file type. Use PDF, Word, PowerPoint, images, or text." };
    return { valid: true };
  };

  const handleFile = async (file) => {
    if (!file) return;
    const check = validateFile(file);
    if (!check.valid) { setSubmitError(check.error); return; }
    setSubmitError("");
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, file_url: res.file_url }));
    } catch (_e) {
      setSubmitError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!submitFor) return;
    setSaving(true);
    try {
      const existing = subMap[submitFor.id];
      const payload = {
        school_id: schoolId,
        assignment_id: submitFor.id,
        assignment_title: submitFor.title,
        class_id: submitFor.class_id,
        subject_id: submitFor.subject_id,
        subject_name: submitFor.subject_name,
        student_id: student.id,
        student_name: student.full_name,
        student_user_id: user.id,
        teacher_user_id: submitFor.teacher_user_id || "",
        content: form.content,
        file_url: form.file_url,
        submitted_at: new Date().toISOString(),
        status: "submitted"
      };
      if (existing) {
        await base44.entities.AssignmentSubmission.update(existing.id, payload);
      } else {
        await base44.entities.AssignmentSubmission.create(payload);
      }
      setSubmitFor(null);
      setForm({ content: "", file_url: "" });
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">My Assignments</h1>

      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments" description="Your teacher hasn't published any assignments for your class yet." />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const sub = subMap[a.id];
            const isOverdue = a.due_date && new Date(a.due_date) < new Date(new Date().toDateString()) && !sub;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground">{a.subject_name}</p>
                    {a.due_date && <p className={`text-xs mt-1 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>Due: {a.due_date}{isOverdue ? " · Overdue" : ""}</p>}
                    {a.instructions && <p className="text-sm text-foreground mt-2">{a.instructions}</p>}
                    {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[hsl(var(--brand-indigo))] flex items-center gap-1 mt-2"><FileText className="w-3.5 h-3.5" /> View attachment</a>}
                  </div>
                  <div className="shrink-0">
                    {sub?.is_released ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 min-w-[140px]">
                        <p className="text-xs font-semibold text-emerald-700">Grade: {sub.grade}/{a.max_score}</p>
                        {sub.feedback && <p className="text-xs text-emerald-600 mt-1">{sub.feedback}</p>}
                      </div>
                    ) : sub ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
                        <Check className="w-4 h-4" /> Submitted
                      </span>
                    ) : (
                      <button onClick={() => { setSubmitFor(a); setForm({ content: "", file_url: "" }); }} className="h-9 px-4 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-sm font-semibold hover:opacity-90">Submit</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit drawer */}
      {submitFor && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSubmitFor(null)} />
          <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-heading font-bold text-base text-foreground">Submit Assignment</h2>
              <button onClick={() => setSubmitFor(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-sm text-muted-foreground">{submitFor.title}</p>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Written response</label>
                <textarea className="w-full p-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Type your answer…" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Attach file</label>
                <input type="file" onChange={(e) => handleFile(e.target.files[0])} className="text-sm" disabled={uploading} />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
                {submitError && <p className="text-xs text-red-600 mt-1">{submitError}</p>}
                {form.file_url && <p className="text-xs text-[hsl(var(--brand-indigo))] mt-1 truncate">Attached</p>}
              </div>
            </div>
            <div className="border-t border-border p-4 flex gap-3 shrink-0">
              <button onClick={() => setSubmitFor(null)} className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
              <button onClick={submit} disabled={saving} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Submit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}