import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { NotebookPen, Loader2, Save, Check } from "lucide-react";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";
const textareaCls = "w-full p-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function Remarks() {
  const { user, schoolId, role } = useCurrentUser();
  const { sessions, terms, classes, loading: ctxLoading } = useAcademicContext(schoolId);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sessionTerms = useMemo(() => terms.filter((t) => String(t.session_id) === String(sessionId)), [terms, sessionId]);
  const isAdmin = role === "school_admin" || role === "super_admin";

  const load = useCallback(async () => {
    if (!classId || !sessionId || !termId) return;
    setLoading(true);
    setSaved(false);
    try {
      const [students, existing] = await Promise.all([
        base44.entities.ClassAssignment.filter({ school_id: schoolId, class_id: classId, session_id: sessionId }, "-created_date", 200),
        base44.entities.TermRemark.filter({ school_id: schoolId, class_id: classId, session_id: sessionId, term_id: termId }, "-created_date", 200)
      ]);
      const remMap = {};
      (existing || []).forEach((r) => { remMap[r.student_id] = r; });
      const built = (students || []).map((s) => ({
        student_id: s.student_id,
        student_name: s.student_name,
        remark_id: remMap[s.student_id]?.id || null,
        class_teacher_remark: remMap[s.student_id]?.class_teacher_remark || "",
        principal_remark: remMap[s.student_id]?.principal_remark || "",
        class_teacher_id: remMap[s.student_id]?.class_teacher_id || "",
        status: remMap[s.student_id]?.status || "new"
      }));
      setRows(built);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId, termId, schoolId]);

  useEffect(() => { if (classId && sessionId && termId) load(); else setRows([]); }, [classId, sessionId, termId, load]);

  const update = (studentId, field, value) => {
    setRows((prev) => prev.map((r) => r.student_id === studentId ? { ...r, [field]: value } : r));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const className = classes.find((c) => c.id === classId)?.name || "";
      const ops = rows.map((r) => {
        const payload = {
          school_id: schoolId,
          session_id: sessionId,
          term_id: termId,
          class_id: classId,
          student_id: r.student_id,
          student_name: r.student_name,
          class_teacher_remark: r.class_teacher_remark,
          class_teacher_id: r.class_teacher_id || user.id,
          principal_remark: isAdmin ? r.principal_remark : r.principal_remark,
          principal_id: isAdmin && r.principal_remark ? user.id : "",
          status: r.status === "new" ? "draft" : r.status
        };
        if (r.remark_id) {
          return base44.entities.TermRemark.update(r.remark_id, payload);
        }
        return base44.entities.TermRemark.create(payload);
      });
      await Promise.all(ops);
      await load();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await Promise.all(rows.filter((r) => r.remark_id).map((r) => base44.entities.TermRemark.update(r.remark_id, { status: "published" })));
      await load();
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  if (ctxLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader title="Term Remarks" subtitle="Add class teacher and principal remarks for report cards." icon={NotebookPen} />

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Session</label>
            <select className={selectCls} value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
              <option value="">Select…</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Term</label>
            <select className={selectCls} value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
              <option value="">Select…</option>
              {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Class</label>
            <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {classId && sessionId && termId && (
        loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No students" description="There are no students assigned to this class for the selected session." />
        ) : (
          <>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.student_id} className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <h3 className="font-heading font-bold text-foreground mb-3">{r.student_name}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Class Teacher's Remark</label>
                      <textarea className={textareaCls} rows={2} value={r.class_teacher_remark} onChange={(e) => update(r.student_id, "class_teacher_remark", e.target.value)} placeholder="e.g. A diligent and respectful student…" />
                    </div>
                    {isAdmin && (
                      <div>
                        <label className={labelCls}>Principal's Remark</label>
                        <textarea className={textareaCls} rows={2} value={r.principal_remark} onChange={(e) => update(r.student_id, "principal_remark", e.target.value)} placeholder="e.g. Keep up the excellent work…" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button onClick={save} disabled={saving} className="h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Remarks
              </button>
              {isAdmin && (
                <button onClick={publish} disabled={saving} className="h-10 px-5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50">
                  Publish to Report Cards
                </button>
              )}
              {saved && <span className="text-sm font-semibold text-[hsl(var(--brand-green))] flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
            </div>
          </>
        )
      )}
    </div>
  );
}