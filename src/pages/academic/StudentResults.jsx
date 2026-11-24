import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import { FileBarChart, Loader2 } from "lucide-react";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function StudentResults() {
  const { user, schoolId } = useCurrentUser();
  const { sessions: ctxSessions, terms: ctxTerms } = useAcademicContext(schoolId);
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Find the student record linked to this user
      const students = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
      const me = (students || [])[0];
      setStudent(me || null);

      if (me) {
        const res = await base44.entities.Result.filter({ student_user_id: user.id, status: "published" }, "-created_date", 200);
        setResults(res || []);
      }
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const sessions = useMemo(() => {
    if (ctxSessions && ctxSessions.length > 0) return ctxSessions;
    return [...new Set(results.map((r) => JSON.stringify({ id: r.session_id, name: r.session_name })))].map((s) => JSON.parse(s));
  }, [ctxSessions, results]);

  const terms = useMemo(() => {
    if (ctxTerms && ctxTerms.length > 0) {
      return ctxTerms.filter((t) => !sessionId || String(t.session_id) === String(sessionId));
    }
    return [...new Set(results.filter((r) => !sessionId || String(r.session_id) === String(sessionId)).map((r) => JSON.stringify({ id: r.term_id, name: r.term_name })))].map((s) => JSON.parse(s));
  }, [ctxTerms, results, sessionId]);

  const filtered = results.filter((r) => (!sessionId || String(r.session_id) === String(sessionId)) && (!termId || String(r.term_id) === String(termId)));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">My Results</h1>
        <p className="text-sm text-muted-foreground mt-1">{student ? `${student.full_name} · ${student.current_class_name || ""}` : "Your published results will appear here."}</p>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No published results yet" description="Your results will appear here once they are published by your school." />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Session</label>
                <select className={selectCls} value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
                  <option value="">All sessions</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Term</label>
                <select className={selectCls} value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
                  <option value="">All terms</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Grade</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground">{r.subject_name}</td>
                      <td className="px-4 py-3 text-center font-bold">{r.total_score}<span className="text-muted-foreground font-normal">/{r.max_total}</span></td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">{r.grade}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{r.remark || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}