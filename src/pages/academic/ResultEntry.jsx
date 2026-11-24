import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ResultStatusBadge from "@/components/academic/ResultStatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { calculateResult, validateComponentScore } from "@/lib/grading";
import { Loader2, Save, Send, AlertTriangle, FileBarChart, Upload } from "lucide-react";
import BulkCsvImportModal from "@/components/admin/BulkCsvImportModal";
import { Link } from "react-router-dom";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";
const scoreInputCls = "w-16 h-9 px-2 text-center rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function ResultEntry() {
  const { user, schoolId, role } = useCurrentUser();
  const { sessions, terms, classes, subjects, activeScheme, loading: ctxLoading } = useAcademicContext(schoolId);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [myPairs, setMyPairs] = useState(null); // null = admin (all), [] = teacher with none, [...]=allowed pairs

  // Load this teacher's class+subject assignments to restrict dropdowns
  useEffect(() => {
    if (role !== "teacher" || !user?.id || !schoolId) { setMyPairs(null); return; }
    (async () => {
      try {
        const teachers = await base44.entities.Teacher.filter({ user_id: user.id }, "-created_date", 5);
        const myTeacherId = (teachers || [])[0]?.id;
        if (!myTeacherId) { setMyPairs([]); return; }
        const assigns = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_id: myTeacherId }, "-created_date", 200);
        setMyPairs((assigns || []).map((a) => `${a.class_id}|${a.subject_id}`));
      } catch (_e) {
        setMyPairs([]);
      }
    })();
  }, [role, user, schoolId]);

  const sessionTerms = useMemo(() => terms.filter((t) => String(t.session_id) === String(sessionId)), [terms, sessionId]);

  const contextComplete = sessionId && termId && classId && subjectId;

  // For teachers: restrict to assigned classes and subjects
  const availableClasses = myPairs === null ? classes : classes.filter((c) => myPairs.some((p) => p.startsWith(c.id + "|")));
  const availableSubjects = myPairs === null
    ? subjects
    : classId
      ? subjects.filter((s) => myPairs.includes(`${classId}|${s.id}`))
      : subjects.filter((s) => myPairs.some((p) => p.endsWith("|" + s.id)));

  // Load teacher assignments for this class+subject (to auto-fill teacher on result)
  const resolvedTeacher = useMemo(() => teacherAssignments[0] || null, [teacherAssignments]);

  const loadData = useCallback(async () => {
    if (!contextComplete) return;
    setLoadingData(true);
    setError("");
    try {
      const [assignments, students, existing] = await Promise.all([
        base44.entities.TeacherAssignment.filter({ school_id: schoolId, class_id: classId, subject_id: subjectId }, "-created_date", 10),
        base44.entities.ClassAssignment.filter({ school_id: schoolId, class_id: classId, session_id: sessionId }, "-created_date", 200),
        base44.entities.Result.filter({ school_id: schoolId, session_id: sessionId, term_id: termId, class_id: classId, subject_id: subjectId }, "-created_date", 200)
      ]);
      setTeacherAssignments(assignments || []);

      const existingMap = {};
      (existing || []).forEach((r) => { existingMap[r.student_id] = r; });

      const built = (students || []).map((s) => {
        const ex = existingMap[s.student_id];
        return {
          student_id: s.student_id,
          student_name: s.student_name,
          result_id: ex?.id || null,
          components: ex?.components || {},
          total: ex?.total_score || 0,
          grade: ex?.grade || "",
          status: ex?.status || "new"
        };
      });
      setRows(built);
    } catch (_e) {
      setError("Unable to load students for this class.");
    } finally {
      setLoadingData(false);
    }
  }, [contextComplete, schoolId, classId, subjectId, sessionId, termId]);

  useEffect(() => {
    if (contextComplete) loadData();
    else setRows([]);
  }, [contextComplete, loadData]);

  const updateScore = (studentId, componentKey, value) => {
    setRows((prev) => prev.map((r) => {
      if (r.student_id !== studentId) return r;
      const components = { ...r.components, [componentKey]: value };
      const calc = activeScheme ? calculateResult(components, activeScheme) : { total: 0, grade: "" };
      return { ...r, components, total: calc.total, grade: calc.grade };
    }));
  };

  const hasAnyScore = (row) => activeScheme?.components?.some((c) => row.components[c.key] !== "" && row.components[c.key] !== undefined && row.components[c.key] !== null);

  const saveDrafts = async () => {
    setSaving(true);
    setError("");
    try {
      const toSave = rows.filter(hasAnyScore);
      const updates = [];
      const creates = [];
      const teacherInfo = resolvedTeacher || {};
      for (const row of toSave) {
        const calc = calculateResult(row.components, activeScheme);
        const payload = {
          school_id: schoolId,
          session_id: sessionId,
          session_name: sessions.find((s) => String(s.id) === String(sessionId))?.name || "",
          term_id: termId,
          term_name: terms.find((t) => String(t.id) === String(termId))?.name || "",
          class_id: classId,
          class_name: classes.find((c) => c.id === classId)?.name || "",
          student_id: row.student_id,
          student_name: row.student_name,
          subject_id: subjectId,
          subject_name: subjects.find((s) => s.id === subjectId)?.name || "",
          teacher_id: teacherInfo.teacher_id || "",
          teacher_name: teacherInfo.teacher_name || "",
          teacher_user_id: teacherInfo.teacher_user_id || "",
          grading_scheme_id: activeScheme?.id || "",
          components: row.components,
          total_score: calc.total,
          max_total: calc.maxTotal,
          percentage: calc.percentage,
          grade: calc.grade,
          grade_point: calc.grade_point,
          remark: row.remark || calc.remark || "",
          status: row.status === "new" ? "draft" : row.status
        };
        if (row.result_id) {
          updates.push(base44.entities.Result.update(row.result_id, payload));
        } else {
          creates.push(base44.entities.Result.create(payload));
        }
      }
      await Promise.all([...updates, ...creates]);
      await loadData();
    } catch (_e) {
      setError("Failed to save drafts.");
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    setError("");
    // Validate: all students must have all component scores filled and in range
    const components = activeScheme?.components || [];
    for (const row of rows) {
      for (const c of components) {
        const val = row.components[c.key];
        if (val === "" || val === undefined || val === null) {
          setError(`Please enter all scores before submitting. ${row.student_name} is missing ${c.label}.`);
          return;
        }
        const v = validateComponentScore(val, c.max_score);
        if (!v.valid) {
          setError(`${row.student_name}: ${c.label} — ${v.error}`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      // Ensure drafts are saved first, then update status to submitted
      await saveDrafts();
      const submittedAt = new Date().toISOString();
      await Promise.all(rows.map((r) => r.result_id ? base44.entities.Result.update(r.result_id, { status: "submitted", submitted_at: submittedAt }) : null).filter(Boolean));
      await loadData();
    } catch (_e) {
      setError("Failed to submit results.");
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = (status) => !status || status === "new" || status === "draft" || status === "rejected";

  if (ctxLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader title="Enter Results" subtitle="Select a class and subject, then enter scores for each student." icon={FileBarChart} />

      {!activeScheme && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No active grading scheme</p>
            <p className="text-sm text-amber-700">Scores cannot be calculated without a grading scheme. <Link to="/app/grading" className="font-semibold underline">Configure one here</Link>.</p>
          </div>
        </div>
      )}

      {myPairs !== null && myPairs.length === 0 && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No class assignments</p>
            <p className="text-sm text-amber-700">You haven't been assigned to any classes or subjects yet. Please contact your school administrator.</p>
          </div>
        </div>
      )}

      {/* Context selectors */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Session</label>
            <select className={selectCls} value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
              <option value="">Select session…</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Term</label>
            <select className={selectCls} value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
              <option value="">Select term…</option>
              {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Class</label>
            <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)} disabled={myPairs !== null && availableClasses.length === 0}>
              <option value="">Select class…</option>
              {availableClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <select className={selectCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId || (myPairs !== null && availableSubjects.length === 0)}>
              <option value="">Select subject…</option>
              {availableSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {contextComplete && (
        <>
          {loadingData ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No students in this class" description="There are no students assigned to this class for the selected session." />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                        <th className="px-4 py-3 font-semibold">Student</th>
                        {activeScheme?.components?.map((c) => (
                          <th key={c.key} className="px-4 py-3 font-semibold text-center">{c.label}<span className="block text-[10px] font-normal text-muted-foreground/70">max {c.max_score}</span></th>
                        ))}
                        <th className="px-4 py-3 font-semibold text-center">Total</th>
                        <th className="px-4 py-3 font-semibold text-center">Grade</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const editable = canEdit(row.status);
                        return (
                          <tr key={row.student_id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                            <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.student_name}</td>
                            {activeScheme?.components?.map((c) => (
                              <td key={c.key} className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  className={scoreInputCls}
                                  value={row.components[c.key] ?? ""}
                                  onChange={(e) => updateScore(row.student_id, c.key, e.target.value)}
                                  disabled={!editable}
                                  max={c.max_score}
                                  min={0}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center font-bold text-foreground">{row.total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] font-bold text-xs">{row.grade || "—"}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.status !== "new" && <ResultStatusBadge status={row.status} />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button type="button" onClick={() => setBulkImportOpen(true)} className="h-10 px-5 rounded-xl border border-border bg-white text-sm font-semibold text-[hsl(var(--brand-indigo))] hover:bg-secondary flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Import Scores CSV
                </button>
                <button onClick={saveDrafts} disabled={saving || submitting} className="h-10 px-5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Drafts
                </button>
                <button onClick={submitForReview} disabled={saving || submitting || !activeScheme} className="h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit for Review
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Drafts are private. Once submitted, results are locked for editing until reviewed by an administrator.</p>
            </>
          )}
        </>
      )}
      <BulkCsvImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        mode="scores"
        extraPayload={{
          school_id: schoolId,
          academic_session_id: sessionId,
          term_id: termId,
          class_id: classId,
          subject_id: subjectId,
        }}
        onSuccess={() => loadData()}
      />
    </div>
  );
}