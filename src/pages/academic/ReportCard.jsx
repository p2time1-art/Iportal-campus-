import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import { Award, Loader2, Download, FileText, Printer } from "lucide-react";
import { computeOverall } from "@/lib/grading";
import { generateReportCardPdf } from "@/lib/reportCardPdf";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function ReportCard() {
  const { user, school, schoolId, role } = useCurrentUser();
  const { sessions, terms, classes, gradingSchemes, activeScheme, loading: ctxLoading } = useAcademicContext(schoolId);

  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [remark, setRemark] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentRecord, setStudentRecord] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [templateStyle, setTemplateStyle] = useState("classic");

  const sessionTerms = useMemo(() => terms.filter((t) => String(t.session_id) === String(sessionId)), [terms, sessionId]);

  // For admin: load students when class selected; for student: auto-resolve
  useEffect(() => {
    if (role === "student" && user?.id) {
      (async () => {
        const mine = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
        if (mine[0]) { setStudentId(mine[0].id); setStudentRecord(mine[0]); }
      })();
    }
  }, [role, user]);

  useEffect(() => {
    if (role === "school_admin" || role === "super_admin" || role === "exam_officer") {
      (async () => {
        const data = await base44.entities.Student.filter({ school_id: schoolId, status: "active" }, "full_name", 500);
        setStudents(data || []);
      })();
    }
  }, [role, schoolId]);

  const loadReport = useCallback(async () => {
    if (!studentId || !sessionId || !termId) return;
    setLoading(true);
    try {
      const [res, att, rem, stu] = await Promise.all([
        base44.entities.Result.filter({ school_id: schoolId, student_id: studentId, session_id: sessionId, term_id: termId, status: "published" }, "-created_date", 100),
        base44.entities.Attendance.filter({ school_id: schoolId, student_id: studentId, session_id: sessionId, term_id: termId }, "-date", 300),
        base44.entities.TermRemark.filter({ school_id: schoolId, student_id: studentId, session_id: sessionId, term_id: termId }, "-created_date", 5),
        studentRecord ? Promise.resolve(studentRecord) : base44.entities.Student.get(studentId).catch(() => null)
      ]);
      setResults(res || []);
      setAttendance(att || []);
      setRemark((rem || [])[0] || null);
      setStudentRecord(stu);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [studentId, sessionId, termId, schoolId, studentRecord]);

  useEffect(() => { if (studentId && sessionId && termId) loadReport(); }, [studentId, sessionId, termId, loadReport]);

  // Historical protection: use the grading scheme that was active when results were published,
  // not the current active scheme, so changing the scheme doesn't recalculate old results.
  const historicalScheme = useMemo(() => {
    if (results.length === 0) return activeScheme;
    const firstSchemeId = results[0]?.grading_scheme_id;
    return gradingSchemes.find((g) => g.id === firstSchemeId) || activeScheme;
  }, [results, gradingSchemes, activeScheme]);

  const overall = useMemo(() => computeOverall(results, historicalScheme), [results, historicalScheme]);
  const present = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const showPosition = Boolean(remark?.class_position);

  const downloadPdf = async (isTranscript = false) => {
    setGeneratingPdf(true);
    try {
      await generateReportCardPdf({
        school,
        student: studentRecord,
        sessionId,
        termId,
        sessionName: sessions.find((s) => s.id === sessionId)?.name || "",
        termName: terms.find((t) => t.id === termId)?.name || "",
        results,
        overall,
        remark,
        attendance,
        scheme: historicalScheme,
        template: templateStyle,
        transcript: isTranscript,
      });
    } catch (_e) {
      // non-fatal
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (ctxLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="no-print font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">Report Card</h1>

      <div className="no-print bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(role === "school_admin" || role === "super_admin" || role === "exam_officer") && (
            <div>
              <label className={labelCls}>Student</label>
              <select className={selectCls} value={studentId} onChange={(e) => { setStudentId(e.target.value); setStudentRecord(null); }}>
                <option value="">Select student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
          )}
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
        </div>
      </div>

      {studentId && sessionId && termId && (
        loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : results.length === 0 ? (
          <EmptyState icon={Award} title="No published results" description="No published results found for this student in the selected term." />
        ) : (
          <div className="print-sheet bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Header — School branding */}
            <div className="bg-[hsl(var(--brand-navy))] text-white p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  {school?.logo_url && <img src={school.logo_url} alt="logo" className="h-12 mb-2 object-contain" />}
                  <p className="text-xs uppercase tracking-wide text-white/60">{school?.name || "School"}</p>
                  <h2 className="font-heading font-extrabold text-lg sm:text-xl mt-1 break-words">{studentRecord?.full_name}</h2>
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5 break-words">
                    {studentRecord?.admission_number ? `Adm. No: ${studentRecord.admission_number} · ` : ""}
                    {studentRecord?.current_class_name || ""} · {sessions.find((s) => String(s.id) === String(sessionId))?.name} · {terms.find((t) => String(t.id) === String(termId))?.name}
                  </p>
                </div>
                <div className="no-print flex flex-col gap-2 w-full sm:w-auto shrink-0">
                  <select
                    value={templateStyle}
                    onChange={(e) => setTemplateStyle(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white/15 text-white text-xs font-semibold border border-white/20 focus:outline-none w-full sm:w-auto"
                    title="Report Card Template"
                  >
                    <option value="classic" className="text-slate-900">Template: Classic Institutional</option>
                    <option value="modern" className="text-slate-900">Template: Modern Crest</option>
                    <option value="compact" className="text-slate-900">Template: Compact Summary</option>
                  </select>
                  <div className="flex flex-wrap sm:flex-col gap-2">
                    <button onClick={() => downloadPdf(false)} disabled={generatingPdf} className="flex-1 sm:flex-none h-9 px-3 sm:px-4 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold flex items-center justify-center sm:justify-start gap-2 disabled:opacity-50">
                      {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Report PDF
                    </button>
                    <button onClick={() => downloadPdf(true)} disabled={generatingPdf} className="flex-1 sm:flex-none h-9 px-3 sm:px-4 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold flex items-center justify-center sm:justify-start gap-2 disabled:opacity-50">
                      <FileText className="w-4 h-4" /> Transcript PDF
                    </button>
                    <button onClick={() => window.print()} type="button" className="flex-1 sm:flex-none h-9 px-3 sm:px-4 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold flex items-center justify-center sm:justify-start gap-2">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
              <div className="bg-white p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Score</p>
                <p className="text-xl font-heading font-extrabold text-foreground mt-1">{overall.total}</p>
              </div>
              <div className="bg-white p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Average</p>
                <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-indigo))] mt-1">{overall.average}%</p>
              </div>
              <div className="bg-white p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Grade</p>
                <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{overall.grade || "—"}</p>
              </div>
              <div className="bg-white p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Class Position</p>
                <p className="text-xl font-heading font-extrabold text-foreground mt-1">
                  {showPosition ? `${ordinal(remark.class_position)}${remark.class_size ? ` / ${remark.class_size}` : ""}` : "—"}
                </p>
              </div>
            </div>

            {/* Subjects with component breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    {historicalScheme?.components?.map((c) => (
                      <th key={c.key} className="px-3 py-3 font-semibold text-center whitespace-nowrap">{c.label}<span className="block text-[10px] font-normal text-muted-foreground/70">/{c.max_score}</span></th>
                    ))}
                    <th className="px-4 py-3 font-semibold text-center">Total</th>
                    <th className="px-3 py-3 font-semibold text-center">Class Avg</th>
                    <th className="px-3 py-3 font-semibold text-center">Pos.</th>
                    <th className="px-4 py-3 font-semibold text-center">Grade</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground">{r.subject_name}</td>
                      {historicalScheme?.components?.map((c) => (
                        <td key={c.key} className="px-3 py-3 text-center text-muted-foreground">{r.components?.[c.key] ?? "—"}</td>
                      ))}
                      <td className="px-4 py-3 text-center font-bold">{r.total_score}<span className="text-muted-foreground font-normal">/{r.max_total || 100}</span></td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{r.subject_average ?? "—"}</td>
                      <td className="px-3 py-3 text-center font-bold text-[hsl(var(--brand-indigo))]">{r.subject_position_ordinal || (r.subject_position ? ordinal(r.subject_position) : "—")}</td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] font-bold text-xs">{r.grade}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{r.remark || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance + Remarks */}
            <div className="grid sm:grid-cols-2 gap-px bg-border border-t border-border">
              <div className="bg-white p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Attendance</p>
                <p className="text-sm text-foreground">{present} of {attendance.length} days present ({attRate}%)</p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Class Teacher's Remark</p>
                <p className="text-sm text-foreground">{remark?.class_teacher_remark || "—"}</p>
              </div>
              <div className="bg-white p-5 sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Principal's Remark</p>
                <p className="text-sm text-foreground">{remark?.principal_remark || "—"}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}